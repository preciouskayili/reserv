import type { AppState, Booking } from "./model";
export interface BookingPayload { serviceId: string; staffId: string; startTime: string; name: string; phone: string; notes: string; }
export type ApiBooking = Booking;
export interface Snapshot { state: AppState; revision: number; }
export interface BookingsResponse { configured: boolean; bookings: Booking[]; }
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:4100";

export const AUTH_TOKEN_KEY = "reserv_auth_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const local = localStorage.getItem(AUTH_TOKEN_KEY);
    if (local) return local;
  } catch { /* Fall back to the session cookie if storage is unavailable. */ }

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${AUTH_TOKEN_KEY}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(AUTH_TOKEN_KEY, token); } catch { /* Cookie fallback. */ }
  document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(AUTH_TOKEN_KEY); } catch { /* Still clear the cookie. */ }
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

export const WORKSPACE_STORAGE_KEY = "reserv_workspace_id";

export function getStoredWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(WORKSPACE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredWorkspaceId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
  } catch {}
}

export function clearStoredWorkspaceId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  } catch {}
}

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();
  const workspaceId = getStoredWorkspaceId();

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (workspaceId && !headers["x-workspace-id"]) {
    headers["x-workspace-id"] = workspaceId;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(15000),
      headers,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)
      ? "The request took too long. Please try again."
      : "We couldn’t reach the server. Check your connection and try again.", 0);
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  let data;
  try {
    data = isJson ? await response.json() : await response.text();
  } catch {
    throw new ApiError("The server returned an unreadable response. Please try again.", response.status >= 400 ? response.status : 502);
  }
  if (response.ok && !isJson) throw new ApiError("The server returned an unexpected response. Please try again.", 502);

  if (!response.ok) {
    const errorMsg =
      (data && typeof data === "object" && "message" in data
        ? (data as { message: string }).message
        : null) ||
      (data && typeof data === "object" && "error" in data
        ? (data as { error: string }).error
        : null) ||
      response.statusText;
    throw new ApiError(errorMsg || `Request failed with status ${response.status}`, response.status);
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
        bookings: ApiBooking[];
      }>("/api/bookings"),

    get: (id: string) =>
      request<{
        booking: ApiBooking;
      }>(`/api/bookings/${id}`),

    create: (payload: BookingPayload) =>
      request<{
        booking: ApiBooking; snapshot: Snapshot;
      }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },

  // Workspaces (Multi-tenancy)
  workspaces: {
    list: () =>
      request<{
        workspaces: Array<{
          id: string;
          name: string;
          slug: string;
          role: string;
        }>;
      }>("/api/workspaces"),

    create: (payload: {
      name: string;
      slug: string;
      owner: string;
      category: string;
      phone: string;
      address: string;
      serviceName: string;
      duration: number;
      price: number;
    }) =>
      request<{
        state: AppState;
        revision: number;
      }>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    checkSlug: (slug: string) =>
      request<{
        available: boolean;
        suggestedSlug?: string;
      }>(`/api/workspaces/check-slug?slug=${encodeURIComponent(slug)}`),

    getState: (id: string) =>
      request<{
        state: AppState;
        revision: number;
      }>(`/api/workspaces/${id}/state`),

    saveState: (id: string, revision: number, state: AppState) =>
      request<{
        state: AppState;
        revision: number;
      }>(`/api/workspaces/${id}/state`, {
        method: "PUT",
        body: JSON.stringify({ revision, state }),
      }),
  },

  // Public Endpoints
  public: {
    getBusiness: (slug: string) =>
      request<{
        state: AppState;
        revision: number;
      }>(`/api/public/businesses/${slug}`),

    createBooking: (slug: string, payload: BookingPayload) =>
      request<{
        booking: Booking;
        snapshot: { state: AppState; revision: number };
      }>(`/api/public/businesses/${slug}/bookings`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    getReservation: (code: string) =>
      request<{
        state: AppState;
        revision: number;
      }>(`/api/public/reservations/${code}`),

    changeReservation: (code: string, payload: { action: "cancel" } | { action: "reschedule"; startTime: string; staffId: string }) =>
      request<{
        state: AppState;
        revision: number;
      }>(`/api/public/reservations/${code}`, {
        method: "PATCH",
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
