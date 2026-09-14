"use client";

import { useState } from "react";
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
  IconPhoneCall,
  IconPlus,
  IconUserCircle,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useWorkspaceSave } from "@/hooks/use-workspace-save";
import { OnboardingModal } from "./onboarding-modal";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { DEFAULT_CALL_PREFERENCES, type CallPreferences } from "@/lib/model";

export function SettingsPage() {
  const { state, update, workspaces, createWorkspace, isSaving } = useWorkspaceSave();
  const { user } = useAuth();
  const initialName = state.settings.owner || user?.name || "Your name";
  const [displayName, setDisplayName] = useState(initialName);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(initialName);

  const calls: CallPreferences = {
    ...DEFAULT_CALL_PREFERENCES,
    ...state.settings.calls,
  };

  const [newWorkspaceModalOpen, setNewWorkspaceModalOpen] = useState(false);

  async function handleSaveName(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!tempName.trim()) {
      toast.error("Display name cannot be empty");
      return;
    }
    const trimmed = tempName.trim();
    const saved = await update((s) => ({
      ...s,
      settings: { ...s.settings, owner: trimmed },
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
        {isSaving && <span role="status" className="ml-3 inline-flex items-center gap-2 align-middle text-[12px] font-normal tracking-normal text-muted-foreground"><IconLoader2 size={14} className="animate-spin" aria-hidden="true" />Saving changes…</span>}
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
              <span>{user?.email || "preciouskayili@gmail.com"}</span>
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
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white transition hover:bg-primary/90 disabled:opacity-60"
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
                    Call customers before their appointment so they can confirm
                    or reschedule their booking without staff follow-up work.
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
                  <select disabled={isSaving}
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
          <div className={`px-4 py-4 ${!calls.enabled ? "opacity-60" : ""}`}>
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
                    intervals until confirmed or cancelled.
                  </p>
                </div>
              </div>
              <Switch
                disabled={!calls.enabled || isSaving}
                checked={calls.unpaidEnabled}
                onCheckedChange={(unpaidEnabled) =>
                  handleUpdateCalls({ unpaidEnabled })
                }
              />
            </div>

            {calls.enabled && calls.unpaidEnabled && (
              <div className="ml-8 mt-3 flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/50 text-[12px]">
                <span className="text-muted-foreground font-medium">
                  Follow-up interval:
                </span>
                <div className="relative">
                  <select disabled={isSaving}
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
            <strong className="text-[13px] font-semibold text-foreground">
              Light & calm
            </strong>
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
                  Public page: /b/{state.business.slug} · {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setNewWorkspaceModalOpen(true)}
              className="shrink-0 rounded-full border-0 bg-muted px-3.5 py-1.5 text-[12px] font-medium text-foreground hover:bg-black/5 shadow-none"
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

      {/* New Workspace Modal */}
      {newWorkspaceModalOpen && (
        <OnboardingModal
          open={newWorkspaceModalOpen}
          onClose={() => setNewWorkspaceModalOpen(false)}
          onSubmit={async (data) => {
            await createWorkspace(data);
            setNewWorkspaceModalOpen(false);
          }}
          initialOwner={user?.name || ""}
        />
      )}
    </div>
  );
}
