"use client";

import { useRouter } from "next/navigation";
import { CustomersPage } from "@/components/manage";
import { useBookingModal } from "@/components/studio-shell";

export default function CustomersRoute() {
  const router = useRouter();
  const { openNewBooking } = useBookingModal();

  return (
    <CustomersPage
      onNew={openNewBooking}
      onBooking={(b) => router.push(`/bookings/${b.id}`)}
    />
  );
}
