"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowUpRight, IconCheck, IconCreditCard, IconFileInvoice, IconSearch, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { money, type Payment } from "@/lib/model";
import { paymentSummary, reviewPayment } from "@/lib/payments";
import { readReceipt } from "@/lib/receipts";
import { PageHeader, Modal, EmptyState } from "./shared";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

function ReceiptPreview({ payment, onReady }: { payment: Payment; onReady: (ready: boolean) => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let disposed = false;
    let objectUrl = "";
    readReceipt(payment.receiptId!).then(blob => {
      if (disposed) return;
      if (!blob) { setError("This receipt is unavailable in this browser. Ask the customer to submit it again."); return; }
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); onReady(true);
    }).catch(() => { if (!disposed) setError("Could not load the receipt. Try reopening this review."); });
    return () => { disposed = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [payment.receiptId, onReady]);
  if (error) return <p role="alert" className="rounded-xl bg-danger-surface p-4 text-[13px] text-destructive">{error}</p>;
  if (!url) return <p className="text-sm text-muted-foreground">Loading receipt…</p>;
  return <div className="rounded-2xl bg-muted p-5"><div className="flex items-center gap-3"><IconFileInvoice size={25} className="text-primary" /><span className="min-w-0 flex-1 truncate text-[13px] font-medium">{payment.receiptName}</span></div><a href={url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[13px] font-medium text-primary">Open receipt <IconArrowUpRight size={16} /></a><p className="mt-3 text-[12px] text-muted-foreground">Check the amount and transaction details before approving.</p></div>;
}

function PaymentReview({ payment, close }: { payment: Payment; close: () => void }) {
  const { state, update } = useStore();
  const [reason, setReason] = useState("");
  const [ready, setReady] = useState(false);
  const booking = state.bookings.find(b => b.id === payment.bookingId)!;
  const current = state.payments?.find(p => p.id === payment.id);
  const canReview = current?.status === "review";
  function decide(decision: "approved" | "rejected") {
    if (!canReview || (decision === "rejected" && !reason.trim())) return;
    update(s => reviewPayment(s, payment.id, decision, reason));
    toast.success(decision === "approved" ? "Payment approved. Booking confirmed." : "Receipt rejected. Customer can submit another."); close();
  }
  return <Modal title="Review transfer receipt" description={`Booking ${booking.code} · ${money(payment.amount)}`} onClose={close}>
    <ReceiptPreview payment={payment} onReady={setReady} />
    <label className="mt-4 block text-[12px] font-medium">Reason if rejecting<Textarea className="mt-2 border-0 bg-muted" value={reason} onChange={e => setReason(e.target.value)} placeholder="Tell the customer what needs correcting" maxLength={500} /></label>
    {["Cancelled", "Completed"].includes(booking.status) && <p className="text-[12px] text-destructive">This booking is {booking.status.toLowerCase()}. Its receipt cannot be approved.</p>}
    <div className="mt-4 flex flex-wrap justify-end gap-2"><Button variant="destructive" disabled={!canReview || !reason.trim()} onClick={() => decide("rejected")}><IconX size={16} /> Reject receipt</Button><Button disabled={!canReview || !ready || ["Cancelled", "Completed"].includes(booking.status)} onClick={() => decide("approved")}><IconCheck size={16} /> Approve & confirm</Button></div>
  </Modal>;
}

export function PaymentsPage() {
  const { state } = useStore();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const payments = state.payments ?? [];
  const review = payments.find(p => p.id === reviewId);
  const rows = state.bookings.flatMap(booking => {
    const records = payments.filter(p => p.bookingId === booking.id);
    return records.length ? records.map(payment => ({ booking, payment })) : [{ booking, payment: undefined }];
  }).filter(({ booking, payment }) => {
    const customer = state.customers.find(c => c.id === booking.customerId);
    const status = payment?.status ?? "unpaid";
    return (filter === "All" || status === ({ "Needs review": "review", "Approved": "approved", "Unpaid": "unpaid", "Rejected": "rejected" } as Record<string,string>)[filter]) && `${customer?.name} ${booking.code}`.toLowerCase().includes(query.toLowerCase());
  }).sort((a,b) => (b.payment?.createdAt ?? b.booking.createdAt).localeCompare(a.payment?.createdAt ?? a.booking.createdAt));
  return <>
    <PageHeader eyebrow="PAYMENTS" title="Every payment, in one place." description="Review transfers and keep track of booking payments." />
    <div className="mb-6 flex flex-wrap gap-3">{[{ label: "Approved payments", value: money(payments.filter(p => p.status === "approved").reduce((sum,p) => sum+p.amount,0)) }, {label: "Receipts to review", value: payments.filter(p => p.status === "review").length}, {label:"Awaiting payment", value: state.bookings.filter(b => !["Cancelled","Completed"].includes(b.status) && !paymentSummary(state,b).confirmed && !paymentSummary(state,b).pending).length}].map(item => <div key={item.label} className="min-w-40 flex-1 rounded-2xl bg-white p-5"><p className="text-[12px] text-muted-foreground">{item.label}</p><strong className="mt-2 block text-[23px] font-semibold tracking-tight">{item.value}</strong></div>)}</div>
    <section className="overflow-hidden rounded-2xl bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="flex flex-wrap gap-1">{["All","Needs review","Approved","Unpaid","Rejected"].map(item => <button key={item} aria-pressed={filter===item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-[12px] font-medium ${filter===item ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted"}`}>{item}</button>)}</div><label className="flex h-10 items-center gap-2 rounded-xl bg-muted px-3"><IconSearch size={16} /><Input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search payments" placeholder="Customer or booking code" className="h-full border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" /></label></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-[12px]"><thead className="bg-muted/60 text-muted-foreground"><tr>{["Customer / booking","Amount","Method","Status",""].map((heading,i)=><th key={i} scope="col" className="px-5 py-3 font-medium">{heading || <span className="sr-only">Actions</span>}</th>)}</tr></thead><tbody>{rows.map(({booking,payment}) => {
        const customer=state.customers.find(c=>c.id===booking.customerId);
        const summary=paymentSummary(state,booking);
        const status=payment?.status;
        return <tr key={payment?.id ?? booking.id} className="border-t border-border/50"><td className="px-5 py-3"><strong className="block font-medium">{customer?.name}</strong><Link className="mt-1 block text-muted-foreground hover:text-primary" href={`/bookings/${booking.id}`}>{booking.code}</Link></td><td className="px-5 py-3 font-medium">{money(payment?.amount ?? Math.max(0,summary.required-summary.paid))}</td><td className="px-5 py-3 text-muted-foreground">{payment?.method === "gateway" ? "Demo gateway" : payment ? "Bank transfer" : "—"}</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] ${status === "approved" ? "bg-success-surface text-success" : status === "review" ? "bg-warning-surface text-warning" : status === "rejected" ? "bg-danger-surface text-destructive" : "bg-muted text-muted-foreground"}`}>{status === "approved" ? "Approved" : status === "review" ? "Needs review" : status === "rejected" ? "Rejected" : booking.status === "Cancelled" ? "Cancelled" : summary.confirmed ? "No payment due" : "Unpaid"}</span></td><td className="px-5 py-3 text-right">{status === "review" ? <Button size="sm" onClick={()=>setReviewId(payment!.id)}><IconFileInvoice size={15} /> Review</Button> : !summary.confirmed && !["Cancelled","Completed"].includes(booking.status) && status !== "approved" ? <Link className="inline-flex items-center gap-1 text-primary" href={`/pay/${booking.code}`}>Payment page <IconArrowUpRight size={14} /></Link> : <IconCreditCard size={16} className="ml-auto text-muted-foreground" />}</td></tr>;
      })}</tbody></table></div>
      {!rows.length && <EmptyState title="No payments here yet." description="Try another filter, or open a booking to make a demo payment." />}
    </section>
    <p className="mt-4 text-[12px] text-muted-foreground">Demo workspace. Gateway payments are simulated; receipts and reviews are saved in this browser.</p>
    {review && <PaymentReview key={review.id} payment={review} close={()=>setReviewId(null)} />}
  </>;
}
