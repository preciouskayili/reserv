"use client";

import { useState, useRef, type ReactNode } from "react";
import Link from "next/link";
import { IconArrowLeft, IconArrowUpRight, IconCalendarEvent, IconCheck, IconClock, IconDownload, IconFileInvoice, IconLock, IconPhone, IconReceipt, IconUser } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentSummary } from "@/lib/payments";
import { saveReceipt } from "@/lib/receipts";
import { useStore } from "@/lib/store";
import { dateLabel, duration, getReservationByCode, money, time } from "@/lib/model";
import { CheckoutOptions } from "./checkout-options";
import { EmptyState } from "./shared";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex items-start justify-between gap-6 py-3 text-[13px]"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium text-foreground">{children}</dd></div>;
}

export function PaymentPage({ code }: { code: string }) {
  const { state, acceptSnapshot } = useStore();
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [checkoutLocked, setCheckoutLocked] = useState(false);
  const [amountChoice, setAmountChoice] = useState<"deposit" | "full">("deposit");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const booking = getReservationByCode(state.bookings, code);
  const service = state.services.find(item => item.id === booking?.serviceId);
  const customer = state.customers.find(item => item.id === booking?.customerId);
  const specialist = state.staff.find(item => item.id === booking?.staffId);

  if (!state.loaded) {
    return (
      <main
        className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(380px,460px)_1fr]"
        aria-busy="true"
        aria-label="Loading payment"
      >
        <aside
          aria-hidden="true"
          className="relative flex flex-col justify-between bg-primary p-6 text-primary-foreground sm:p-10 lg:min-h-screen lg:p-12 xl:p-16"
        >
          <Skeleton className="h-4 w-32 bg-card/20" />
          <section className="my-10 w-full max-w-lg self-center lg:my-auto lg:py-16">
            <Skeleton className="h-3 w-24 bg-card/20" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-8 w-4/5 bg-card/20" />
              <Skeleton className="h-8 w-3/5 bg-card/20" />
            </div>
            <div className="mt-9 flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-36 bg-card/20" />
              <Skeleton className="h-6 w-28 rounded-full bg-card/20" />
            </div>
            <Skeleton className="mt-2 h-4 w-28 bg-card/20" />
            <div className="mt-7 rounded-3xl bg-card/[0.07] p-6 backdrop-blur-sm">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between gap-4">
                    <Skeleton className="h-3.5 w-24 bg-card/20" />
                    <Skeleton className="h-3.5 w-28 bg-card/20" />
                  </div>
                ))}
              </div>
              <div className="mt-7 flex items-end justify-between gap-4 rounded-2xl bg-primary-foreground/[0.06] px-4 py-5">
                <Skeleton className="h-4 w-28 bg-card/20" />
                <Skeleton className="h-8 w-24 bg-card/20" />
              </div>
            </div>
          </section>
          <Skeleton className="h-4 w-48 bg-card/20" />
        </aside>

        <section
          aria-hidden="true"
          className="flex items-center justify-center px-6 py-10 lg:px-12 lg:py-16 xl:px-20"
        >
          <div className="w-full max-w-[600px] space-y-6">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="rounded-2xl bg-muted/70 p-5 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="space-y-3 pt-4">
              <Skeleton className="h-20 w-full rounded-2xl bg-muted/70" />
              <Skeleton className="h-20 w-full rounded-2xl bg-muted/70" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </section>
      </main>
    );
  }
  if (!booking || !service || !customer) return <main className="flex min-h-screen items-center justify-center p-6"><EmptyState title="We couldn’t find that booking." description="Check your reservation code to open its payment details." action={<Link className="text-sm font-medium text-primary" href="/reservation">Find my reservation <IconArrowUpRight className="inline" size={16} /></Link>} /></main>;

  const summary = paymentSummary(state, booking);
  const deposit = summary.required;
  const amount = amountChoice === "deposit" && deposit > 0 ? Math.max(0, deposit - summary.paid) : summary.remaining;
  const isDeposit = summary.required < summary.total && amountChoice === "deposit";
  const cancelled = ["Cancelled", "Completed"].includes(booking.status);
  const adjusted = state.payments?.some(p => p.bookingId === booking.id && ((p.refundedAmount ?? 0) > 0 || p.disputed || p.needsReview));
  const preview = adjusted ? "adjusted" : summary.confirmed ? "paid" : summary.pending ? "review" : null;
  async function pay() {
    if (submitting.current || preview || cancelled || checkoutLocked) return;
    submitting.current = true; setBusy(true); setFileError("");
    try {
      if (!receipt) throw new Error("Choose a receipt first.");
      acceptSnapshot(await saveReceipt(booking!.code,receipt,amount));
    } catch (error) { setFileError(error instanceof Error ? error.message : "Could not save payment. Please try again."); }
    finally { submitting.current = false; setBusy(false); }
  }
  const phone = `tel:${state.business.phone.replaceAll(" ", "")}`;
  const reference = `RSV-${booking.code}`;
  function downloadSummary() {
    const content = [`${state.business.name} — Booking payment summary`, `Reference: ${reference}`, `Customer: ${customer!.name}`, `Service: ${service!.name}`, `Appointment: ${dateLabel(booking!.startTime, true)}, ${time(booking!.startTime)} WAT`, `Service total: ${money(summary.total)}`, `${isDeposit ? "Deposit" : "Full payment"}: ${money(amount)}`, `Remaining after payment: ${money(Math.max(0, summary.total - summary.paid - amount))}`, "Appointment summary only. This is not a payment receipt."].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${reference}-summary.txt`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.15fr)]">
      <aside className="relative isolate flex flex-col overflow-hidden bg-primary px-7 py-8 text-primary-foreground lg:min-h-screen lg:px-12 lg:py-10 xl:px-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 opacity-15 [background-image:radial-gradient(circle,#fff_1px,transparent_1px)] [background-size:9px_9px] [mask-image:linear-gradient(transparent,black)]" />
        <Link href={`/r/${booking.code}`} className="inline-flex w-fit items-center gap-2 text-[13px] text-primary-foreground/70 transition hover:text-primary-foreground"><IconArrowLeft size={17} /> Back to reservation</Link>
        <section className="my-10 w-full max-w-lg self-center lg:my-auto lg:py-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary-foreground/55">{state.business.name}</p>
          <h1 className="mt-4 text-[30px] font-medium leading-tight tracking-[-0.025em]">A little time,<br />all taken care of.</h1>
          <div className="mt-9 flex items-center justify-between gap-4"><h2 className="text-[18px] font-medium">{service.name}</h2><span className="shrink-0 rounded-full bg-primary-foreground/10 px-3 py-1 text-[11px] text-primary-foreground/75">{cancelled ? booking.status : "Payment summary"}</span></div>
          <p className="mt-2 text-[13px] text-primary-foreground/60">For {customer.name}</p>
          <div className="mt-7 rounded-3xl bg-card/[0.07] p-6 backdrop-blur-sm">
            <dl className="space-y-4 text-[13px]">
              <div className="flex justify-between gap-4"><dt className="text-primary-foreground/55">Booking reference</dt><dd className="font-mono text-[12px]">{reference}</dd></div>
              <div className="flex justify-between gap-4"><dt className="flex items-center gap-2 text-primary-foreground/55"><IconCalendarEvent size={15} /> Date</dt><dd className="text-right">{dateLabel(booking.startTime)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="flex items-center gap-2 text-primary-foreground/55"><IconClock size={15} /> Time</dt><dd>{time(booking.startTime)} · WAT</dd></div>
              <div className="flex justify-between gap-4"><dt className="flex items-center gap-2 text-primary-foreground/55"><IconUser size={15} /> Specialist</dt><dd>{specialist?.name || "Studio team"}</dd></div>
            </dl>
            <div className="mt-7 flex items-end justify-between gap-4 rounded-2xl bg-primary-foreground/[0.06] px-4 py-5"><span className="text-[13px] text-primary-foreground/65">{isDeposit ? "Deposit amount" : "Payment amount"}</span><strong className="text-[30px] font-medium tracking-tight">{money(amount)}</strong></div>
            {isDeposit && <p className="mt-3 text-[12px] leading-5 text-primary-foreground/55">The remaining {money(Math.max(0, summary.total - summary.paid - amount))} is payable at your visit.</p>}
          </div>
          <p className="mt-5 text-[12px] leading-6 text-primary-foreground/55">{state.business.depositPolicy}</p>
        </section>
        <p className="flex items-center gap-2 text-[12px] text-primary-foreground/45"><IconLock size={15} /> Your appointment, with a little less admin.</p>
      </aside>
      <section className="flex items-center justify-center px-6 py-10 lg:px-12 lg:py-16 xl:px-20">
        <div className="w-full max-w-[600px]">
          <div className="flex items-center justify-between gap-4"><p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground">BOOKING {booking.code}</p><span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">{cancelled ? booking.status : preview === "paid" ? "Confirmed" : preview === "adjusted" ? "Needs attention" : preview === "review" ? "Under review" : "Awaiting payment"}</span></div>
          <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.025em] text-foreground">{cancelled ? booking.status === "Completed" ? "This booking is complete." : "This booking was cancelled." : "Complete your payment"}</h2>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{cancelled ? "No payment can be made for this reservation." : "Your booking details, payment options, and everything in between."}</p>
          <h3 className="mb-3 mt-8 text-[13px] font-semibold">Booking details</h3>
          <dl className="rounded-2xl bg-muted/70 px-5"><Detail label="Customer">{customer.name}</Detail><Detail label="Service">{service.name} · {duration(service.duration)}</Detail><Detail label="Service total">{money(summary.total)}</Detail></dl>
          {!cancelled && preview && <div role="status" className="mt-7 rounded-3xl bg-accent p-7">
            <span className="mb-5 flex size-12 items-center justify-center rounded-full bg-card text-primary">{preview === "paid" ? <IconCheck size={25} /> : <IconReceipt size={25} />}</span>
            <h3 className="text-[21px] font-semibold tracking-tight text-primary">{preview === "adjusted" ? "Let’s check this payment." : preview === "paid" ? "You’re all set." : "Ready for review."}</h3>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{preview === "adjusted" ? "This payment needs the studio’s attention. Contact them before making another payment." : preview === "paid" ? `Your booking is confirmed after ${money(summary.paid)} in approved payments${summary.remaining > 0 ? `. Remaining at your visit: ${money(summary.remaining)}` : ""}` : "Your receipt is saved and awaiting the studio’s review. Your booking will be confirmed only after the owner approves it."}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4"><Link href={`/r/${booking.code}`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground">View reservation <IconArrowUpRight size={16} /></Link></div>
          </div>}
          {!cancelled && !preview && <>
            {summary.latest?.status === "rejected" && <div role="status" className="mt-5 rounded-2xl bg-danger-surface p-4 text-[13px] text-destructive"><strong>Receipt not approved</strong><p className="mt-1">{summary.latest.rejectionReason}</p><p className="mt-2">Upload a new receipt or contact the business.</p></div>}
            {deposit > 0 && deposit < summary.total && <fieldset className="mt-7"><legend className="mb-3 text-[13px] font-semibold">How much would you like to pay?</legend><div className="grid grid-cols-2 gap-3">{(["deposit", "full"] as const).map(choice => <label key={choice} className={`relative flex cursor-pointer items-center gap-3 rounded-2xl p-4 text-[13px] transition ${amountChoice === choice ? "bg-accent text-primary" : "bg-muted/70 text-muted-foreground"}`}><input type="radio" name="payment-amount" disabled={checkoutLocked || busy} checked={amountChoice === choice} onChange={() => setAmountChoice(choice)} className="size-4 accent-primary" /><span><span className="block text-[12px]">{choice === "deposit" ? "Pay deposit" : "Pay in full"}</span><strong className="mt-1 block font-semibold">{money(choice === "deposit" ? deposit : summary.total)}</strong></span></label>)}</div></fieldset>}
            <CheckoutOptions externalBusy={busy} code={booking.code} choice={amountChoice} amount={amount} onSnapshot={acceptSnapshot} onLock={setCheckoutLocked}>
              <><h4 className="text-[13px] font-medium">Your transfer receipt</h4><p id="receipt-help" className="mt-1 text-[12px] leading-5 text-muted-foreground">JPG, PNG, WebP, or PDF, up to 8 MB.</p><Input disabled={busy} aria-label="Choose transfer receipt" aria-describedby="receipt-help receipt-status" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-4 h-auto min-h-10 bg-card p-2 text-[12px]" onChange={event => { const file = event.target.files?.[0]; setReceipt(null); setFileError(""); if (!file) return; if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type) || file.size > 8 * 1024 * 1024 || file.size === 0) { setFileError("Choose a non-empty JPG, PNG, WebP, or PDF under 8 MB."); event.target.value = ""; return; } setReceipt(file); }} />{fileError && <p role="alert" className="mt-2 text-[12px] text-destructive">{fileError}</p>}{receipt && <div className="mt-3 flex items-center gap-2 text-[12px]"><IconFileInvoice size={16} /><span className="min-w-0 flex-1 truncate">{receipt.name}</span><span className="text-muted-foreground">{(receipt.size / 1024).toFixed(0)} KB</span></div>}<p id="receipt-status" className="mt-3 text-[12px] leading-5 text-muted-foreground">Your receipt is stored privately and shared only with this business for review.</p><Button loading={busy} loadingText="Saving receipt…" disabled={!receipt || busy} onClick={pay} className="mt-4 h-10 w-full rounded-xl">{busy ? "Saving receipt…" : "Submit for review"}</Button></>
            </CheckoutOptions>
          </>}
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 text-[12px]"><button onClick={downloadSummary} className="inline-flex items-center gap-2 font-medium text-primary hover:underline"><IconDownload size={16} /> Download summary</button><a href={phone} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary"><IconPhone size={16} /> Need a hand?</a></div>
          <p className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground"><IconLock size={14} /> No card details are collected on this page.</p>
        </div>
      </section>
    </main>
  );
}
