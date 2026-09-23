"use client";

import { useId, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import {
  IconPhoneCall,
  IconClock,
  IconCreditCard,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { useWorkspaceSave } from "@/hooks/use-workspace-save";
import { DEFAULT_CALL_PREFERENCES, type CallPreferences } from "@/lib/model";

function Interval({
  label,
  minutes,
  onChange,
  disabled,
}: {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
  disabled: boolean;
}) {
  const id = useId();
  const [unit, setUnit] = useState(minutes % 60 === 0 ? "hours" : "minutes");
  const multiplier = unit === "hours" ? 60 : 1;
  return (
    <div className="mt-4">
      <label className="mb-2 block text-[12px] font-medium" htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          aria-label={label}
          type="number"
          required
          min={unit === "hours" ? 5 / 60 : 5}
          max={unit === "hours" ? 720 : 43200}
          step="any"
          disabled={disabled}
          value={minutes ? minutes / multiplier : ""}
          onChange={(event) =>
            onChange(Number(event.target.value) * multiplier)
          }
          className="w-24 border-0 bg-card"
        />
        <Select
          value={unit}
          disabled={disabled}
          onValueChange={(value) => {
            if (value) {
              setUnit(value);
            }
          }}
        >
          <SelectTrigger
            aria-label={`${label} unit`}
            className="min-w-28 border-0 bg-card"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="minutes">Minutes</SelectItem>
            <SelectItem value="hours">Hours</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function AutomaticCallSettings() {
  const { state } = useStore();
  if (!state.loaded) return null;
  return (
    <CallSettingsForm
      key={JSON.stringify(state.settings.calls)}
      initial={{ ...DEFAULT_CALL_PREFERENCES, ...state.settings.calls }}
    />
  );
}

function CallSettingsForm({ initial }: { initial: CallPreferences }) {
  const { update, isSaving } = useWorkspaceSave();
  const { activeWorkspaceId } = useStore();
  const availability = useQuery({
    queryKey: ["automatic-call-status", activeWorkspaceId],
    queryFn: () => request<{ available: boolean; phoneReady: boolean }>("/api/calls/status"),
    enabled: !!activeWorkspaceId,
    refetchInterval: 60000,
    retry: false,
  });
  const [draft, setDraft] = useState(initial);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (
      ![draft.reminderMinutes, draft.unpaidIntervalMinutes].every(
        (value) => Number.isInteger(value) && value >= 5 && value <= 43200,
      )
    ) {
      toast.error("Choose intervals from 5 minutes to 720 hours.");
      return;
    }
    const saved = await update((state) => ({
      ...state,
      settings: {
        ...state.settings,
        calls: draft,
        reminders: draft.enabled,
        confirmations: draft.enabled,
      },
    }));
    if (saved) toast.success("Call preferences saved");
  }

  return (
    <Card
      id="automatic-calls"
      className="scroll-mt-8 gap-0 rounded-[21px] border-0 bg-card p-7"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
          <IconPhoneCall size={21} stroke={1.6} />
        </span>
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">
            Automatic calls
          </h2>
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
            Set when customers receive appointment and payment calls.
          </p>
        </div>
      </div>
      <form onSubmit={save} className="mt-6 space-y-4">
        <div className="rounded-2xl bg-muted/70 p-5">
          <div className="flex items-start justify-between gap-4">
            <label htmlFor="enable-calls" className="cursor-pointer">
              <strong className="flex items-center gap-2 text-[13px] font-medium">
                <IconClock size={17} /> Booking reminder calls
              </strong>
              <span className="mt-2 block text-[12px] leading-5 text-muted-foreground">
                Call before the appointment to remind customers of their
                scheduled time.
              </span>
            </label>
            <Switch
              id="enable-calls"
              disabled={isSaving}
              checked={draft.enabled}
              onCheckedChange={(enabled) => setDraft({ ...draft, enabled })}
            />
          </div>
          <Interval
            label="Call before the appointment"
            minutes={draft.reminderMinutes}
            onChange={(reminderMinutes) =>
              setDraft({ ...draft, reminderMinutes })
            }
            disabled={isSaving || !draft.enabled}
          />
        </div>
        <div className="rounded-2xl bg-muted/70 p-5">
          <div className="flex items-start justify-between gap-4">
            <label htmlFor="enable-payment-calls" className="cursor-pointer">
              <strong className="flex items-center gap-2 text-[13px] font-medium">
                <IconCreditCard size={17} /> Unpaid booking follow-ups
              </strong>
              <span className="mt-2 block text-[12px] leading-5 text-muted-foreground">
                Follow up on an outstanding payment at the interval you choose.
              </span>
            </label>
            <Switch
              id="enable-payment-calls"
              disabled={isSaving}
              checked={draft.unpaidEnabled}
              onCheckedChange={(unpaidEnabled) =>
                setDraft({ ...draft, unpaidEnabled })
              }
            />
          </div>
          <Interval
            label="Call again every"
            minutes={draft.unpaidIntervalMinutes}
            onChange={(unpaidIntervalMinutes) =>
              setDraft({ ...draft, unpaidIntervalMinutes })
            }
            disabled={isSaving || !draft.unpaidEnabled}
          />
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            Stop when the required payment is confirmed, the booking is
            cancelled, or the appointment begins. Pause while a receipt is under
            review.
          </p>
        </div>
        <p role="status" className="text-[12px] leading-5 text-muted-foreground">
          {availability.isError ? "Couldn’t check call availability. Try again shortly."
            : availability.isPending ? "Checking call availability…"
            : !availability.data?.phoneReady ? "Set up your business phone number to send automatic calls."
            : !availability.data.available ? "Automatic calls are currently unavailable. Your preferences are saved. Contact support if this continues."
            : "Automatic calls are available. Calls are checked every few minutes."}
        </p>
        <Button type="submit" disabled={isSaving} className="gap-2 rounded-xl">
          {isSaving ? (
            <IconLoader2 size={16} className="animate-spin" />
          ) : (
            <IconCheck size={17} />
          )}
          {isSaving ? "Saving settings…" : "Save call settings"}
        </Button>
      </form>
    </Card>
  );
}
