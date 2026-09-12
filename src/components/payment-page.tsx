"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { IconArrowLeft, IconArrowUpRight, IconCalendarEvent, IconCheck, IconChevronRight, IconClock, IconCreditCard, IconDownload, IconFileInvoice, IconLock, IconPhone, IconReceipt, IconUser } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/store";
import { dateLabel, duration, getReservationByCode, money, time } from "@/lib/model";
import { EmptyState } from "./shared";

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex items-start justify-between gap-6 py-3 text-[13px]"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium text-foreground">{children}</dd></div>;
}

export function PaymentPage({ code }: { code: string }) {
  const { state } = useStore();
  const [preview, setPreview] = useState<"paid" | "review" | null>(null);
  const [method, setMethod] = useState<"online" | "transfer">("online");
  const [amountChoice, setAmountChoice] = useState<"deposit" | "full">("deposit");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const booking = getReservationByCode(state.bookings, code);
  const service = state.services.find(item => item.id === booking?.serviceId);
  const customer = state.customers.find(item => item.id === booking?.customerId);
  const specialist = state.staff.find(item => item.id === booking?.staffId);

  if (!state.loaded) return <main className="mx-auto w-full max-w-5xl space-y-5 p-8" aria-busy="true" aria-label="Loading payment"><Skeleton className="h-12 w-64" /><Skeleton className="h-96 w-full rounded-3xl" /></main>;
  if (!booking || !service || !customer) return <main className="flex min-h-screen items-center justify-center p-6"><EmptyState title="We couldn’t find that booking." description="Check your reservation code to open its payment details." action={<Link className="text-sm font-medium text-primary" href="/reservation">Find my reservation <IconArrowUpRight className="inline" size={16} /></Link>} /></main>;

  const deposit = Math.max(0, Math.min(service.deposit, service.price));
  const amount = amountChoice === "deposit" && deposit > 0 ? deposit : service.price;
  const isDeposit = amount < service.price;
  const cancelled = booking.status === "Cancelled";
  const phone = `tel:${state.business.phone.replaceAll(" ", "")}`;
  const reference = `RSV-${booking.code}`;
  function downloadSummary() {
    const content = [`${state.business.name} — Booking payment summary`, `Reference: ${reference}`, `Customer: ${customer!.name}`, `Service: ${service!.name}`, `Appointment: ${dateLabel(booking!.startTime, true)}, ${time(booking!.startTime)} WAT`, `Service total: ${money(service!.price)}`, `${isDeposit ? "Deposit" : "Full payment"}: ${money(amount)}`, `Remaining after payment: ${money(service!.price - amount)}`, "UI prototype. Payment has not been collected. This is not a payment receipt."].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${reference}-summary.txt`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <main className="min-h-screen bg-[#fbfbfc] lg:grid lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.15fr)]">
      <aside className="relative isolate flex flex-col overflow-hidden bg-primary px-7 py-8 text-white lg:min-h-screen lg:px-12 lg:py-10 xl:px-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 opacity-15 [background-image:radial-gradient(circle,#fff_1px,transparent_1px)] [background-size:9px_9px] [mask-image:linear-gradient(transparent,black)]" />
        <Link href={`/r/${booking.code}`} className="inline-flex w-fit items-center gap-2 text-[13px] text-white/70 transition hover:text-white"><IconArrowLeft size={17} /> Back to reservation</Link>
        <section className="my-10 w-full max-w-lg self-center lg:my-auto lg:py-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/55">{state.business.name}</p>
          <h1 className="mt-4 text-[30px] font-medium leading-tight tracking-[-0.025em]">A little time,<br />all taken care of.</h1>
          <div className="mt-9 flex items-center justify-between gap-4"><h2 className="text-[18px] font-medium">{service.name}</h2><span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/75">{cancelled ? "Cancelled" : "Payment summary"}</span></div>
          <p className="mt-2 text-[13px] text-white/60">For {customer.name}</p>
          <div className="mt-7 rounded-3xl bg-white/[0.07] p-6 backdrop-blur-sm">
            <dl className="space-y-4 text-[13px]">
              <div className="flex justify-between gap-4"><dt className="text-white/55">Booking reference</dt><dd className="font-mono text-[12px]">{reference}</dd></div>
              <div className="flex justify-between gap-4"><dt className="flex items-center gap-2 text-white/55"><IconCalendarEvent size={15} /> Date</dt><dd className="text-right">{dateLabel(booking.startTime)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="flex items-center gap-2 text-white/55"><IconClock size={15} /> Time</dt><dd>{time(booking.startTime)} · WAT</dd></div>
              <div className="flex justify-between gap-4"><dt className="flex items-center gap-2 text-white/55"><IconUser size={15} /> Specialist</dt><dd>{specialist?.name || "Studio team"}</dd></div>
            </dl>
            <div className="mt-7 flex items-end justify-between gap-4 rounded-2xl bg-white/[0.06] px-4 py-5"><span className="text-[13px] text-white/65">{isDeposit ? "Deposit amount" : "Payment amount"}</span><strong className="text-[30px] font-medium tracking-tight">{money(amount)}</strong></div>
            {isDeposit && <p className="mt-3 text-[12px] leading-5 text-white/55">The remaining {money(service.price - amount)} is payable at your visit.</p>}
          </div>
          <p className="mt-5 text-[12px] leading-6 text-white/55">{state.business.depositPolicy}</p>
        </section>
        <p className="flex items-center gap-2 text-[12px] text-white/45"><IconLock size={15} /> Your appointment, with a little less admin.</p>
      </aside>
      <section className="flex items-center justify-center px-6 py-10 lg:px-12 lg:py-16 xl:px-20">
        <div className="w-full max-w-[600px]">
          <div className="flex items-center justify-between gap-4"><p className="font-mono text-[11px] font-medium tracking-[0.08em] text-muted-foreground">BOOKING {booking.code}</p><span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">{cancelled ? "Cancelled" : "UI preview"}</span></div>
          <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.025em] text-foreground">{cancelled ? "This booking was cancelled." : "Complete your payment"}</h2>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{cancelled ? "No payment can be made for this reservation." : "Your booking details, payment options, and everything in between."}</p>
          <h3 className="mb-3 mt-8 text-[13px] font-semibold">Booking details</h3>
          <dl className="rounded-2xl bg-muted/70 px-5"><Detail label="Customer">{customer.name}</Detail><Detail label="Service">{service.name} · {duration(service.duration)}</Detail><Detail label="Service total">{money(service.price)}</Detail></dl>
          {!cancelled && preview && <div role="status" className="mt-7 rounded-3xl bg-accent p-7">
            <span className="mb-5 flex size-12 items-center justify-center rounded-full bg-white text-primary">{preview === "paid" ? <IconCheck size={25} /> : <IconReceipt size={25} />}</span>
            <h3 className="text-[21px] font-semibold tracking-tight text-primary">{preview === "paid" ? "You’re all set." : "Ready for review."}</h3>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{preview === "paid" ? `This previews a successful ${money(amount)} ${isDeposit ? "deposit" : "payment"}. No money was charged.` : "This previews the receipt-review confirmation. Your receipt has not been uploaded or sent to the studio."}</p>
            <div className="mt-5 flex flex-wrap items-center gap-4"><Link href={`/r/${booking.code}`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-medium text-white">View reservation <IconArrowUpRight size={16} /></Link><Button variant="ghost" onClick={() => setPreview(null)}>Back to payment options</Button></div>
          </div>}
          {!cancelled && !preview && <>
            {deposit > 0 && deposit < service.price && <fieldset className="mt-7"><legend className="mb-3 text-[13px] font-semibold">How much would you like to pay?</legend><div className="grid grid-cols-2 gap-3">{(["deposit", "full"] as const).map(choice => <label key={choice} className={`relative flex cursor-pointer items-center gap-3 rounded-2xl p-4 text-[13px] transition ${amountChoice === choice ? "bg-accent text-primary" : "bg-muted/70 text-muted-foreground"}`}><input type="radio" name="payment-amount" checked={amountChoice === choice} onChange={() => setAmountChoice(choice)} className="size-4 accent-primary" /><span><span className="block text-[12px]">{choice === "deposit" ? "Pay deposit" : "Pay in full"}</span><strong className="mt-1 block font-semibold">{money(choice === "deposit" ? deposit : service.price)}</strong></span></label>)}</div></fieldset>}
            <fieldset className="mt-7"><legend className="mb-3 text-[13px] font-semibold">Payment method</legend><div className="space-y-2">{([{ id: "online", title: "Pay online", description: "Continue to a secure payment checkout.", icon: IconCreditCard }, { id: "transfer", title: "I’ve already made a transfer", description: "Share your receipt with the studio for review.", icon: IconReceipt }] as const).map(item => <label key={item.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl p-4 transition ${method === item.id ? "bg-primary text-white" : "bg-muted/70 text-foreground"}`}><input type="radio" name="payment-method" className="sr-only peer" checked={method === item.id} onChange={() => setMethod(item.id)} /><span className={`flex size-10 shrink-0 items-center justify-center rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${method === item.id ? "bg-white/10" : "bg-white"}`}><item.icon size={19} stroke={1.6} /></span><span className="flex-1"><strong className="block text-[13px] font-medium">{item.title}</strong><span className={`mt-1 block text-[12px] leading-5 ${method === item.id ? "text-white/65" : "text-muted-foreground"}`}>{item.description}</span></span>{method === item.id ? <IconCheck size={18} /> : <IconChevronRight size={17} className="text-muted-foreground" />}</label>)}</div></fieldset>
            <div className="mt-4 rounded-2xl bg-muted/70 p-5">
              {method === "online" ? <><div className="mb-4 flex items-center justify-between text-[13px]"><span className="text-muted-foreground">{isDeposit ? "Deposit" : "Full payment"}</span><strong className="font-semibold">{money(amount)}</strong></div><Button onClick={() => setPreview("paid")} className="h-11 w-full gap-2 rounded-xl"><IconLock size={16} /> Pay {money(amount)}</Button><p className="mt-3 text-[12px] leading-5 text-muted-foreground">UI preview only. Continue to preview the confirmation; no real payment will be taken.</p></> : <><h4 className="text-[13px] font-medium">Your transfer receipt</h4><p id="receipt-help" className="mt-1 text-[12px] leading-5 text-muted-foreground">JPG, PNG, WebP, or PDF, up to 8 MB.</p><Input aria-label="Choose transfer receipt" aria-describedby="receipt-help receipt-status" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-4 h-auto min-h-10 bg-white p-2 text-[12px]" onChange={event => { const file = event.target.files?.[0]; setReceipt(null); setFileError(""); if (!file) return; if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type) || file.size > 8 * 1024 * 1024 || file.size === 0) { setFileError("Choose a non-empty JPG, PNG, WebP, or PDF under 8 MB."); event.target.value = ""; return; } setReceipt(file); }} />{fileError && <p role="alert" className="mt-2 text-[12px] text-destructive">{fileError}</p>}{receipt && <div className="mt-3 flex items-center gap-2 text-[12px]"><IconFileInvoice size={16} /><span className="min-w-0 flex-1 truncate">{receipt.name}</span><span className="text-muted-foreground">{(receipt.size / 1024).toFixed(0)} KB</span></div>}<p id="receipt-status" className="mt-3 text-[12px] leading-5 text-muted-foreground">UI preview only. Your file stays on this device and won’t be uploaded.</p><Button disabled={!receipt || !!fileError} onClick={() => setPreview("review")} className="mt-4 h-10 w-full rounded-xl">Submit for review</Button></>}
            </div>
          </>}
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 text-[12px]"><button onClick={downloadSummary} className="inline-flex items-center gap-2 font-medium text-primary hover:underline"><IconDownload size={16} /> Download summary</button><a href={phone} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary"><IconPhone size={16} /> Need a hand?</a></div>
          <p className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground"><IconLock size={14} /> No card details are collected on this page.</p>
        </div>
      </section>
    </main>
  );
}
