"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "./api";
import { toast } from "sonner";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "staff" | "customer";
  businessId: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requestOtp: (email: string) => Promise<{
    success: boolean;
    message: string;
    email: string;
    expiresInSeconds: number;
    simulated?: boolean;
    devCode?: string;
  }>;
  verifyOtp: (email: string, code: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check stored session on mount
  useEffect(() => {
    const savedToken = getStoredToken();
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    setToken(savedToken);
    api.auth
      .getMe()
      .then(({ user: fetchedUser }) => {
        setUser(fetchedUser as AuthUser);
      })
      .catch(() => {
        clearStoredToken();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const requestOtp = async (email: string) => {
    try {
      const response = await api.auth.sendOtp(email);
      return response;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to send code";
      toast.error(msg);
      throw error;
    }
  };

  const verifyOtp = async (email: string, code: string) => {
    try {
      const response = await api.auth.verifyOtp(email, code);
      setStoredToken(response.token);
      setToken(response.token);
      setUser(response.user);
      toast.success("Welcome back!");
      return response.user;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Invalid code";
      toast.error(msg);
      throw error;
    }
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    toast.success("Signed out");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        requestOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
