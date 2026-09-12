export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:4100";

export const AUTH_TOKEN_KEY = "reserv_auth_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  const local = localStorage.getItem(AUTH_TOKEN_KEY);
  if (local) return local;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${AUTH_TOKEN_KEY}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax`;
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg =
      (data && typeof data === "object" && "message" in data
        ? (data as { message: string }).message
        : null) ||
      (data && typeof data === "object" && "error" in data
        ? (data as { error: string }).error
        : null) ||
      response.statusText;
    throw new Error(errorMsg || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    sendOtp: (email: string) =>
      request<{
        success: boolean;
        message: string;
        email: string;
        expiresInSeconds: number;
        simulated?: boolean;
        devCode?: string;
      }>("/api/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    verifyOtp: (email: string, code: string) =>
      request<{
        success: boolean;
        token: string;
        user: {
          id: string;
          email: string;
          name: string;
          role: "owner" | "admin" | "staff" | "customer";
          businessId: string;
        };
        message: string;
      }>("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      }),

    getMe: () =>
      request<{
        user: {
          id: string;
          email: string;
          name: string;
          role: string;
          businessId: string;
        };
      }>("/api/auth/me"),
  },

  // Calls
  calls: {
    trigger: (payload: {
      toNumber: string;
      customerName?: string;
      serviceName?: string;
      appointmentTime?: string;
      appointmentDate?: string;
      callType?: "reminder" | "confirmation" | "unpaid_checkin" | "manual";
      bookingId?: string;
    }) =>
      request<{
        message: string;
        call: {
          id: string;
          booking_id?: string;
          aethex_call_id?: string;
          to_number: string;
          from_number: string;
          status: string;
          call_type: string;
          created_at: string;
        };
        aethex_call_id: string;
      }>("/api/calls/trigger", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    list: (limit = 50) =>
      request<{
        calls: Array<{
          id: string;
          booking_id?: string | null;
          aethex_call_id?: string | null;
          to_number: string;
          from_number: string;
          status: string;
          call_type: string;
          duration_seconds?: number | null;
          cost_cents?: number | null;
          created_at: string;
        }>;
        total: number;
      }>(`/api/calls?limit=${limit}`),

    get: (id: string) =>
      request<{
        call: {
          id: string;
          booking_id?: string | null;
          aethex_call_id?: string | null;
          to_number: string;
          status: string;
          duration_seconds?: number | null;
          created_at: string;
        };
      }>(`/api/calls/${id}`),
  },

  // Bookings
  bookings: {
    list: () =>
      request<{
        configured: boolean;
        bookings: any[];
      }>("/api/bookings"),

    get: (id: string) =>
      request<{
        booking: any;
      }>(`/api/bookings/${id}`),

    create: (payload: any) =>
      request<{
        booking: any;
      }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },

  // System
  health: () =>
    request<{
      status: string;
      service: string;
      integrations: {
        supabase: string;
        aethex: string;
        resend: string;
      };
    }>("/health"),
};
