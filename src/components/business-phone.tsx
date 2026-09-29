"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconPhone,
  IconLoader2,
  IconCheck,
  IconSearch,
  IconCopy,
  IconWorld,
  IconPlayerPlayFilled,
  IconPlayerStopFilled,
  IconMicrophone,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { request } from "@/lib/api";
import { useStore } from "@/lib/store";
import type { BusinessVoice } from "@/lib/model";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Modal } from "./shared";

export interface PhoneCountry {
  code: string;
  name: string;
  dialCode?: string;
}
export function usePhoneCountries() {
  return useQuery({
    queryKey: ["phone-countries"],
    queryFn: () =>
      request<{ countries: PhoneCountry[] }>("/api/workspaces/voice/countries"),
    staleTime: 3600000,
    retry: 1,
  });
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
function CountryPickerModal({
  value,
  onChange,
  onClose,
}: {
  value: string;
  onChange: (country: string) => void;
  onClose: () => void;
}) {
  const countries = usePhoneCountries();
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase().replace(/^\+/, "");
  const filtered = countries.data?.countries.filter((c) =>
    `${c.name} ${c.code} ${c.dialCode ?? ""}`.toLowerCase().includes(search),
  );
  return (
    <Modal
      title="Choose a country"
      description="This decides where your business number lives. Search by name or dialling code."
      onClose={onClose}
    >
      <div className="relative">
        <IconSearch
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Nigeria or +234…"
          className="h-10 rounded-xl bg-muted pl-9 pr-3 text-[13px] shadow-none"
        />
      </div>
      <div className="-mx-2 mt-3 max-h-80 overflow-y-auto">
        {filtered?.length ? (
          filtered.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => {
                onChange(country.code);
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] hover:bg-muted ${value === country.code ? "bg-accent text-primary" : "text-foreground"}`}
            >
              <CountryFlag code={country.code} size={22} />
              <span className="min-w-0 flex-1 truncate">{country.name}</span>
              {country.dialCode && (
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  +{country.dialCode}
                </span>
              )}
              {value === country.code ? (
                <IconCheck size={16} className="shrink-0" />
              ) : (
                <span className="w-4 shrink-0" />
              )}
            </button>
          ))
        ) : (
          <p className="py-8 text-center text-[13px] text-muted-foreground">
            No countries match “{query}”.
          </p>
        )}
      </div>
    </Modal>
  );
}
/** The number-to-be. One shape for every stage: unclaimed, country chosen, live. */
export function NumberCountrySelect({
  value,
  onChange,
  disabled = false,
  number,
}: {
  value: string;
  onChange: (country: string) => void;
  disabled?: boolean;
  number?: string;
}) {
  const countries = usePhoneCountries();
  const [open, setOpen] = useState(false);
  const selected = countries.data?.countries.find((c) => c.code === value);
  // With a single offered country there is nothing to pick: the button adds or removes the number.
  const only =
    countries.data?.countries.length === 1
      ? countries.data.countries[0]
      : undefined;
  const picker = !disabled && !countries.isError && (
    <button
      type="button"
      disabled={countries.isPending}
      onClick={() =>
        only ? onChange(selected ? "" : only.code) : setOpen(true)
      }
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition disabled:opacity-60 ${
        selected
          ? "bg-card text-foreground hover:bg-background"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
    >
      {countries.isPending
        ? "Loading…"
        : only
          ? selected
            ? "Remove"
            : `Get a ${only.code} number`
          : selected
            ? "Change"
            : "Select country"}
    </button>
  );
  const placeholder = selected ?? only;
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
          className="group flex w-full items-center gap-4 rounded-2xl bg-muted px-4 py-4 text-left transition hover:bg-accent"
        >
          <CountryFlag code={value} size={40} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[19px] font-medium tracking-tight tabular-nums">
              {number}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{selected?.name ?? value}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success-surface px-2 py-0.5 text-success">
                <IconCheck size={11} />
                Active
              </span>
            </span>
          </span>
          <IconCopy
            size={17}
            className="shrink-0 text-muted-foreground transition group-hover:text-foreground"
          />
        </button>
      ) : (
        <div
          className={`flex w-full flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl px-4 py-4 ${selected ? "bg-muted" : "border border-dashed border-border bg-muted/40"}`}
        >
          {selected ? (
            <CountryFlag code={selected.code} size={40} />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <IconWorld size={21} stroke={1.5} />
            </span>
          )}
          <span className="min-w-40 flex-1">
            <span
              className={`block truncate text-[19px] font-medium tracking-tight tabular-nums ${selected ? "text-foreground" : "text-muted-foreground/70"}`}
            >
              {placeholder?.dialCode ? `+${placeholder.dialCode} ` : ""}··· ···
              ····
            </span>
            <span className="mt-1 block truncate text-xs text-muted-foreground">
              {selected
                ? selected.name
                : only
                  ? `${only.name} number`
                  : "Pick where your number lives"}
            </span>
          </span>
          {picker}
        </div>
      )}
      {countries.isError && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          Countries could not load.{" "}
          <button
            type="button"
            onClick={() => void countries.refetch()}
            className="underline"
          >
            Retry
          </button>
        </p>
      )}
      {open && (
        <CountryPickerModal
          value={value}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
export interface AgentVoice {
  id: string;
  name: string;
  gender: string;
  country?: string;
  description?: string;
  tags: string[];
  previewUrl?: string;
}
function useAgentVoices(enabled = true) {
  return useQuery({
    queryKey: ["agent-voices"],
    queryFn: () =>
      request<{ voices: AgentVoice[]; defaultVoiceId?: string }>(
        "/api/workspaces/voice/voices",
      ),
    staleTime: 3600000,
    retry: 1,
    enabled,
  });
}
const regionNames =
  typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : undefined;
const regionName = (code?: string) => {
  try {
    return code ? (regionNames?.of(code) ?? code) : undefined;
  } catch {
    return code;
  }
};
const voiceLabel = (voice: AgentVoice) =>
  [
    voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1),
    regionName(voice.country),
  ]
    .filter(Boolean)
    .join(" · ");
/** One preview at a time across the page; stops when the component unmounts. */
function useVoicePreview() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<{ id: string; loading: boolean } | null>(
    null,
  );
  const stop = () => {
    audio.current?.pause();
    audio.current = null;
    setState(null);
  };
  useEffect(
    () => () => {
      audio.current?.pause();
    },
    [],
  );
  function toggle(voice: AgentVoice) {
    if (state?.id === voice.id) return stop();
    audio.current?.pause();
    if (!voice.previewUrl) return;
    const player = new Audio(voice.previewUrl);
    audio.current = player;
    setState({ id: voice.id, loading: true });
    player.onplaying = () =>
      setState((current) =>
        current?.id === voice.id ? { id: voice.id, loading: false } : current,
      );
    player.onended = () => {
      if (audio.current === player) stop();
    };
    player.onerror = () => {
      if (audio.current === player) {
        stop();
        toast.error("That preview could not play.");
      }
    };
    void player.play().catch(() => {
      if (audio.current === player) stop();
    });
  }
  return { playing: state, toggle, stop };
}
function PreviewButton({
  voice,
  preview,
}: {
  voice: AgentVoice;
  preview: ReturnType<typeof useVoicePreview>;
}) {
  if (!voice.previewUrl) return <span className="size-8 shrink-0" />;
  const active = preview.playing?.id === voice.id;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        preview.toggle(voice);
      }}
      aria-label={
        active ? `Stop ${voice.name} preview` : `Play ${voice.name} preview`
      }
      className={`flex size-8 shrink-0 items-center justify-center rounded-full transition ${active ? "bg-primary text-primary-foreground" : "bg-card text-foreground ring-1 ring-border hover:bg-background"}`}
    >
      {active && preview.playing?.loading ? (
        <IconLoader2 size={14} className="animate-spin" />
      ) : active ? (
        <IconPlayerStopFilled size={13} />
      ) : (
        <IconPlayerPlayFilled size={13} />
      )}
    </button>
  );
}
function VoicePickerModal({
  current,
  onChoose,
  onClose,
}: {
  current?: string;
  onChoose: (voiceId: string) => Promise<void>;
  onClose: () => void;
}) {
  const voices = useAgentVoices();
  const preview = useVoicePreview();
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<"all" | "female" | "male">("all");
  const [saving, setSaving] = useState<string>();
  const search = query.trim().toLowerCase();
  const filtered = voices.data?.voices.filter(
    (v) =>
      (gender === "all" || v.gender === gender) &&
      `${v.name} ${regionName(v.country) ?? ""} ${v.tags.join(" ")}`
        .toLowerCase()
        .includes(search),
  );
  async function choose(voiceId: string) {
    if (saving) return;
    setSaving(voiceId);
    try {
      await onChoose(voiceId);
      preview.stop();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "The voice could not be saved.",
      );
    } finally {
      setSaving(undefined);
    }
  }
  return (
    <Modal
      title="Choose a receptionist voice"
      description="Tap play to hear a sample. Your receptionist uses this voice for every call."
      onClose={() => {
        preview.stop();
        onClose();
      }}
      busy={Boolean(saving)}
    >
      <div className="relative">
        <IconSearch
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or country…"
          className="h-10 rounded-xl bg-muted pl-9 pr-3 text-[13px] shadow-none"
        />
      </div>
      <div
        className="mt-3 flex gap-1.5"
        role="group"
        aria-label="Filter by voice"
      >
        {(["all", "female", "male"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={gender === value}
            onClick={() => setGender(value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${gender === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {value === "all" ? "All" : value === "female" ? "Female" : "Male"}
          </button>
        ))}
      </div>
      <div className="-mx-2 mt-3 max-h-80 overflow-y-auto">
        {voices.isPending ? (
          <p className="flex items-center justify-center gap-2 py-8 text-[13px] text-muted-foreground">
            <IconLoader2 size={14} className="animate-spin" />
            Loading voices…
          </p>
        ) : voices.isError ? (
          <p
            role="alert"
            className="py-8 text-center text-[13px] text-destructive"
          >
            Voices could not load.{" "}
            <button
              type="button"
              onClick={() => void voices.refetch()}
              className="underline"
            >
              Retry
            </button>
          </p>
        ) : filtered?.length ? (
          filtered.map((voice) => {
            const selected =
              (current ?? voices.data?.defaultVoiceId) === voice.id;
            return (
              <div
                key={voice.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${selected ? "bg-accent" : "hover:bg-muted"}`}
              >
                <PreviewButton voice={voice} preview={preview} />
                <button
                  type="button"
                  disabled={Boolean(saving)}
                  onClick={() => void choose(voice.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-60"
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[13px] font-medium ${selected ? "text-primary" : "text-foreground"}`}
                    >
                      {voice.name}
                      {voice.id === voices.data?.defaultVoiceId && (
                        <span className="ml-1.5 font-normal text-muted-foreground">
                          (default)
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {voiceLabel(voice)}
                    </span>
                  </span>
                  {saving === voice.id ? (
                    <IconLoader2
                      size={16}
                      className="shrink-0 animate-spin text-muted-foreground"
                    />
                  ) : selected ? (
                    <IconCheck size={16} className="shrink-0 text-primary" />
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}
                </button>
              </div>
            );
          })
        ) : (
          <p className="py-8 text-center text-[13px] text-muted-foreground">
            No voices match{query ? ` “${query}”` : ""}.
          </p>
        )}
      </div>
    </Modal>
  );
}
function AgentVoiceSetting({
  voice,
  onChanged,
}: {
  voice: BusinessVoice;
  onChanged: () => Promise<unknown>;
}) {
  const { activeWorkspaceId } = useStore();
  const voices = useAgentVoices();
  const preview = useVoicePreview();
  const [open, setOpen] = useState(false);
  const currentId = voice.voiceId ?? voices.data?.defaultVoiceId;
  const current = voices.data?.voices.find((v) => v.id === currentId);
  async function choose(voiceId: string) {
    await request(`/api/workspaces/${activeWorkspaceId}/voice/agent-voice`, {
      method: "PUT",
      body: JSON.stringify({ voiceId }),
    });
    await onChanged();
    toast.success(
      voice.status === "active"
        ? "Voice updated. New calls will use it within a minute."
        : "Voice saved. Your receptionist will use it once your number is ready.",
    );
  }
  return (
    <div className="mt-6 border-t border-border pt-5">
      <h3 className="flex items-center gap-2 text-[14px] font-medium">
        <IconMicrophone size={16} className="text-primary" />
        Receptionist voice
      </h3>
      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-muted px-4 py-3">
        {current ? (
          <PreviewButton voice={current} preview={preview} />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card ring-1 ring-border">
            <IconMicrophone size={14} className="text-muted-foreground" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium">
            {voices.isPending ? "Loading…" : (current?.name ?? "Default voice")}
          </span>
          {current && (
            <span className="block truncate text-xs text-muted-foreground">
              {voiceLabel(current)}
              {!voice.voiceId && " · default"}
            </span>
          )}
          {voices.isError && (
            <span className="block text-xs text-destructive">
              Voices could not load.
            </span>
          )}
        </span>
        <button
          type="button"
          disabled={voices.isPending}
          onClick={() => {
            preview.stop();
            setOpen(true);
          }}
          className="shrink-0 rounded-full bg-card px-3.5 py-1.5 text-[12px] font-medium text-foreground transition hover:bg-background disabled:opacity-60"
        >
          Change
        </button>
      </div>
      {open && (
        <VoicePickerModal
          current={voice.voiceId}
          onChoose={choose}
          onClose={() => setOpen(false)}
        />
      )}
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
    queryFn: () =>
      request<{ voice: BusinessVoice | null }>(
        `/api/workspaces/${activeWorkspaceId}/voice`,
      ),
    enabled: Boolean(activeWorkspaceId),
    refetchInterval: (query) =>
      ["queued", "provisioning"].includes(query.state.data?.voice?.status ?? "")
        ? 4000
        : false,
  });
  const voice = query.data?.voice ?? state.business.voice;
  const pending =
    submitting ||
    voice?.status === "queued" ||
    voice?.status === "provisioning";
  const active = voice?.status === "active";
  // A setup saved for a country that is no longer offered (numbers are US only) falls back to the offered one.
  const offered = usePhoneCountries().data?.countries ?? [];
  const savedCountry =
    voice && offered.some((c) => c.code === voice.country) ? voice.country : "";
  const setupCountry = active
    ? voice.country
    : country || savedCountry || (offered.length === 1 ? offered[0].code : "");
  async function setup(event: React.FormEvent) {
    event.preventDefault();
    if (pending || !activeWorkspaceId) return;
    setSubmitting(true);
    setError("");
    try {
      await request(`/api/workspaces/${activeWorkspaceId}/voice`, {
        method: "POST",
        body: JSON.stringify({ country: setupCountry }),
      });
      await query.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Phone setup failed.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <Card className="mb-6 gap-0 rounded-[21px] bg-card p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-primary">
          <IconPhone size={20} />
        </span>
        <div>
          <h2 className="text-[18px] font-medium">Business phone number</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            A dedicated number for this business’s incoming calls, reminders,
            and payment follow-ups.
          </p>
        </div>
      </div>
      {query.isPending ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Loading phone settings…
        </p>
      ) : query.isError ? (
        <p role="alert" className="mt-4 text-xs text-destructive">
          Phone settings could not load.{" "}
          <button onClick={() => void query.refetch()} className="underline">
            Retry
          </button>
        </p>
      ) : (
        <form onSubmit={setup} className="mt-5 space-y-4">
          <NumberCountrySelect
            value={setupCountry}
            onChange={setCountry}
            number={active ? voice.number : undefined}
            disabled={
              pending ||
              active ||
              voice?.status === "needs_review" ||
              offered.length === 1
            }
          />
          {pending && (
            <p
              role="status"
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <IconLoader2 size={14} className="animate-spin" />
              Setting up your number. You can leave this page and check back.
            </p>
          )}
          {(error || voice?.error) && (
            <p
              role="alert"
              className="rounded-xl bg-danger-surface p-3 text-xs leading-5 text-destructive"
            >
              {error || voice?.error}
            </p>
          )}
          {!active && (
            <Button
              type="submit"
              disabled={pending || query.isError || !setupCountry}
              className="rounded-xl"
            >
              {voice?.status === "needs_review"
                ? "Check setup status"
                : voice?.status === "failed"
                  ? "Retry phone setup"
                  : "Set up business number"}
            </Button>
          )}
          <p className="text-xs leading-5 text-muted-foreground">
            {active
              ? "Share it with customers: callers can ask about your location, hours and prices, and book, reschedule or cancel. Reminders go out from this line too. Tap the number to copy it."
              : "Business numbers are US numbers (+1). Customers outside the US, including Nigeria, can still call it as an international call, and reminders reach them as usual."}
          </p>
        </form>
      )}
      {!query.isPending && !query.isError && voice && (
        <AgentVoiceSetting voice={voice} onChanged={() => query.refetch()} />
      )}
    </Card>
  );
}
