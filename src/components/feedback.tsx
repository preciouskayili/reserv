"use client";

import Link from "next/link";
import { useTransition } from "react";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export function PageLoading({ label = "Getting things ready…" }: { label?: string }) {
  return <div className="mx-auto w-full max-w-6xl space-y-6 p-5 sm:p-8" role="status" aria-busy="true">
    <span className="sr-only">{label}</span>
    <div aria-hidden="true" className="space-y-3"><Skeleton className="h-3 w-28" /><Skeleton className="h-8 w-2/3 max-w-80" /><Skeleton className="h-4 w-3/4 max-w-96" /></div>
    <div aria-hidden="true" className="overflow-hidden rounded-[22px] bg-card p-5"><Skeleton className="mb-6 h-10 w-full" />{[0, 1, 2, 3].map(row => <div key={row} className="flex items-center gap-4 border-t border-border py-5"><Skeleton className="h-9 w-9 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/3" /></div><Skeleton className="h-6 w-20 rounded-full" /></div>)}</div>
  </div>;
}

export function InlineError({ title = "We couldn’t load this.", message = "Check your connection and try again.", onRetry, busy = false }: { title?: string; message?: string; onRetry?: () => void; busy?: boolean }) {
  return <div role="alert" className="flex flex-wrap items-start gap-3 rounded-2xl bg-danger-surface p-5">
    <IconAlertCircle size={20} className="mt-0.5 shrink-0 text-destructive" />
    <div className="min-w-0 flex-1"><h2 className="text-[14px] font-semibold text-foreground">{title}</h2><p className="mt-1 text-[13px] leading-6 text-muted-foreground">{message}</p></div>
    {onRetry && <Button variant="outline" size="sm" onClick={onRetry} disabled={busy}><IconRefresh size={15} className={busy ? "animate-spin" : ""} />{busy ? "Retrying…" : "Try again"}</Button>}
  </div>;
}

export function RouteError({ retry }: { retry: () => void }) {
  const [pending, startTransition] = useTransition();
  return <div className="mx-auto w-full max-w-2xl px-5 py-16"><InlineError title="Something didn’t load as expected." message="Try again to reload this page. Your saved information has not been reset." onRetry={() => startTransition(retry)} busy={pending} /><Link href="/" className="mt-5 inline-flex text-sm font-medium text-primary hover:underline">Back to workspace</Link></div>;
}
