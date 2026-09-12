import type { Metadata } from "next";
import { ReservationLookup } from "@/components/public";

export const metadata: Metadata = {
  title: "Find your reservation — Reserv",
  description: "Find and manage your reservation.",
};

export default function ReservationLookupRoute() {
  return <ReservationLookup />;
}
