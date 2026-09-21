"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconCheck, IconCreditCard, IconLock, IconReceipt } from "@tabler/icons-react";
import { request, type Snapshot } from "@/lib/api";
import { money } from "@/lib/model";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

type Provider = "paystack" | "stripe";
type Attempt = { id: string; provider: Provider; choice: "deposit" | "full"; amount: number; status: "initializing" | "pending" | "succeeded" | "expired"; url: string | null; needsReview: boolean };
type Result = { attempt: Attempt; snapshot: Snapshot };
export function CheckoutOptions({ code, choice, amount, onSnapshot, onLock, children, externalBusy = false }: {
  code: string; choice: "deposit" | "full"; amount: number; onSnapshot: (snapshot: Snapshot) => void; onLock: (locked: boolean) => void; children: ReactNode; externalBusy?: boolean;
}) {
  const [method, setMethod] = useState<Provider | "transfer">("paystack");
  const [email, setEmail] = useState("");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const snapshotCallback = useRef(onSnapshot);
  const requestKey = useRef<{ selection: string; key: string } | null>(null);
  useEffect(() => { snapshotCallback.current = onSnapshot; }, [onSnapshot]);
  const config = useQuery({
    queryKey: ["checkout-options", code], retry: false, staleTime: 0,
    queryFn: async () => {
      const [options, current] = await Promise.all([
        request<{ providers: { id: Provider; enabled: boolean }[] }>("/api/payments/options"),
        request<{ attempt: Attempt | null }>(`/api/payments/reservation/${code}`),
      ]);
      return { ...options, current: current.attempt };
    },
  });
  const current = attempt ?? config.data?.current ?? null;
  const active = current?.status === "initializing" || current?.status === "pending";
  const selected = active ? current.provider : method !== "transfer" && config.data && !config.data.providers.find(p => p.id === method)?.enabled ? config.data.providers.find(p => p.enabled)?.id ?? "transfer" : method;
  const enabled = config.data?.providers.find(p => p.id === selected)?.enabled ?? false;
  useEffect(() => { onLock(Boolean(active) || busy || config.isPending); }, [active, busy, config.isPending, onLock]);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const checkoutId = new URLSearchParams(window.location.search).get("checkout");
    if (!checkoutId || !/^[a-f0-9-]{36}$/i.test(checkoutId)) return;
    async function confirm() {
      lock.current = true; setBusy(true); setError(""); setNotice("Checking your payment securely…");
      try {
        const result = await request<Result>(`/api/payments/reservation/${code}/verify`, { method: "POST", body: JSON.stringify({ checkoutId }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
        if (!alive) return;
        setAttempt(result.attempt); snapshotCallback.current(result.snapshot);
        setNotice(result.attempt.status === "succeeded" ? (result.attempt.needsReview ? "Payment received. Contact the studio to review this reservation." : "Payment verified.") : result.attempt.status === "expired" ? "This checkout expired without a completed payment. You can start again." : "Your payment is not confirmed yet. Check its status before trying again.");
      } catch (err) { if (alive) setError(err instanceof Error ? err.message : "Could not check payment. Please retry."); }
      finally { if (alive) { lock.current = false; setBusy(false); } }
    }
    void confirm();
    return () => { alive = false; controller.abort(); lock.current = false; };
  }, [code]);
  async function verify() {
    if (externalBusy || lock.current || !current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const result = await request<Result>(`/api/payments/reservation/${code}/verify`, { method: "POST", body: JSON.stringify({ checkoutId: current.id }) });
      setAttempt(result.attempt); onSnapshot(result.snapshot);
      setNotice(result.attempt.status === "succeeded" ? "Payment verified." : result.attempt.status === "expired" ? "This checkout expired. You can start a new payment." : "Payment has not been confirmed. Resume your existing checkout, or check again shortly.");
      if (result.attempt.status === "expired") requestKey.current = null;
    } catch (err) { setError(err instanceof Error ? err.message : "Could not verify payment. Please retry."); }
    finally { lock.current = false; setBusy(false); }
  }
  async function begin(event: React.FormEvent) {
    event.preventDefault();
    if (externalBusy || lock.current || selected === "transfer" || !enabled) return;
    lock.current = true; setBusy(true); setError("");
    try {
      if (active && current.url) { navigate(current); return; }
      const selection = `${selected}:${choice}`;
      if (!requestKey.current || requestKey.current.selection !== selection) requestKey.current = { selection, key: crypto.randomUUID() };
      const result = await request<Result>(`/api/payments/reservation/${code}`, { method: "POST", body: JSON.stringify({ provider: selected, choice: active ? current.choice : choice, email, idempotencyKey: requestKey.current.key }) });
      setAttempt(result.attempt); onSnapshot(result.snapshot);
      if (result.attempt.status === "succeeded") setNotice("Payment verified.");
      else if (result.attempt.status === "expired") { requestKey.current = null; setNotice("This checkout expired. Please start again."); }
      else if (result.attempt.url) navigate(result.attempt);
      else setNotice("Checkout is still being prepared. Check its status before retrying.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not open checkout. Your payment has not been confirmed."); void config.refetch(); }
    finally { lock.current = false; setBusy(false); }
  }
  function navigate(value: Attempt) {
    if (!value.url) return;
    const url = new URL(value.url);
    if (url.protocol !== "https:" || url.hostname !== (value.provider === "paystack" ? "checkout.paystack.com" : "checkout.stripe.com") || url.username || url.password) throw new Error("Invalid checkout destination.");
    window.location.assign(url.href);
  }
  if (config.isPending) return <div role="status" aria-label="Loading payment methods" className="mt-7 space-y-3"><Skeleton className="h-16 rounded-2xl" /><Skeleton className="h-16 rounded-2xl" /><Skeleton className="h-11 rounded-xl" /></div>;
  if (config.error) return <div role="alert" className="mt-7 rounded-2xl bg-muted p-5 text-sm"><p>Payment options could not load. Please retry before making a payment.</p><Button variant="secondary" className="mt-3" loading={config.isFetching} loadingText="Retrying…" onClick={() => void config.refetch()}>Try again</Button></div>;
  return <>
    {notice && <p role="status" className="mt-5 rounded-2xl bg-accent p-4 text-[13px] leading-6 text-primary">{notice}</p>}
    {active && <div className="mt-5 rounded-2xl bg-accent p-4 text-[13px] leading-6"><strong>An existing checkout is open</strong><p>Continue your {current.provider === "paystack" ? "Paystack" : "Stripe"} payment of {money(current.amount)}. Other payment methods are paused to avoid paying twice.</p><Button variant="secondary" disabled={busy || externalBusy} loading={busy} loadingText="Checking…" onClick={verify} className="mt-3 rounded-xl">{busy ? "Checking…" : "Check payment status"}</Button></div>}
    <fieldset className="mt-7" disabled={busy || externalBusy}>
      <legend className="mb-3 text-[13px] font-semibold">Payment method</legend>
      <div className="space-y-2">{([
        { id: "paystack", title: "Pay with Paystack", detail: "Secure checkout with cards and supported local payment methods.", icon: IconCreditCard },
        { id: "stripe", title: "Pay with Stripe", detail: "Secure card checkout.", icon: IconCreditCard },
        { id: "transfer", title: "I’ve already made a transfer", detail: "Share your receipt with the studio for review.", icon: IconReceipt },
      ] as const).map(item => {
        const unavailable = item.id !== "transfer" && !config.data?.providers.find(p => p.id === item.id)?.enabled;
        const disabled = busy || externalBusy || unavailable || Boolean(active && item.id !== current.provider);
        return <label key={item.id} className={`flex items-center gap-3 rounded-2xl p-4 transition ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${selected === item.id && !unavailable ? "bg-primary text-primary-foreground" : "bg-muted/70 text-foreground"}`}>
          <input type="radio" name="checkout-provider" className="sr-only peer" disabled={disabled} checked={selected === item.id} onChange={() => { setMethod(item.id); setError(""); }} />
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${selected === item.id && !unavailable ? "bg-card/10" : "bg-card"}`}><item.icon size={19} /></span>
          <span className="flex-1"><strong className="block text-[13px] font-medium">{item.title}{unavailable && <span className="ml-2 text-[11px] font-normal">Unavailable</span>}</strong><span className={`mt-1 block text-[12px] leading-5 ${selected === item.id && !unavailable ? "text-white/65" : "text-muted-foreground"}`}>{unavailable ? "This payment option is not available yet." : item.detail}</span></span>
          {selected === item.id && !unavailable && <IconCheck size={18} />}
        </label>;
      })}</div>
    </fieldset>
    <div className="mt-4 rounded-2xl bg-muted/70 p-5">
      {selected === "transfer" ? children : <form onSubmit={begin}>
        {!(active && current.url) && <label className="mb-4 block text-[12px] font-medium">Email for your payment receipt<Input type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy || externalBusy || !enabled} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 h-11 rounded-xl bg-card" /></label>}
        <Button loading={busy} loadingText="Checking securely…" type="submit" disabled={busy || externalBusy || !enabled || amount <= 0 && !active} className="h-11 w-full gap-2 rounded-xl"><IconLock size={16} />{busy ? "Checking securely…" : active ? "Resume checkout" : `Pay ${money(amount)}`}</Button>
        <p className="mt-3 text-[12px] leading-5 text-muted-foreground">You’ll complete payment on {selected === "paystack" ? "Paystack" : "Stripe"}. Your reservation updates after we verify the payment.</p>
      </form>}
    </div>
    {error && <p role="alert" className="mt-3 text-[12px] leading-5 text-destructive">{error}</p>}
  </>;
}
