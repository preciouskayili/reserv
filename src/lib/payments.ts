import type { AppState, Booking, Payment } from "./model";

export function paymentSummary(state: AppState, booking: Booking) {
  const service = state.services.find(s => s.id === booking.serviceId);
  const total = booking.totalAmount ?? service?.price ?? 0;
  const required = booking.requiredAmount ?? Math.min(total, Math.max(0, service?.deposit || total));
  const payments = (state.payments ?? []).filter(p => p.bookingId === booking.id);
  const paid = payments.filter(p => p.status === "approved").reduce((sum, p) => sum + p.amount, 0);
  return { total, required, paid, remaining: Math.max(0, total - paid), confirmed: paid >= required, pending: payments.find(p => p.status === "review"), latest: payments.at(-1) };
}

export function normalizePayments(state: AppState): AppState {
  return { ...state, payments: state.payments ?? [], bookings: state.bookings.map(booking => {
    const summary = paymentSummary(state, booking);
    return { ...booking, totalAmount: summary.total, requiredAmount: summary.required,
      status: ["Cancelled", "Completed"].includes(booking.status) ? booking.status : summary.confirmed ? "Confirmed" : "Pending" };
  }) };
}

export function submitPayment(state: AppState, bookingId: string, payment: Payment): AppState {
  const booking = state.bookings.find(b => b.id === bookingId);
  if (!booking || ["Cancelled", "Completed"].includes(booking.status)) return state;
  const summary = paymentSummary(state, booking);
  if (summary.pending || summary.confirmed || (state.payments ?? []).some(p => p.id === payment.id) || payment.bookingId !== bookingId || !Number.isFinite(payment.amount) || payment.amount < summary.required - summary.paid || payment.amount > summary.remaining) return state;
  if (payment.method === "transfer" && (!payment.receiptId || payment.status !== "review")) return state;
  if (payment.method === "gateway" && payment.status !== "approved") return state;
  return normalizePayments({ ...state, payments: [...(state.payments ?? []), payment], bookings: state.bookings.map(b => b.id === bookingId ? { ...b, activity: [...b.activity, { id: payment.id, title: payment.method === "gateway" ? "Demo gateway payment approved" : "Receipt submitted for review", time: payment.createdAt, actor: "customer" }] } : b) });
}

export function reviewPayment(state: AppState, id: string, decision: "approved" | "rejected", reason = ""): AppState {
  const payment = state.payments?.find(p => p.id === id);
  const booking = state.bookings.find(b => b.id === payment?.bookingId);
  if (!payment || !booking || payment.status !== "review" || payment.method !== "transfer") return state;
  if (decision === "approved" && ["Cancelled", "Completed"].includes(booking.status)) return state;
  if (decision === "rejected" && !reason.trim()) return state;
  const now = new Date().toISOString();
  return normalizePayments({ ...state, payments: state.payments!.map(p => p.id === id ? { ...p, status: decision, reviewedAt: now, rejectionReason: decision === "rejected" ? reason.trim() : undefined } : p), bookings: state.bookings.map(b => b.id === booking.id ? { ...b, activity: [...b.activity, { id: crypto.randomUUID(), title: decision === "approved" ? "Payment approved by studio" : "Receipt rejected", detail: decision === "rejected" ? reason.trim() : undefined, time: now, actor: "owner" }] } : b) });
}
