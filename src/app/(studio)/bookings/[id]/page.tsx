"use client";

import { use } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { BookingDetails } from "@/components/booking-details";
import { EmptyState } from "@/components/shared";

export default function BookingDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { state } = useStore();
  const booking = state.bookings.find((b) => b.id === id);

  if (!booking) {
    return (
      <EmptyState
        title={
          state.loaded ? "Reservation not found." : "Finding your reservation…"
        }
        description="Your reservations are saved in this browser’s demo workspace."
        action={
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[#e5e5e7] bg-card px-4 text-[11px] font-semibold text-[#303033] transition hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"
            href="/bookings"
          >
            All reservations
          </Link>
        }
      />
    );
  }

  return <BookingDetails key={booking.id} booking={booking} />;
}
