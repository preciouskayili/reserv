"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconPhone,
  IconLoader2,
  IconCheck,
  IconSearch,
  IconCopy,
  IconWorld,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { request } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { BusinessVoice } from "@/lib/model";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Modal } from "./shared";

export interface PhoneCountry { code: string; name: string; dialCode?: string }
export function usePhoneCountries() {
  return useQuery({ queryKey: ["phone-countries"], queryFn: () => request<{ countries: PhoneCountry[] }>("/api/workspaces/voice/countries"), staleTime: 3600000, retry: 1 });
}
function CountryFlag({ code, size = 20 }: { code: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border"
      style={{ width: size, height: size }}
    >
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://flagcdn.com/w80/${code.toLowerCase()}.png`}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
function CountryPickerModal({ value, onChange, onClose }: { value: string; onChange: (country: string) => void; onClose: () => void }) {
  const countries = usePhoneCountries();
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase().replace(/^\+/, "");
  const filtered = countries.data?.countries.filter(c => `${c.name} ${c.code} ${c.dialCode ?? ""}`.toLowerCase().includes(search));
  return (
    <Modal title="Choose a country" description="This decides where your business number lives. Search by name or dialling code." onClose={onClose}>
      <div className="relative">
        <IconSearch size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search Nigeria or +234…"
          className="h-10 rounded-xl bg-muted pl-9 pr-3 text-[13px] shadow-none"
        />
      </div>
      <div className="-mx-2 mt-3 max-h-80 overflow-y-auto">
        {filtered?.length ? filtered.map(country => (
          <button
            key={country.code}
            type="button"
            onClick={() => { onChange(country.code); onClose(); }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] hover:bg-muted ${value === country.code ? "bg-accent text-primary" : "text-foreground"}`}
          >
            <CountryFlag code={country.code} size={22} />
            <span className="min-w-0 flex-1 truncate">{country.name}</span>
            {country.dialCode && <span className="shrink-0 tabular-nums text-muted-foreground">+{country.dialCode}</span>}
            {value === country.code ? <IconCheck size={16} className="shrink-0" /> : <span className="w-4 shrink-0" />}
          </button>
        )) : (
          <p className="py-8 text-center text-[13px] text-muted-foreground">No countries match “{query}”.</p>
        )}
      </div>
    </Modal>
  );
}
/** The number-to-be. One shape for every stage: unclaimed, country chosen, live. */
export function NumberCountrySelect({ value, onChange, disabled = false, number }: { value: string; onChange: (country: string) => void; disabled?: boolean; number?: string }) {
  const countries = usePhoneCountries();
  const [open, setOpen] = useState(false);
  const selected = countries.data?.countries.find(c => c.code === value);
  const picker = !disabled && !countries.isError && (
    <button
      type="button"
      disabled={countries.isPending}
      onClick={() => setOpen(true)}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition disabled:opacity-60 ${
        selected ? "bg-card text-foreground hover:bg-background" : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
    >
      {countries.isPending ? "Loading…" : selected ? "Change" : "Select country"}
    </button>
  );
  return (
    <div>
      {number ? (
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(number);
              toast.success("Business number copied");
            } catch {
              toast.info(`Your business number is ${number}`);
            }
          }}
          className="group flex w-full max-w-md items-center gap-4 rounded-2xl bg-muted px-4 py-4 text-left transition hover:bg-accent"
        >
          <CountryFlag code={value} size={40} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[19px] font-medium tracking-tight tabular-nums">{number}</span>
            <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{selected?.name ?? value}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success-surface px-2 py-0.5 text-success">
                <IconCheck size={11} />Active
              </span>
            </span>
          </span>
          <IconCopy size={17} className="shrink-0 text-muted-foreground transition group-hover:text-foreground" />
        </button>
      ) : (
        <div className={`flex w-full max-w-md flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl px-4 py-4 ${selected ? "bg-muted" : "border border-dashed border-border bg-muted/40"}`}>
          {selected ? (
            <CountryFlag code={selected.code} size={40} />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <IconWorld size={21} stroke={1.5} />
            </span>
          )}
          <span className="min-w-40 flex-1">
            <span className={`block truncate text-[19px] font-medium tracking-tight tabular-nums ${selected ? "text-foreground" : "text-muted-foreground/70"}`}>
              {selected?.dialCode ? `+${selected.dialCode} ` : ""}··· ··· ····
            </span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {selected ? selected.name : "Pick where your number lives"}
            </span>
          </span>
          {picker}
        </div>
      )}
      {countries.isError && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          Countries could not load. <button type="button" onClick={() => void countries.refetch()} className="underline">Retry</button>
        </p>
      )}
      {open && <CountryPickerModal value={value} onChange={onChange} onClose={() => setOpen(false)} />}
    </div>
  );
}
export function BusinessPhoneSettings() {
  const { activeWorkspaceId, state } = useStore();
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["business-phone", activeWorkspaceId],
    queryFn: () => request<{ voice: BusinessVoice | null }>(`/api/workspaces/${activeWorkspaceId}/voice`), enabled: Boolean(activeWorkspaceId),
    refetchInterval: query => ["queued", "provisioning"].includes(query.state.data?.voice?.status ?? "") ? 4000 : false,
  });
  const voice = query.data?.voice ?? state.business.voice;
  const pending = submitting || voice?.status === "queued" || voice?.status === "provisioning";
  const active = voice?.status === "active";
  async function setup(event: React.FormEvent) {
    event.preventDefault(); if (pending || !activeWorkspaceId) return;
    setSubmitting(true); setError("");
    try { await request(`/api/workspaces/${activeWorkspaceId}/voice`, { method: "POST", body: JSON.stringify({ country: country || voice?.country }) }); await query.refetch(); }
    catch (err) { setError(err instanceof Error ? err.message : "Phone setup failed."); }
    finally { setSubmitting(false); }
  }
  return <Card className="mb-6 gap-0 rounded-[21px] bg-card p-6">
    <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"><IconPhone size={20} /></span><div><h2 className="text-[18px] font-medium">Business phone number</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">A dedicated number for this business’s incoming calls, reminders, and payment follow-ups.</p></div></div>
    {query.isPending ? <p className="mt-4 text-xs text-muted-foreground">Loading phone settings…</p> : query.isError ? <p role="alert" className="mt-4 text-xs text-destructive">Phone settings could not load. <button onClick={() => void query.refetch()} className="underline">Retry</button></p> : <form onSubmit={setup} className="mt-5 max-w-md space-y-4">
      <NumberCountrySelect
        value={country || voice?.country || ""}
        onChange={setCountry}
        number={active ? voice.number : undefined}
        disabled={pending || voice?.status === "needs_review"}
      />
      {pending && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><IconLoader2 size={14} className="animate-spin" />Setting up your number. You can leave this page and check back.</p>}
      {(error || voice?.error) && <p role="alert" className="rounded-xl bg-danger-surface p-3 text-xs leading-5 text-destructive">{error || voice?.error}</p>}
      {!active && <Button type="submit" disabled={pending || query.isError || !(country || voice?.country)} className="rounded-xl">{voice?.status === "needs_review" ? "Check setup status" : voice?.status === "failed" ? "Retry phone setup" : "Set up business number"}</Button>}
      <p className="text-xs leading-5 text-muted-foreground">{active ? "Tap the number to copy it. Calls and reminders go out from this line." : "Availability varies by country. Some countries require business verification before a number can be assigned."}</p>
    </form>}
  </Card>;
}
