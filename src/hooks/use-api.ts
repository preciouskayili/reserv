"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, type BookingPayload } from "@/lib/api";
import { toast } from "sonner";

export interface CallItem {
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
}

// 1. Health Diagnostics Query
export function useBackendHealthQuery() {
  return useQuery({
    queryKey: ["backend-health"],
    queryFn: () => api.health(),
    staleTime: 30 * 1000,
    retry: false,
  });
}

// 2. Call Logs Query
export function useCallsQuery(limit = 50) {
  return useQuery({
    queryKey: ["calls", limit],
    queryFn: async () => {
      const res = await api.calls.list(limit);
      return res.calls;
    },
    // Poll every 8 seconds if there are active calls in progress
    refetchInterval: (query) => {
      const calls = query.state.data;
      const hasActive = calls?.some((c) =>
        ["queued", "ringing", "in-progress"].includes(c.status)
      );
      return hasActive ? 8000 : false;
    },
  });
}

// 3. Trigger Voice Call Mutation with OPTIMISTIC UPDATE
export function useTriggerCallMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      toNumber: string;
      customerName?: string;
      serviceName?: string;
      appointmentTime?: string;
      appointmentDate?: string;
      callType?: "reminder" | "confirmation" | "unpaid_checkin" | "manual";
      bookingId?: string;
    }) => api.calls.trigger(payload),

    onMutate: async (newCallPayload) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["calls"] });

      // Snapshot previous call list
      const previousCalls = queryClient.getQueryData<CallItem[]>(["calls", 50]) || [];

      // Optimistic temporary item
      const optimisticCall: CallItem = {
        id: `optimistic_${Date.now()}`,
        booking_id: newCallPayload.bookingId || null,
        aethex_call_id: "dispatching...",
        to_number: newCallPayload.toNumber,
        from_number: "+14155550000",
        status: "queued",
        call_type: newCallPayload.callType || "reminder",
        duration_seconds: null,
        created_at: new Date().toISOString(),
      };

      // Optimistically update the cache immediately
      queryClient.setQueryData<CallItem[]>(["calls", 50], (old) => [
        optimisticCall,
        ...(old || []),
      ]);

      return { previousCalls };
    },

    onError: (err, _variables, context) => {
      // Rollback on failure
      if (context?.previousCalls) {
        queryClient.setQueryData(["calls", 50], context.previousCalls);
      }
      const msg = err instanceof Error ? err.message : "Failed to place call";
      toast.error(msg);
    },

    onSuccess: (data) => {
      toast.success(data.message || "Call dispatched via Aethex Voice AI");
    },

    onSettled: () => {
      // Revalidate to sync canonical data
      queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
  });
}

// 4. Bookings Query
export function useBookingsQuery() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: () => api.bookings.list(),
    staleTime: 60 * 1000,
  });
}

// 5. Create Booking Mutation with OPTIMISTIC UPDATE
export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BookingPayload) => api.bookings.create(payload),

    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save booking");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
