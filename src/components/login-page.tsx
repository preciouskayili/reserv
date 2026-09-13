"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLoading } from "./feedback";
import { safeNextPath } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Brand } from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconKey,
  IconMail,
  IconRotateClockwise,
} from "@tabler/icons-react";

export function LoginPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading sign-in…" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextTarget = safeNextPath(searchParams.get("next"));
  const { requestOtp, verifyOtp, isAuthenticated } = useAuth();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  // If already signed in, redirect
  useEffect(() => {
    if (isAuthenticated) router.replace(nextTarget);
  }, [isAuthenticated, nextTarget, router]);

  useEffect(() => {
    if (step !== "code" || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (isSubmitting) return;
    setFormError("");
    setIsSubmitting(true);
    try {
      const res = await requestOtp(email);
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      setStep("code");
      setCountdown(60);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) return;

    if (isSubmitting) return;
    setFormError("");
    setIsSubmitting(true);
    try {
      await verifyOtp(email, code);
      router.push(nextTarget);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    if (isSubmitting) return;
    setFormError("");
    setIsSubmitting(true);
    try {
      const res = await requestOtp(email);
      setDevCode(res.devCode ?? null);
      setCountdown(60);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not resend your code. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <span className="inline-block transition hover:opacity-80">
            <Brand />
          </span>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-border/80 bg-white p-8 shadow-sm transition-all sm:p-10">
          <div className="mb-6">
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {step === "email" ? "PASSWORDLESS SIGN IN" : "CHECK YOUR INBOX"}
            </span>
            <h1 className="mt-2 text-[26px] font-medium tracking-tight text-foreground">
              {step === "email" ? "Welcome back." : "Enter 6-digit code"}
            </h1>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
              {step === "email"
                ? "Enter your email address to receive an verification code."
                : `We sent a temporary verification code to `}
              {step === "code" && (
                <strong className="font-semibold text-foreground">{email}</strong>
              )}
            </p>
          </div>

          {formError && <p role="alert" className="mb-4 rounded-xl bg-danger-surface p-3 text-[13px] text-destructive">{formError}</p>}
          {devCode && step === "code" && (
            <div className="mb-6 flex items-center justify-between rounded-xl bg-accent/70 p-3.5 text-[12px]">
              <span className="flex items-center gap-2 text-primary font-medium">
                <IconKey size={16} /> Dev code: <strong>{devCode}</strong>
              </span>
              <button
                type="button"
                onClick={() => setCode(devCode)}
                className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
              >
                Autofill
              </button>
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[12px] font-medium text-foreground"
                >
                  Email address
                </label>
                <div className="relative">
                  <IconMail
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="email"
                    type="email"
                    autoFocus
                    required
                    placeholder="you@yourstudio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl border-border bg-background pl-10 pr-3 text-[14px] text-foreground placeholder:text-muted-foreground shadow-none transition focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <IconRotateClockwise size={16} className="animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    Continue with email
                    <IconArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label
                  htmlFor="code"
                  className="mb-1.5 block text-[12px] font-medium text-foreground"
                >
                  Verification code
                </label>
                <div className="relative">
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    required
                    maxLength={6}
                    placeholder="••••••"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="h-14 rounded-xl border-border bg-background text-center font-mono text-[24px] font-bold tracking-[0.35em] text-foreground placeholder:text-muted-foreground/40 shadow-none transition focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || code.length !== 6}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <IconRotateClockwise size={16} className="animate-spin" />
                    Verifying code...
                  </>
                ) : (
                  <>
                    <IconCheck size={16} />
                    Verify & sign in
                  </>
                )}
              </Button>

              <div className="flex items-center justify-between pt-1 text-[12px] text-muted-foreground">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setFormError("");
                    setStep("email");
                    setCode("");
                  }}
                  className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition"
                >
                  <IconArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  disabled={countdown > 0 || isSubmitting}
                  onClick={handleResend}
                  className="font-medium text-primary disabled:text-muted-foreground hover:underline"
                >
                  {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-[12px] text-muted-foreground">
          Reserv Studio Edition · Secured by Resend & Supabase
        </p>
      </div>
    </div>
  );
}
