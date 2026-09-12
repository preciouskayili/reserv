import type { Metadata } from "next";
import { ReservationLookup } from "@/components/public";

export const metadata: Metadata = {
  title: "Your reservation — Reserv",
  robots: { index: false, follow: false },
};

export default async function ReservationCodeRoute({
  params,
}: {
  params: Promise<{ code?: string }>;
}) {
  const { code = "" } = (await params) || {};
  return <ReservationLookup code={code} />;
}
