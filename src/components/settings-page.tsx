"use client";
import { BusinessPhoneSettings } from "./business-phone";

import { useRef, useState, type FormEvent } from "react";
import {
  IconBuildingStore,
  IconCheck,
  IconChevronDown,
  IconCircleCheckFilled,
  IconClock,
  IconCoins,
  IconCreditCard,
  IconId,
  IconLoader2,
  IconPalette,
  IconPencil,
  IconPhone,
  IconPhoneCall,
  IconPlus,
  IconSearch,
  IconUserCircle,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspaceSave } from "@/hooks/use-workspace-save";
import { useCallsQuery, useTriggerCallMutation } from "@/hooks/use-api";
import { useRouter } from "next/navigation";
import { ThemeSelect } from "./theme-provider";
import { ImageUpload } from "./image-upload";
import { studioIcons, Modal } from "./shared";
import { InlineError } from "./feedback";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_CALL_PREFERENCES,
  initials,
  type CallPreferences,
} from "@/lib/model";

export function SettingsPage() {
  const { state, update, workspaces, isSaving } = useWorkspaceSave();
  const { user } = useAuth();
  const router = useRouter();
  const ownerStaff =
    state.staff.find((s) => s.id === state.settings.ownerStaffId) ??
    state.staff.find((s) => s.role === "Owner");
  const initialName = state.settings.owner || user?.name || "Your name";
  const [displayName, setDisplayName] = useState(initialName);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(initialName);

  const calls: CallPreferences = {
    ...DEFAULT_CALL_PREFERENCES,
    ...state.settings.calls,
  };

  const [tab, setTab] = useState("Call logs");
  const [callSearch, setCallSearch] = useState("");
  const [callType, setCallType] = useState("All");
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("+234 800 123 4567");
  const [testName, setTestName] = useState("Jane Doe");
  const [testService, setTestService] = useState("Signature Cut & Style");
  const [testCallType, setTestCallType] = useState<
    "reminder" | "confirmation"
  >("reminder");
  const callsQuery = useCallsQuery(50);
  const callLock = useRef(false);
  const triggerCallMutation = useTriggerCallMutation();
  const callTypes = Array.from(
    new Set((callsQuery.data ?? []).map((c) => c.call_type).filter(Boolean)),
  );
  const callQuery = callSearch.trim().toLowerCase();
  const visibleCalls = (callsQuery.data ?? []).filter(
    (c) =>
      (callType === "All" || c.call_type === callType) &&
      (!callQuery ||
        `${c.to_number} ${c.from_number} ${c.status} ${c.call_type}`
          .toLowerCase()
          .includes(callQuery)),
  );
  const activities = state.agentActivity.filter(
    (a) =>
      tab === "All activity" ||
      (tab === "Reservations"
        ? a.kind !== "confirmed"
        : a.kind === "confirmed"),
  );

  async function handleTestCall(e: FormEvent) {
    e.preventDefault();
    if (!testPhone.trim()) {
      toast.error("Please provide a phone number");
      return;
    }
    if (callLock.current) return;
    callLock.current = true;
    try {
      await triggerCallMutation.mutateAsync({
        toNumber: testPhone.trim(),
        customerName: testName.trim(),
        serviceName: testService.trim(),
        appointmentTime: "10:30 AM",
        appointmentDate: "Tomorrow",
        callType: testCallType,
      });
      setTestModalOpen(false);
    } catch {
      // Handled in mutation hook
    } finally {
      callLock.current = false;
    }
  }

  async function handleSaveName(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!tempName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }
    const trimmed = tempName.trim();
    const saved = await update((s) => ({
      ...s,
      settings: { ...s.settings, owner: trimmed, ownerStaffId: ownerStaff?.id },
      business: { ...s.business, owner: trimmed },
      staff: s.staff.map((member) =>
        member.id === ownerStaff?.id
          ? { ...member, name: trimmed, initials: initials(trimmed) }
          : member,
      ),
    }));
    if (saved) {
      setDisplayName(trimmed);
      setEditingName(false);
      toast.success("Display name updated");
    }
  }

  async function handleUpdateCalls(patch: Partial<CallPreferences>) {
    const updated: CallPreferences = { ...calls, ...patch };
    const saved = await update((s) => ({
      ...s,
      settings: {
        ...s.settings,
        calls: updated,
        reminders: updated.enabled,
        confirmations: updated.enabled,
      },
    }));
    if (saved) toast.success("Call check-in settings saved");
  }

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
        Account
        {isSaving && (
          <span
            role="status"
            className="ml-3 inline-flex items-center gap-2 align-middle text-[12px] font-normal tracking-normal text-muted-foreground"
          >
            <IconLoader2
              size={14}
              className="animate-spin"
              aria-hidden="true"
            />
            Saving changes…
          </span>
        )}
      </h1>

      {/* User profile */}
      <section className="mt-8">
        <div>
          <h2 className="text-[15px] font-medium text-foreground">
            User profile
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Your profile and changes to it will be visible across the studio.
          </p>
        </div>

        <Card className="mt-3 divide-y divide-border overflow-hidden rounded-[14px] border border-border bg-card p-0 shadow-none">
          <div className="px-4 py-4">
            <ImageUpload
              label="Profile photo"
              name={displayName}
              value={ownerStaff?.avatarUrl}
              disabled={isSaving || !ownerStaff}
              onChange={async (avatarUrl) => {
                const saved = await update((s) => ({
                  ...s,
                  settings: { ...s.settings, ownerStaffId: ownerStaff?.id },
                  staff: s.staff.map((member) =>
                    member.id === ownerStaff?.id
                      ? { ...member, avatarUrl }
                      : member,
                  ),
                }));
                if (saved) toast.success("Profile photo updated");
              }}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Shown on your staff profile, appointments, and public booking
              page.
            </p>
          </div>
          {/* Username */}
          <div className="flex items-center px-4 py-3.5 max-sm:flex-wrap max-sm:gap-2">
            <div className="flex w-52 shrink-0 items-center gap-3 text-[13px] font-medium text-foreground max-sm:w-full">
              <IconUserCircle
                size={20}
                stroke={1.5}
                className="shrink-0 text-muted-foreground"
              />
              <span>Username</span>
            </div>
            <div className="flex flex-1 items-center gap-1.5 text-[13px] text-foreground">
              <span>{user?.email || ""}</span>
              <IconCircleCheckFilled
                size={16}
                className="shrink-0 text-emerald-500"
              />
            </div>
          </div>

          {/* Display name */}
          <div className="flex items-center justify-between px-4 py-3.5 max-sm:flex-wrap max-sm:gap-2">
            <div className="flex flex-1 items-center max-sm:w-full">
              <div className="flex w-52 shrink-0 items-center gap-3 text-[13px] font-medium text-foreground max-sm:w-32">
                <IconId
                  size={20}
                  stroke={1.5}
                  className="shrink-0 text-muted-foreground"
                />
                <span>Display name</span>
              </div>
              <div className="flex flex-1 items-center">
                {editingName ? (
                  <form
                    onSubmit={handleSaveName}
                    className="flex items-center gap-2"
                  >
                    <Input
                      disabled={isSaving}
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="h-8 w-48 rounded-lg border border-border bg-muted/40 px-2.5 text-[13px] text-foreground shadow-none focus-visible:ring-1 focus-visible:ring-primary"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                      aria-label="Save display name"
                    >
                      {isSaving ? (
                        <IconLoader2 size={13} className="animate-spin" />
                      ) : (
                        <IconCheck size={14} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempName(displayName);
                        setEditingName(false);
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:text-foreground"
                      disabled={isSaving}
                      aria-label="Cancel editing"
                    >
                      <IconX size={14} />
                    </button>
                  </form>
                ) : (
                  <span className="text-[13px] text-foreground">
                    {displayName}
                  </span>
                )}
              </div>
            </div>
            {!editingName && (
              <button
                onClick={() => {
                  setTempName(displayName);
                  setEditingName(true);
                }}
                className="p-1 text-muted-foreground transition hover:text-foreground"
                aria-label="Edit display name"
              >
                <IconPencil size={16} stroke={1.5} />
              </button>
            )}
          </div>
        </Card>
      </section>

      <section className="mt-8"><BusinessPhoneSettings /></section>
      {/* Customer Reminders & Call Check-ins */}
      <section className="mt-8">
        <div>
          <h2 className="text-[15px] font-medium text-foreground">
            Customer reminders & call check-ins
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Automated phone check-ins and timely reminders for your
            reservations.
          </p>
        </div>

        <Card className="mt-3 divide-y divide-border overflow-hidden rounded-[14px] border border-border bg-card p-0 shadow-none">
          {/* Booking reminder calls */}
          <div className="px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <IconPhoneCall
                  size={20}
                  stroke={1.5}
                  className="mt-0.5 shrink-0 text-muted-foreground"
                />
                <div>
                  <span className="block text-[13px] font-medium text-foreground">
                    Booking reminder calls
                  </span>
                  <p className="mt-0.5 max-w-[540px] text-[12px] leading-relaxed text-muted-foreground">
                    Call customers before their appointment to remind them of
                    the time and service they booked.
                  </p>
                </div>
              </div>
              <Switch
                disabled={isSaving}
                checked={calls.enabled}
                onCheckedChange={(enabled) => handleUpdateCalls({ enabled })}
              />
            </div>

            {calls.enabled && (
              <div className="ml-8 mt-3 flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/50 text-[12px]">
                <span className="text-muted-foreground font-medium">
                  Call before appointment:
                </span>
                <div className="relative">
                  <select
                    disabled={isSaving}
                    value={calls.reminderMinutes}
                    onChange={(e) =>
                      handleUpdateCalls({
                        reminderMinutes: Number(e.target.value),
                      })
                    }
                    className="appearance-none cursor-pointer rounded-lg border border-border bg-muted/40 py-1 pl-2.5 pr-7 text-[12px] font-medium text-foreground hover:bg-muted/70 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value={60}>1 hour before</option>
                    <option value={120}>2 hours before</option>
                    <option value={1440}>24 hours before (1 day)</option>
                    <option value={2880}>48 hours before (2 days)</option>
                  </select>
                  <IconChevronDown
                    size={13}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Unpaid booking follow-ups */}
          <div className="px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <IconCreditCard
                  size={20}
                  stroke={1.5}
                  className="mt-0.5 shrink-0 text-muted-foreground"
                />
                <div>
                  <span className="block text-[13px] font-medium text-foreground">
                    Unpaid booking follow-ups
                  </span>
                  <p className="mt-0.5 max-w-[540px] text-[12px] leading-relaxed text-muted-foreground">
                    Follow up on outstanding deposits and payments at chosen
                    intervals until the required payment is confirmed or the
                    booking is cancelled. Follow-ups pause while a receipt is
                    under review.
                  </p>
                </div>
              </div>
              <Switch
                disabled={isSaving}
                checked={calls.unpaidEnabled}
                onCheckedChange={(unpaidEnabled) =>
                  handleUpdateCalls({ unpaidEnabled })
                }
              />
            </div>

            {calls.unpaidEnabled && (
              <div className="ml-8 mt-3 flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/50 text-[12px]">
                <span className="text-muted-foreground font-medium">
                  Follow-up interval:
                </span>
                <div className="relative">
                  <select
                    disabled={isSaving}
                    value={calls.unpaidIntervalMinutes}
                    onChange={(e) =>
                      handleUpdateCalls({
                        unpaidIntervalMinutes: Number(e.target.value),
                      })
                    }
                    className="appearance-none cursor-pointer rounded-lg border border-border bg-muted/40 py-1 pl-2.5 pr-7 text-[12px] font-medium text-foreground hover:bg-muted/70 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value={60}>Every 1 hour</option>
                    <option value={120}>Every 2 hours</option>
                    <option value={240}>Every 4 hours</option>
                    <option value={1440}>Every 24 hours (daily)</option>
                  </select>
                  <IconChevronDown
                    size={13}
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Voice call activity */}
      <section className="mt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-medium text-foreground">
              Voice call activity
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Call history for the automated phone assistant.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setTestModalOpen(true)}
            className="shrink-0 rounded-full border-0 bg-muted px-3.5 py-1.5 text-[12px] font-medium text-foreground hover:bg-accent shadow-none"
          >
            <IconPhone size={14} className="mr-1" />
            Test call
          </Button>
        </div>

        <Card className="mt-3 overflow-hidden rounded-[14px] border border-border bg-card p-0 shadow-none">
          <div className="flex flex-wrap items-center gap-1 border-b border-border px-4 py-3">
            {["Call logs", "All activity", "Reservations", "Confirmations"].map(
              (t) => (
                <button
                  key={t}
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-[12px] transition ${
                    tab === t
                      ? "bg-muted font-semibold text-foreground"
                      : "font-medium text-muted-foreground hover:bg-muted/60"
                  }`}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ),
            )}
          </div>
          {tab === "Call logs" && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
              <div className="relative min-w-52 flex-1">
                <IconSearch
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-label="Search calls"
                  value={callSearch}
                  onChange={(e) => setCallSearch(e.target.value)}
                  placeholder="Search by number or status"
                  className="h-9 rounded-lg bg-muted/40 pl-9 pr-3 text-[12px] shadow-none"
                />
              </div>
              <div className="relative">
                <select
                  aria-label="Filter by call type"
                  value={callType}
                  onChange={(e) => setCallType(e.target.value)}
                  className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-muted/40 py-1 pl-2.5 pr-7 text-[12px] font-medium capitalize text-foreground hover:bg-muted/70 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="All">All types</option>
                  {callTypes.map((type) => (
                    <option key={type} value={type} className="capitalize">
                      {type.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <IconChevronDown
                  size={13}
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
              <span className="text-[12px] text-muted-foreground">
                {visibleCalls.length} of {callsQuery.data?.length ?? 0}
              </span>
            </div>
          )}
          <div className="max-h-[360px] overflow-y-auto px-4">
            {tab === "Call logs" ? (
              <div className="divide-y divide-border">
                {callsQuery.isLoading ? (
                  <div
                    className="divide-y divide-border/60"
                    role="status"
                    aria-label="Loading call logs"
                    aria-busy="true"
                  >
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 py-4">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-44 rounded" />
                            <Skeleton className="h-4 w-16 rounded-full" />
                          </div>
                          <Skeleton className="h-3.5 w-36 rounded" />
                        </div>
                        <Skeleton className="h-3 w-12 rounded" />
                      </div>
                    ))}
                  </div>
                ) : callsQuery.isError ? (
                  <InlineError
                    title="Call logs couldn’t load."
                    onRetry={() => void callsQuery.refetch()}
                    busy={callsQuery.isFetching}
                  />
                ) : !visibleCalls.length ? (
                  <div className="py-8 text-center text-[13px] text-muted-foreground">
                    {callsQuery.data?.length
                      ? "No calls match this search."
                      : "No voice calls yet. Customers can call your business number, or use “Test call” above."}
                  </div>
                ) : (
                  visibleCalls.map((c) => (
                    <div key={c.id} className="flex items-center gap-4 py-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
                        <IconPhone size={19} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-[13px] font-medium text-foreground">
                            {c.direction === "inbound"
                              ? `Call from ${c.from_number || "a hidden number"}`
                              : `Outbound call to ${c.to_number}`}
                          </strong>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {c.call_type}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          Status:{" "}
                          <span className="font-medium text-foreground capitalize">
                            {c.status}
                          </span>
                          {c.duration_seconds
                            ? ` · ${c.duration_seconds}s duration`
                            : ""}
                        </p>
                      </div>
                      <small className="shrink-0 text-[12px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activities.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 py-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      {a.kind === "confirmed" ? (
                        <IconCheck size={19} />
                      ) : a.kind === "created" ? (
                        <IconPlus size={19} />
                      ) : (
                        <IconClock size={19} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className="block text-[12px] font-semibold text-foreground">
                        {a.title}
                      </strong>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {a.detail}
                      </p>
                    </div>
                    <small className="shrink-0 text-[12px] text-muted-foreground">
                      {a.time}
                    </small>
                  </div>
                ))}
                {!activities.length && (
                  <div className="py-8 text-center text-[13px] text-muted-foreground">
                    No activity yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </section>

      {testModalOpen && (
        <Modal
          title="Test Voice AI Call"
          description="Place an outbound test call powered by Aethex Voice AI."
          busy={triggerCallMutation.isPending}
          onClose={() => {
            if (!callLock.current) setTestModalOpen(false);
          }}
        >
          <form onSubmit={handleTestCall} className="space-y-4">
            <fieldset
              disabled={triggerCallMutation.isPending}
              className="contents space-y-4"
            >
              <div>
                <label className="block text-[12px] font-medium text-foreground">
                  Destination phone number (E.164 format)
                </label>
                <Input
                  type="tel"
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+234 800 123 4567 or +14155552671"
                  className="mt-1.5 h-10 bg-muted"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
                <div>
                  <label className="block text-[12px] font-medium text-foreground">
                    Customer name
                  </label>
                  <Input
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="mt-1.5 h-10 bg-muted"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-foreground">
                    Service name
                  </label>
                  <Input
                    value={testService}
                    onChange={(e) => setTestService(e.target.value)}
                    placeholder="e.g. Signature Cut"
                    className="mt-1.5 h-10 bg-muted"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-foreground">
                  Call type
                </label>
                <div className="mt-1.5 flex gap-2">
                  {(["reminder", "confirmation"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTestCallType(type)}
                      className={`flex-1 rounded-xl py-2 text-[12px] font-medium capitalize transition ${
                        testCallType === type
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-background"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={triggerCallMutation.isPending}
                  onClick={() => {
                    if (!callLock.current) setTestModalOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  loading={triggerCallMutation.isPending}
                  loadingText="Calling…"
                  type="submit"
                  disabled={triggerCallMutation.isPending}
                  className="gap-2 bg-primary text-primary-foreground"
                >
                  {triggerCallMutation.isPending ? (
                    <>
                      <IconLoader2 size={16} className="animate-spin" />
                      <span>Placing call…</span>
                    </>
                  ) : (
                    <>
                      <IconPhone size={16} />
                      <span>Place Voice AI Call</span>
                    </>
                  )}
                </Button>
              </div>
            </fieldset>
          </form>
        </Modal>
      )}

      <section className="mt-8">
        <h2 className="text-[15px] font-medium">Business identity</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Make your workspace and booking page recognisable.
        </p>
        <Card className="mt-3 gap-5 rounded-[14px] bg-card p-4">
          <ImageUpload
            label="Business logo"
            name={state.business.name}
            value={state.business.logoUrl}
            disabled={isSaving}
            onChange={async (logoUrl) => {
              if (
                await update((s) => ({
                  ...s,
                  business: { ...s.business, logoUrl },
                }))
              )
                toast.success("Business logo updated");
            }}
          />
          <div>
            <p className="mb-2 text-xs font-medium">
              Store icon · shown when there is no logo
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(studioIcons).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  disabled={isSaving}
                  aria-label={`${key} icon`}
                  title={key.charAt(0).toUpperCase() + key.slice(1)}
                  aria-pressed={(state.business.icon ?? "store") === key}
                  onClick={() =>
                    void update((s) => ({
                      ...s,
                      business: {
                        ...s.business,
                        icon: key as typeof s.business.icon,
                      },
                    }))
                  }
                  className={`flex size-10 items-center justify-center rounded-xl ${(state.business.icon ?? "store") === key ? "bg-accent text-primary ring-1 ring-primary" : "bg-muted text-muted-foreground"}`}
                >
                  <Icon size={20} stroke={1.5} />
                </button>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Workspace Settings */}
      <section className="mt-8">
        <div>
          <h2 className="text-[15px] font-medium text-foreground">
            Workspace preferences
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Regional studio defaults and preferences for your workspace.
          </p>
        </div>

        <Card className="mt-3 divide-y divide-border overflow-hidden rounded-[14px] border border-border bg-card p-0 shadow-none">
          {/* Time zone */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <IconClock
                size={20}
                stroke={1.5}
                className="shrink-0 text-muted-foreground"
              />
              <span className="text-[13px] font-medium text-foreground">
                Time zone
              </span>
            </div>
            <strong className="text-[13px] font-semibold text-foreground">
              Africa/Lagos · WAT (UTC+1)
            </strong>
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <IconCoins
                size={20}
                stroke={1.5}
                className="shrink-0 text-muted-foreground"
              />
              <span className="text-[13px] font-medium text-foreground">
                Currency
              </span>
            </div>
            <strong className="text-[13px] font-semibold text-foreground">
              Nigerian naira (₦)
            </strong>
          </div>

          {/* Appearance */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <IconPalette
                size={20}
                stroke={1.5}
                className="shrink-0 text-muted-foreground"
              />
              <span className="text-[13px] font-medium text-foreground">
                Appearance
              </span>
            </div>
            <ThemeSelect />
          </div>

          {/* Active Studio Workspace */}
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <IconBuildingStore
                size={20}
                stroke={1.5}
                className="mt-0.5 shrink-0 text-muted-foreground"
              />
              <div>
                <span className="block text-[13px] font-medium text-foreground">
                  {state.business.name || "Studio Workspace"}
                </span>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Public page: /b/{state.business.slug} · {workspaces.length}{" "}
                  workspace{workspaces.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push("/onboarding")}
              className="shrink-0 rounded-full border-0 bg-muted px-3.5 py-1.5 text-[12px] font-medium text-foreground hover:bg-accent shadow-none"
            >
              <IconPlus size={14} className="mr-1" />
              New workspace
            </Button>
          </div>
        </Card>
      </section>

      {/* Subtle footer */}
      <div className="mt-12 text-[11px] text-muted-foreground/60">
        <span>Reserv Studio 1.0.0</span>
      </div>
    </div>
  );
}
