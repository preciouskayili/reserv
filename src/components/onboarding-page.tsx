"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconLoader2,
  IconCalendarEvent,
  IconLink,
} from "@tabler/icons-react";
import { useAuth } from "@/lib/auth-context";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import type { Business } from "@/lib/model";
import { Brand, studioIcons, Avatar } from "./shared";
import { ImageUpload } from "./image-upload";
import { ThemeSelect } from "./theme-provider";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { LocationPicker } from "./location-picker";
import { CategorySelect } from "./category-select";
import { InlineError, PageLoading } from "./feedback";

export interface OnboardingData {
  name: string;
  slug: string;
  owner: string;
  category: string;
  phone: string;
  address: string;
  serviceName: string;
  duration: number;
  price: number;
  avatarUrl?: string;
  logoUrl?: string;
  icon?: Business["icon"];
}
const steps = ["A little about you", "Your business", "Your first service"];
const field =
  "mt-2 min-h-11 rounded-xl border-0 bg-muted px-3 text-[13px] shadow-none";

export function OnboardingPage() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    sessionError,
    retrySession,
    logout,
  } = useAuth();
  const { createWorkspace, workspaces, state } = useStore();
  useEffect(() => {
    if (!isLoading && !sessionError && !isAuthenticated)
      router.replace("/login?next=/onboarding");
  }, [isLoading, sessionError, isAuthenticated, router]);
  if (sessionError)
    return (
      <main className="mx-auto max-w-xl p-8">
        <InlineError message={sessionError} onRetry={retrySession} />
      </main>
    );
  if (isLoading || !user) return <PageLoading label="Getting things ready…" />;
  return (
    <OnboardingForm
      initialOwner={
        state.settings.owner ||
        (user.name === user.email.split("@")[0] ? "" : user.name)
      }
      canGoBack={workspaces.length > 0}
      onSignOut={logout}
      onSubmit={async (data) => {
        await createWorkspace(data);
        router.replace("/");
      }}
    />
  );
}

function OnboardingForm({
  initialOwner,
  canGoBack,
  onSubmit,
  onSignOut,
}: {
  initialOwner: string;
  canGoBack: boolean;
  onSubmit: (data: OnboardingData) => Promise<void>;
  onSignOut: () => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingData>({
    name: "",
    slug: "",
    owner: initialOwner,
    category: "Studio & Wellness",
    phone: "",
    address: "",
    serviceName: "",
    duration: 45,
    price: 0,
    icon: "store",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState<{
    candidate: string;
    slug: string;
    status: string;
  }>({ candidate: "", slug: "", status: "" });
  const heading = useRef<HTMLHeadingElement>(null);
  const candidate = draft.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/, "");
  const baseSlug =
    candidate.length >= 3 ? candidate : candidate ? `${candidate}-studio` : "";
  useEffect(() => {
    if (!baseSlug) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const result = await api.workspaces.checkSlug(baseSlug);
        if (active)
          setLink({
            candidate: baseSlug,
            slug: result.suggestedSlug || baseSlug,
            status: result.available
              ? "Available"
              : result.suggestedSlug
                ? "Available alternative"
                : "Checked when you finish",
          });
      } catch {
        if (active)
          setLink({
            candidate: baseSlug,
            slug: baseSlug,
            status: "Checked when you finish",
          });
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [baseSlug]);
  const slug = link.candidate === baseSlug ? link.slug : baseSlug;
  const patch = (value: Partial<OnboardingData>) =>
    setDraft((current) => ({ ...current, ...value }));
  function go(next: number) {
    setError("");
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (uploading || lock.current) return;
    if (step === 0 && draft.owner.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (
      step === 1 &&
      (!/^\+?[\d\s()-]{10,20}$/.test(draft.phone.trim()) ||
        draft.address.trim().length < 5)
    ) {
      setError("Add a valid contact number and your business address.");
      return;
    }
    if (step < 2) {
      go(step + 1);
      return;
    }
    lock.current = true;
    setSaving(true);
    try {
      await onSubmit({
        ...draft,
        slug: slug || "studio",
        owner: draft.owner.trim(),
        name: draft.name.trim(),
        serviceName: draft.serviceName.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn’t create your workspace. Please try again.",
      );
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  const Mark = studioIcons[draft.icon ?? "store"];
  return (
    <main className="min-h-dvh bg-background px-5 py-7 text-foreground sm:px-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Brand />
        <div className="flex items-center gap-4">
          <ThemeSelect />
          {canGoBack ? (
            <Link href="/" className="text-xs text-muted-foreground">
              Back to workspace
            </Link>
          ) : (
            <button
              onClick={onSignOut}
              className="text-xs text-muted-foreground"
            >
              Sign out
            </button>
          )}
        </div>
      </header>
      <div className="mx-auto grid max-w-5xl gap-10 py-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20 md:py-20">
        <aside>
          <p className="text-xs font-medium text-muted-foreground">
            YOUR SPACE, READY FOR WHAT’S NEXT
          </p>
          <h1 className="mt-5 max-w-xs text-[36px] font-medium leading-[1.15] tracking-[-0.035em]">
            A little more room
            <br />
            for your business.
          </h1>
          <p className="mt-5 max-w-xs text-[13px] leading-6 text-muted-foreground">
            Let’s make Reserv yours. A few details now, a calmer day ahead.
          </p>
          <ol
            aria-label="Setup progress"
            className="mt-8 flex gap-3 md:flex-col md:gap-5"
          >
            {steps.map((title, index) => (
              <li
                key={title}
                aria-current={step === index ? "step" : undefined}
                className={`flex items-center gap-3 text-[13px] ${step === index ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${index <= step ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  {index < step ? <IconCheck size={14} /> : index + 1}
                </span>
                <span className="hidden md:inline">{title}</span>
              </li>
            ))}
          </ol>
          <div className="mt-10 hidden rounded-[22px] bg-card p-5 md:block">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-muted">
                <Mark size={22} stroke={1.4} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {draft.name || "Your business, at home"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {draft.category}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-background p-3">
              <IconCalendarEvent size={19} className="text-muted-foreground" />
              <div>
                <p className="text-xs font-medium">
                  {draft.serviceName || "Your first appointment starts here"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  One place for your bookings and customers.
                </p>
              </div>
            </div>
          </div>
        </aside>
        <section className="min-w-0 rounded-[24px] bg-card p-6 sm:p-8">
          <p className="text-xs text-muted-foreground">Step {step + 1} of 3</p>
          <h2
            ref={heading}
            tabIndex={-1}
            className="mt-3 text-[25px] font-medium tracking-tight outline-none"
          >
            {steps[step]}
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
            {
              [
                "Put a name and a face to the person behind the business.",
                "Help customers recognise you and find their way to you.",
                "What would you like customers to book? You can add more later.",
              ][step]
            }
          </p>
          <form onSubmit={submit} className="mt-6">
            <fieldset disabled={saving} className="space-y-5">
              {step === 0 && (
                <>
                  <label className="block text-xs font-medium">
                    Your full name
                    <Input
                      className={field}
                      autoComplete="name"
                      placeholder="e.g. Jessica Miller"
                      value={draft.owner}
                      onChange={(e) => patch({ owner: e.target.value })}
                      required
                      minLength={2}
                      maxLength={100}
                    />
                  </label>
                  <ImageUpload
                    label="Profile photo (optional)"
                    name={draft.owner}
                    value={draft.avatarUrl}
                    onChange={(avatarUrl) => patch({ avatarUrl })}
                    onBusyChange={setUploading}
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Your name and photo will appear as the first staff member on
                    your booking page.
                  </p>
                </>
              )}
              {step === 1 && (
                <>
                  <label className="block text-xs font-medium">
                    Business name
                    <Input
                      className={field}
                      autoComplete="organization"
                      placeholder="e.g. Bloom Studio"
                      required
                      minLength={2}
                      maxLength={100}
                      value={draft.name}
                      onChange={(e) => patch({ name: e.target.value })}
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 p-3 text-xs">
                    <IconLink size={14} />
                    <span className="min-w-0 break-all">
                      /b/{slug || "your-business"}
                    </span>
                    {slug && (
                      <span className="ml-auto text-muted-foreground">
                        {link.candidate === baseSlug
                          ? link.status
                          : "Checking…"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium">Store icon</p>
                    <div className="flex gap-2">
                      {Object.entries(studioIcons).map(([key, Icon]) => (
                        <button
                          key={key}
                          type="button"
                          aria-label={`${key} icon`}
                          aria-pressed={draft.icon === key}
                          onClick={() =>
                            patch({ icon: key as Business["icon"] })
                          }
                          className={`flex size-11 items-center justify-center rounded-xl ${draft.icon === key ? "bg-accent text-primary ring-1 ring-primary" : "bg-muted text-muted-foreground"}`}
                        >
                          <Icon size={21} stroke={1.5} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <ImageUpload
                    label="Business logo (optional)"
                    name={draft.name}
                    value={draft.logoUrl}
                    onChange={(logoUrl) => patch({ logoUrl })}
                    onBusyChange={setUploading}
                  />
                  <div>
                    <label className="text-xs font-medium">
                      Business category
                      <CategorySelect
                        value={draft.category}
                        onChange={(category) => patch({ category })}
                        required
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-medium">
                    Business phone
                    <Input
                      type="tel"
                      autoComplete="tel"
                      className={field}
                      placeholder="+234 801 234 5678"
                      required
                      value={draft.phone}
                      onChange={(e) => patch({ phone: e.target.value })}
                    />
                  </label>
                  <div>
                    <p className="mb-2 text-xs font-medium">Business address</p>
                    <LocationPicker
                      value={draft.address}
                      onChange={(address) => patch({ address })}
                      placeholder="Search or enter your business address"
                    />
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <label className="block text-xs font-medium">
                    Service name
                    <Input
                      className={field}
                      required
                      minLength={2}
                      maxLength={150}
                      placeholder="e.g. Initial consultation"
                      value={draft.serviceName}
                      onChange={(e) => patch({ serviceName: e.target.value })}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-xs font-medium">
                      Duration (minutes)
                      <Input
                        className={field}
                        required
                        type="number"
                        min={5}
                        max={1440}
                        step={5}
                        value={draft.duration || ""}
                        onChange={(e) =>
                          patch({ duration: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label className="block text-xs font-medium">
                      Price (₦)
                      <Input
                        className={field}
                        required
                        type="number"
                        min={0}
                        max={100000000}
                        step="0.01"
                        value={draft.price}
                        onChange={(e) =>
                          patch({ price: Number(e.target.value) })
                        }
                      />
                    </label>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={draft.owner} src={draft.avatarUrl} />
                      <div>
                        <p className="text-[13px] font-medium">{draft.owner}</p>
                        <p className="text-xs text-muted-foreground">
                          Owner · your first staff member
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs leading-5 text-muted-foreground">
                      Start with Monday–Friday, 9am–5pm WAT. You can change your
                      hours and booking policies in Business profile.
                    </p>
                  </div>
                </>
              )}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-danger-surface p-3 text-xs leading-5 text-destructive"
                >
                  {error}
                </p>
              )}
              <div className="flex items-center gap-3 pt-3">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={uploading}
                    onClick={() => go(step - 1)}
                    className="min-h-11 rounded-xl"
                  >
                    <IconArrowLeft size={16} />
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={saving || uploading}
                  className="min-h-11 flex-1 rounded-xl"
                >
                  {saving ? (
                    <>
                      <IconLoader2 size={16} className="animate-spin" />
                      Creating your workspace…
                    </>
                  ) : step === 2 ? (
                    <>
                      Create workspace
                      <IconCheck size={16} />
                    </>
                  ) : (
                    <>
                      Continue
                      <IconArrowRight size={16} />
                    </>
                  )}
                </Button>
              </div>
            </fieldset>
          </form>
        </section>
      </div>
    </main>
  );
}
