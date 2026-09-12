import type { Metadata } from "next";
import { PaymentPage } from "@/components/payment-page";

export const metadata: Metadata = {
  title: "Complete your payment — Reserv",
  robots: { index: false, follow: false },
};

export default async function PaymentRoute({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <PaymentPage code={code} />;
}
