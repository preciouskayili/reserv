"use client";

import Link from "next/link";
import { useTransition } from "react";
import { IconAlertCircle, IconLoader2, IconRefresh } from "@tabler/icons-react";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";
import { RouteLoading } from "./page-loading";

export function PageLoading({label="Loading…"}:{label?:string}) {
 const pathname=usePathname();return <RouteLoading pathname={pathname} label={label} />;
}

export function InlineError({
  title = "We couldn’t load this.",
  message = "Check your connection and try again.",
  onRetry,
  busy = false,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  busy?: boolean;
}) {
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-2xl bg-danger-surface p-5">
      <IconAlertCircle size={20} className="mt-0.5 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <h2 className="text-[14px] font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-[13px] leading-6 text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={busy}>
          {busy ? (
            <IconLoader2 size={15} className="animate-spin" />
          ) : (
            <IconRefresh size={15} />
          )}
          {busy ? "Retrying…" : "Try again"}
        </Button>
      )}
    </div>
  );
}

export function RouteError({ retry }: { retry: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-16">
      <InlineError
        title="Something didn’t load as expected."
        message="Try again to reload this page. Your saved information has not been reset."
        onRetry={() => startTransition(retry)}
        busy={pending}
      />
      <Link href="/" className="mt-5 inline-flex text-sm font-medium text-primary hover:underline">
        Back to workspace
      </Link>
    </div>
  );
}
