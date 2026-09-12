"use client";

import { useRouter } from "next/navigation";
import { CalendarPage } from "@/components/schedule";
import { useBookingModal } from "@/components/studio-shell";

export default function HomePage() {
  const router = useRouter();
  const { openNewBooking } = useBookingModal();

  return (
    <CalendarPage
      onNew={openNewBooking}
      onBooking={(b) => router.push(`/bookings/${b.id}`)}
    />
  );
}
