"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconArrowUpRight,
  IconCheck,
  IconFileInvoice,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useWorkspaceSave } from "@/hooks/use-workspace-save";
import { money, type Payment } from "@/lib/model";
import { paymentSummary, reviewPayment } from "@/lib/payments";
import { readReceipt } from "@/lib/receipts";
import { PageHeader, Modal, EmptyState } from "./shared";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { InlineError } from "./feedback";
import { DataTable, TableSummary } from "./ui/data-table";
import { Skeleton } from "./ui/skeleton";

function ReceiptPreview({ payment, onReady }: { payment: Payment; onReady: (ready: boolean) => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    let objectUrl = "";
    readReceipt(payment.receiptId!).then(blob => {
      if (disposed) return;
      if (!blob) { setError("This receipt is unavailable in this browser. Ask the customer to submit it again."); return; }
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); onReady(true);
    }).catch(() => { if (!disposed) setError("Could not load the receipt. Try reopening this review."); });
    return () => { disposed = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [payment.receiptId, onReady, attempt]);
  if (error) return <InlineError title="Receipt unavailable" message={error} onRetry={() => { setError(""); setUrl(""); onReady(false); setAttempt(value => value + 1); }} />;
  if (!url) return <div className="space-y-2"><Skeleton className="h-28 w-full rounded-2xl" /><p className="text-xs text-muted-foreground">Loading receipt details…</p></div>;
  return <div className="rounded-2xl bg-muted p-5"><div className="flex items-center gap-3"><IconFileInvoice size={25} className="text-primary" /><span className="min-w-0 flex-1 truncate text-[13px] font-medium">{payment.receiptName}</span></div><a href={url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-[13px] font-medium text-primary">Open receipt <IconArrowUpRight size={16} /></a><p className="mt-3 text-[12px] text-muted-foreground">Check the amount and transaction details before approving.</p></div>;
}

function PaymentReview({ payment, close }: { payment: Payment; close: () => void }) {
  const { state, update, isSaving: isSubmitting, canDismiss } = useWorkspaceSave();
  const [reason, setReason] = useState("");
  const [decisionPending, setDecisionPending] = useState<"approved" | "rejected" | null>(null);
  const [ready, setReady] = useState(false);
  const booking = state.bookings.find(b => b.id === payment.bookingId)!;
  const current = state.payments?.find(p => p.id === payment.id);
  const canReview = current?.status === "review";

  async function decide(decision: "approved" | "rejected") {
    if (!canReview || !canDismiss() || (decision === "rejected" && !reason.trim())) return;
    setDecisionPending(decision);
    const saved = await update(s => reviewPayment(s, payment.id, decision, reason));
    if (!saved) return;
    toast.success(
      decision === "approved"
        ? "Payment approved. Booking confirmed."
        : "Receipt rejected. Customer can submit another."
    );
    close();
  }

  return <Modal title="Review transfer receipt" description={`Booking ${booking.code} · ${money(payment.amount)}`} busy={isSubmitting} onClose={() => { if (canDismiss()) close(); }}>
    <ReceiptPreview payment={payment} onReady={setReady} />
    <label className="mt-4 block text-[12px] font-medium">Reason if rejecting<Textarea disabled={isSubmitting} className="mt-2 border-0 bg-muted" value={reason} onChange={e => setReason(e.target.value)} placeholder="Tell the customer what needs correcting" maxLength={500} /></label>
    {["Cancelled", "Completed"].includes(booking.status) && <p className="text-[12px] text-destructive">This booking is {booking.status.toLowerCase()}. Its receipt cannot be approved.</p>}
    <div className="mt-4 flex flex-wrap justify-end gap-2">
      <Button
        variant="destructive"
        loading={isSubmitting && decisionPending === "rejected"}
        loadingText="Rejecting…"
        disabled={!canReview || !reason.trim() || isSubmitting}
        onClick={() => decide("rejected")}
      >
        <IconX size={16} />
        Reject receipt
      </Button>
      <Button
        loading={isSubmitting && decisionPending === "approved"}
        loadingText="Approving…"
        disabled={!canReview || !ready || isSubmitting || ["Cancelled", "Completed"].includes(booking.status)}
        onClick={() => decide("approved")}
      >
        <IconCheck size={16} />
        Approve & confirm
      </Button>
    </div>
  </Modal>;
}

export function PaymentsPage() {
  const { state } = useStore();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const payments = state.payments ?? [];
  const review = payments.find(p => p.id === reviewId);
  const rows = state.bookings.flatMap<{ booking: (typeof state.bookings)[number]; payment?: (typeof payments)[number] }>(booking => {
    const records = payments.filter(p => p.bookingId === booking.id);
    return records.length ? records.map(payment => ({ booking, payment })) : [{ booking, payment: undefined }];
  }).filter(({ booking, payment }) => {
    const customer = state.customers.find(c => c.id === booking.customerId);
    const status = payment?.disputed || payment?.needsReview || (payment?.refundedAmount ?? 0) > 0 ? "attention" : payment?.status ?? "unpaid";
    return (filter === "All" || status === ({ "Needs attention": "attention", "Needs review": "review", "Approved": "approved", "Unpaid": "unpaid", "Rejected": "rejected" } as Record<string,string>)[filter]) && `${customer?.name} ${booking.code}`.toLowerCase().includes(query.toLowerCase());
  }).sort((a,b) => (b.payment?.createdAt ?? b.booking.createdAt).localeCompare(a.payment?.createdAt ?? a.booking.createdAt));
  return <>
    <PageHeader eyebrow="PAYMENTS" title="Every payment, in one place." description="Review transfers and keep track of booking payments." />
    <div className="mb-6 flex flex-wrap gap-3">{[{ label: "Net approved payments", value: money(payments.filter(p => p.status === "approved" && !p.disputed).reduce((sum,p) => sum+p.amount-(p.refundedAmount ?? 0),0)) }, {label: "Receipts to review", value: payments.filter(p => p.status === "review").length}, {label:"Awaiting payment", value: state.bookings.filter(b => !["Cancelled","Completed"].includes(b.status) && !paymentSummary(state,b).confirmed && !paymentSummary(state,b).pending).length}].map(item => <div key={item.label} className="min-w-40 flex-1 rounded-2xl bg-white p-5"><p className="text-[12px] text-muted-foreground">{item.label}</p><strong className="mt-2 block text-[23px] font-semibold tracking-tight">{item.value}</strong></div>)}</div>
    <section className="table-panel">
      <div className="table-toolbar"><div className="flex flex-wrap gap-1">{["All","Needs review","Needs attention","Approved","Unpaid","Rejected"].map(item => <button key={item} aria-pressed={filter===item} onClick={() => setFilter(item)} className="table-filter">{item}</button>)}</div><div className="table-search"><IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search payments" placeholder="Customer or booking code" className="h-10 w-full rounded-xl border border-transparent bg-muted pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground shadow-none transition focus-visible:border-border focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary" /></div></div>
      <DataTable label="Payments">
        <thead><tr><th scope="col">Customer / booking</th><th scope="col" className="table-number">Amount</th><th scope="col">Method</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{rows.map(({ booking, payment }) => {
          const customer = state.customers.find(c => c.id === booking.customerId);
          const summary = paymentSummary(state, booking);
          const status = payment?.status;
          const label = payment?.disputed ? "Disputed" : (payment?.refundedAmount ?? 0) > 0 ? "Refunded" : payment?.needsReview ? "Needs attention" : status === "approved" ? "Approved" : status === "review" ? "Needs review" : status === "rejected" ? "Rejected" : booking.status === "Cancelled" ? "Cancelled" : summary.confirmed ? "No payment due" : "Unpaid";
          return <tr key={payment?.id ?? booking.id}>
            <td><Link className="table-primary hover:text-primary hover:underline" href={`/bookings/${booking.id}`}>{customer?.name}</Link><span className="table-secondary font-mono">{booking.code}</span></td>
            <td className="table-number whitespace-nowrap font-medium">{money(payment?.amount ?? Math.max(0, summary.required - summary.paid))}{(payment?.refundedAmount ?? 0) > 0 && <span className="table-secondary">{money(payment!.refundedAmount!)} refunded</span>}</td>
            <td className="text-muted-foreground">{payment?.method === "gateway" ? payment.provider === "paystack" ? "Paystack" : payment.provider === "stripe" ? "Stripe" : "Online checkout" : payment ? "Bank transfer" : "—"}</td>
            <td><span className={`status-pill ${payment?.disputed || payment?.needsReview || (payment?.refundedAmount ?? 0) > 0 ? "bg-warning-surface text-warning" : status === "approved" ? "bg-success-surface text-success" : status === "review" ? "bg-warning-surface text-warning" : status === "rejected" ? "bg-danger-surface text-destructive" : "bg-muted text-muted-foreground"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span></td>
            <td className="text-right">{status === "review" ? <button className="table-action" onClick={() => setReviewId(payment!.id)} aria-label={`Review payment for ${booking.code}`}><IconFileInvoice size={15} /> Review</button> : !summary.confirmed && !["Cancelled", "Completed"].includes(booking.status) && status !== "approved" ? <Link className="table-action" href={`/pay/${booking.code}`}>Payment page <IconArrowUpRight size={15} /></Link> : <Link className="table-action" href={`/bookings/${booking.id}`} aria-label={`View reservation ${booking.code}`}>View <IconArrowUpRight size={15} /></Link>}</td>
          </tr>;
        })}</tbody>
      </DataTable>
      {!rows.length && <EmptyState title="No payments here yet." description="Try another filter, or open a booking to submit a payment receipt." action={query || filter !== "All" ? <Button variant="outline" onClick={() => { setQuery(""); setFilter("All"); }}>Clear filters</Button> : undefined} />}
      <TableSummary count={rows.length} noun="record" />
    </section>
    <p className="mt-4 text-[12px] text-muted-foreground">Receipts are private to this workspace. Approve a transfer only after checking it against your bank records.</p>
    {review && <PaymentReview key={review.id} payment={review} close={()=>setReviewId(null)} />}
  </>;
}
