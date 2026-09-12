"use client";

import { useState, type FormEvent } from "react";
import { IconPhoneCall, IconClock, IconCreditCard, IconCheck, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { DEFAULT_CALL_PREFERENCES, type CallPreferences } from "@/lib/model";

function Interval({ label, minutes, onChange, disabled }: { label: string; minutes: number; onChange: (minutes: number) => void; disabled: boolean }) {
  const [unit, setUnit] = useState(minutes % 60 === 0 ? "hours" : "minutes");
  const multiplier = unit === "hours" ? 60 : 1;
  return <div className="mt-4">
    <label className="mb-2 block text-[12px] font-medium" htmlFor={label}>{label}</label>
    <div className="flex items-center gap-2">
      <Input id={label} aria-label={label} type="number" required min={1} max={unit === "hours" ? 168 : 10080} step={1} disabled={disabled} value={minutes ? minutes / multiplier : ""} onChange={event => onChange(Number(event.target.value) * multiplier)} className="w-24 border-0 bg-white" />
      <Select value={unit} disabled={disabled} onValueChange={value => { if (value) { setUnit(value); onChange(Math.max(1, Math.round(minutes / multiplier)) * (value === "hours" ? 60 : 1)); } }}>
        <SelectTrigger aria-label={`${label} unit`} className="min-w-28 border-0 bg-white"><SelectValue /></SelectTrigger>
        <SelectContent alignItemWithTrigger={false}><SelectItem value="minutes">Minutes</SelectItem><SelectItem value="hours">Hours</SelectItem></SelectContent>
      </Select>
    </div>
  </div>;
}

export function AutomaticCallSettings() {
  const { state } = useStore();
  if (!state.loaded) return null;
  return <CallSettingsForm key={JSON.stringify(state.settings.calls)} initial={{ ...DEFAULT_CALL_PREFERENCES, ...state.settings.calls }} />;
}

function CallSettingsForm({ initial }: { initial: CallPreferences }) {
  const { update } = useStore();
  const [draft, setDraft] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  function save(event: FormEvent) {
    event.preventDefault();
    if (![draft.reminderMinutes, draft.unpaidIntervalMinutes].every(value => Number.isInteger(value) && value >= 1 && value <= 10080)) {
      toast.error("Choose intervals from 1 minute to 168 hours.");
      return;
    }
    setIsSaving(true);
    update(state => ({ ...state, settings: { ...state.settings, calls: draft, reminders: draft.enabled, confirmations: draft.enabled } }));
    toast.success("Call preferences saved");
    setTimeout(() => setIsSaving(false), 300);
  }

  return <Card id="automatic-calls" className="scroll-mt-8 gap-0 rounded-[21px] border-0 bg-card p-7">
    <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"><IconPhoneCall size={21} stroke={1.6} /></span><div><h2 className="text-[20px] font-semibold tracking-tight">Automatic calls</h2><p className="mt-1 text-[12px] leading-5 text-muted-foreground">A timely reminder, without the follow-up work.</p></div></div>
    <form onSubmit={save} className="mt-6 space-y-4">
      <div className="rounded-2xl bg-muted/70 p-5">
        <div className="flex items-start justify-between gap-4"><label htmlFor="enable-calls" className="cursor-pointer"><strong className="flex items-center gap-2 text-[13px] font-medium"><IconClock size={17} /> Booking reminder calls</strong><span className="mt-2 block text-[12px] leading-5 text-muted-foreground">Call before the appointment so customers can confirm or cancel their booking.</span></label><Switch id="enable-calls" checked={draft.enabled} onCheckedChange={enabled => setDraft({ ...draft, enabled })} /></div>
        <Interval label="Call before the appointment" minutes={draft.reminderMinutes} onChange={reminderMinutes => setDraft({ ...draft, reminderMinutes })} disabled={!draft.enabled} />
      </div>
      <div className={`rounded-2xl bg-muted/70 p-5 ${!draft.enabled ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between gap-4"><label htmlFor="enable-payment-calls" className="cursor-pointer"><strong className="flex items-center gap-2 text-[13px] font-medium"><IconCreditCard size={17} /> Unpaid booking follow-ups</strong><span className="mt-2 block text-[12px] leading-5 text-muted-foreground">Follow up on an outstanding payment at the interval you choose.</span></label><Switch id="enable-payment-calls" disabled={!draft.enabled} checked={draft.unpaidEnabled} onCheckedChange={unpaidEnabled => setDraft({ ...draft, unpaidEnabled })} /></div>
        <Interval label="Call again every" minutes={draft.unpaidIntervalMinutes} onChange={unpaidIntervalMinutes => setDraft({ ...draft, unpaidIntervalMinutes })} disabled={!draft.enabled || !draft.unpaidEnabled} />
        <p className="mt-3 text-[11px] leading-5 text-muted-foreground">Stop when payment is confirmed, the booking is cancelled, or the appointment begins.</p>
      </div>
      <p className="text-[12px] leading-5 text-muted-foreground">Powered by Aethex Voice AI. Reminders and check-ins dispatch automatically according to your schedule.</p>
      <Button type="submit" disabled={isSaving} className="gap-2 rounded-xl">
        {isSaving ? <IconLoader2 size={16} className="animate-spin" /> : <IconCheck size={17} />}
        {isSaving ? "Saving settings…" : "Save call settings"}
      </Button>
    </form>
  </Card>;
}
