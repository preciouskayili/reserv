"use client";

import { useRouter } from "next/navigation";
import { BookingsPage } from "@/components/schedule";
import { useBookingModal } from "@/components/studio-shell";

export default function BookingsRoute() {
  const router = useRouter();
  const { openNewBooking } = useBookingModal();

  return (
    <BookingsPage
      onNew={openNewBooking}
      onBooking={(b) => router.push(`/bookings/${b.id}`)}
    />
  );
}
