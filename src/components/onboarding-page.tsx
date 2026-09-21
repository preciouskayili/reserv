"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconLoader2,
  IconLink,
} from "@tabler/icons-react";
import { useAuth } from "@/lib/auth-context";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import type { Business } from "@/lib/model";
import { Brand, studioIcons, Avatar } from "./shared";
import { NumberCountrySelect } from "./business-phone";
import { ImageUpload } from "./image-upload";
import { ThemeSelect } from "./theme-provider";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { LocationPicker } from "./location-picker";
import { CategorySelect } from "./category-select";
import { InlineError, PageLoading } from "./feedback";

export interface OnboardingData {
  voiceCountry?: string;
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

const stepMeta = {
  profile: {
    title: "Your profile",
    hint: "Add your name and an optional staff photo.",
  },
  business: {
    title: "Your business",
    hint: "Add the details shown on your public booking page.",
  },
  service: {
    title: "Your first service",
    hint: "Add a service, duration, and price. You can add more services later.",
  },
  number: {
    title: "Business number",
    hint: "Get a dedicated phone number for automated calls, reminders, and payment follow-ups. Optional — you can set this up anytime from Settings.",
  },
} as const;
type StepId = keyof typeof stepMeta;
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
  const ownerStaff =
    state.staff.find((s) => s.id === state.settings.ownerStaffId) ??
    state.staff.find((s) => s.role === "Owner");
  const savedName = state.settings.owner || state.business.owner || "";
  const accountName =
    savedName || (user.name === user.email.split("@")[0] ? "" : user.name);
  return (
    <OnboardingForm
      initialOwner={accountName}
      initialAvatarUrl={ownerStaff?.avatarUrl}
      // The account's name and photo carry across workspaces; only ask once.
      hasProfile={workspaces.length > 0 && accountName.trim().length >= 2}
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
  initialAvatarUrl,
  hasProfile,
  canGoBack,
  onSubmit,
  onSignOut,
}: {
  initialOwner: string;
  initialAvatarUrl?: string;
  hasProfile: boolean;
  canGoBack: boolean;
  onSubmit: (data: OnboardingData) => Promise<void>;
  onSignOut: () => void;
}) {
  const flow: StepId[] = hasProfile
    ? ["business", "service", "number"]
    : ["profile", "business", "service", "number"];
  const [step, setStep] = useState(0);
  const current = flow[step];
  const isLast = step === flow.length - 1;
  const [draft, setDraft] = useState<OnboardingData>({
    name: "",
    slug: "",
    owner: initialOwner,
    avatarUrl: initialAvatarUrl,
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
    setDraft((c) => ({ ...c, ...value }));
  function go(next: number) {
    setError("");
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  async function finalize(voiceCountry?: string) {
    if (uploading || lock.current) return;
    setError("");
    lock.current = true;
    setSaving(true);
    try {
      await onSubmit({
        ...draft,
        voiceCountry,
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
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (uploading || lock.current) return;
    if (current === "profile" && draft.owner.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (
      current === "business" &&
      (!/^\+?[\d\s()-]{10,20}$/.test(draft.phone.trim()) ||
        draft.address.trim().length < 5)
    ) {
      setError("Add a valid contact number and your business address.");
      return;
    }
    if (!isLast) {
      go(step + 1);
      return;
    }
    await finalize(draft.voiceCountry);
  }
  return (
    <main className="min-h-dvh bg-background text-foreground lg:grid lg:h-dvh lg:grid-cols-[minmax(330px,0.82fr)_minmax(0,1.18fr)] lg:overflow-hidden">
      <aside className="relative isolate border-b border-border bg-muted px-6 py-8 sm:px-10 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-11 lg:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
          <div className="absolute -right-20 -top-24 size-[380px] rounded-full bg-accent/70 blur-3xl" />
          <div className="absolute -bottom-28 -left-24 size-[320px] rounded-full bg-accent/50 blur-3xl" />
          <svg
            viewBox="0 0 400 400"
            fill="none"
            className="absolute -bottom-24 -right-24 size-[400px] text-border"
          >
            <circle cx="200" cy="200" r="70" stroke="currentColor" />
            <circle cx="200" cy="200" r="120" stroke="currentColor" />
            <circle cx="200" cy="200" r="170" stroke="currentColor" />
            <circle
              cx="200"
              cy="200"
              r="199"
              stroke="currentColor"
              strokeDasharray="4 7"
            />
          </svg>
        </div>

        <div className="flex min-h-full flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Brand />
            {canGoBack ? (
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <IconArrowLeft size={14} />
                Back to workspace
              </Link>
            ) : (
              <button
                onClick={onSignOut}
                className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                Sign out
              </button>
            )}
          </div>

          <div className="my-10 w-full max-w-sm lg:my-auto lg:py-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Workspace setup
            </p>
            <h1 className="mt-4 text-[30px] font-medium leading-tight tracking-[-0.025em]">
              Set up your
              <br />
              business workspace.
            </h1>

            <ol aria-label="Setup progress" className="mt-9">
              {flow.map((id, index) => (
                <li
                  key={id}
                  aria-current={step === index ? "step" : undefined}
                  className="relative flex gap-3.5 pb-5 last:pb-0"
                >
                  {index < flow.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-[13px] top-8 h-[calc(100%-1.75rem)] w-px ${index < step ? "bg-primary/60" : "bg-border"}`}
                    />
                  )}
                  <span
                    className={`relative z-10 flex size-[27px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      index < step
                        ? "bg-primary text-primary-foreground"
                        : index === step
                          ? "bg-background text-foreground ring-2 ring-primary"
                          : "border border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {index < step ? <IconCheck size={14} /> : index + 1}
                  </span>
                  <span className="min-w-0 pt-1">
                    <span
                      className={`block text-[13px] leading-none ${step === index ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                    >
                      {stepMeta[id].title}
                    </span>
                    {step === index && (
                      <span className="mt-2 block text-[12px] leading-5 text-muted-foreground">
                        {stepMeta[id].hint}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>

          </div>

          <p className="hidden text-[12px] text-muted-foreground lg:block">
            You can change any of this later in Settings.
          </p>
        </div>
      </aside>

      <section className="px-5 py-8 sm:px-10 lg:h-dvh lg:overflow-y-auto lg:px-14 lg:py-10 xl:px-20">
        <div className="mx-auto flex min-h-full w-full max-w-[580px] flex-col">
          <header className="flex justify-end">
            <ThemeSelect />
          </header>

          <div className="py-9 lg:my-auto">
            <div className="flex items-center gap-3">
              <p className="shrink-0 text-xs font-medium text-muted-foreground">
                Step {step + 1} of {flow.length}
              </p>
              <span
                aria-hidden="true"
                className="h-1 flex-1 overflow-hidden rounded-full bg-muted"
              >
                <span
                  className="block h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${((step + 1) / flow.length) * 100}%` }}
                />
              </span>
            </div>
            <h2
              ref={heading}
              tabIndex={-1}
              className="mt-5 text-[27px] font-medium tracking-[-0.025em] outline-none"
            >
              {stepMeta[current].title}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
              {stepMeta[current].hint}
            </p>
            <form onSubmit={submit} className="mt-7">
              <fieldset disabled={saving} className="space-y-5">
                {current === "profile" && (
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
                      Your name and photo will appear as the first staff member
                      on your booking page.
                    </p>
                  </>
                )}
                {current === "business" && (
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
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(studioIcons).map(([key, Icon]) => (
                          <button
                            key={key}
                            type="button"
                            aria-label={`${key} icon`}
                            title={key.charAt(0).toUpperCase() + key.slice(1)}
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
                      <p className="mb-2 text-xs font-medium">
                        Business address
                      </p>
                      <LocationPicker
                        value={draft.address}
                        onChange={(address) => patch({ address })}
                        placeholder="Search or enter your business address"
                      />
                    </div>
                  </>
                )}
                {current === "service" && (
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
                    <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
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
                          <p className="text-[13px] font-medium">
                            {draft.owner}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Owner · your first staff member
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-xs leading-5 text-muted-foreground">
                        Start with Monday–Friday, 9am–5pm WAT. You can change
                        your hours and booking policies in Business profile.
                      </p>
                    </div>
                  </>
                )}
                {current === "number" && (
                  <>
                    <NumberCountrySelect
                      value={draft.voiceCountry ?? ""}
                      onChange={(voiceCountry) => patch({ voiceCountry })}
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => finalize(undefined)}
                      className="flex min-h-11 w-full max-w-md items-center justify-between rounded-xl bg-muted px-4 text-[13px] font-medium text-foreground transition hover:bg-accent disabled:opacity-50"
                    >
                      Skip for now — go to workspace
                      <IconArrowRight size={16} />
                    </button>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Availability varies by country. Some countries require
                      business verification before a number can be assigned.
                    </p>
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
                    ) : isLast ? (
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
          </div>
        </div>
      </section>
    </main>
  );
}
