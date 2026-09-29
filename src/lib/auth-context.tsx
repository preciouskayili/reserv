"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  ApiError,
  clearStoredToken,
  clearStoredWorkspaceId,
  getStoredToken,
  setStoredToken,
} from "./api";
import { useQueryClient } from "@tanstack/react-query";
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
  sessionError: string | null;
  retrySession: () => void;
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

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Reads the user from an unexpired session token without verifying it; the server still verifies every request. */
function sessionFromToken(token: string): AuthUser | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const bytes = Uint8Array.from(atob(part.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) return null;
    if (typeof payload.id !== "string" || typeof payload.email !== "string") return null;
    return { id: payload.id, email: payload.email, name: String(payload.name ?? ""), role: payload.role, businessId: String(payload.businessId ?? "") };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient=useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [sessionError, setSessionError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Restore the stored session before the first paint. The token already carries the user, so the app
  // renders immediately and the server check runs in the background instead of blocking every page load.
  useIsomorphicLayoutEffect(() => {
    let active = true;
    const savedToken = getStoredToken();
    if (!savedToken) {
      setIsLoading(false);
      return;
    }
    const optimistic = sessionFromToken(savedToken);
    if (optimistic) {
      // Keep the cookie (read by the route guard) in step with local storage; a missing cookie caused login redirect loops.
      setStoredToken(savedToken);
      setToken(savedToken);
      setUser(optimistic);
      setIsLoading(false);
    }
    async function verify() {
      try {
        const { user: fetchedUser } = await api.auth.getMe();
        if (!active) return;
        setToken(savedToken);
        setUser(fetchedUser as AuthUser);
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          clearStoredToken();
          setToken(null);
          setUser(null);
        } else if (!optimistic) {
          setSessionError("We couldn’t check your session. Your sign-in has been kept; try reconnecting.");
        }
        // With a readable, unexpired token a network blip keeps the session; the next request re-checks it.
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void verify();
    return () => { active = false; };
  }, [attempt]);

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
      setSessionError(null);
      toast.success("Welcome back!");
      return response.user;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Invalid code";
      toast.error(msg);
      throw error;
    }
  };

  const logout = () => {
    clearStoredWorkspaceId();
    queryClient.clear();
    clearStoredToken();
    setSessionError(null);
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
        sessionError,
        retrySession: () => { setSessionError(null); setIsLoading(true); setAttempt((value) => value + 1); },
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
