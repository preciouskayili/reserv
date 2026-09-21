"use client";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, useRef, type FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendarEvent,
  IconCheck,
  IconChecks,
  IconClock,
  IconCreditCard,
  IconLoader2,
  IconMapPin,
  IconUser,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import {
  addDays,
  availableSlots,
  type Booking,
  dateLabel,
  duration,
  endTime,
  money,
  time,
  TODAY,
} from "@/lib/model";
import { Avatar, BookingCode, EmptyState, Modal, ServiceIcon } from "./shared";

export interface BookingPreset {
  serviceId?: string;
  date?: string;
  startTime?: string;
  staffId?: string;
  customerId?: string;
}
export function BookingFlow({
  onClose,
  preset = {},
  booking,
  publicFlow = false,
}: {
  onClose: () => void;
  preset?: BookingPreset;
  booking?: Booking;
  publicFlow?: boolean;
}) {
  const { state, update, acceptSnapshot } = useStore();
  const [step, setStep] = useState(booking || preset.serviceId ? 1 : 0);
  const [serviceId, setServiceId] = useState(
    booking?.serviceId || preset.serviceId || "",
  );
  const service = state.services.find((s) => s.id === serviceId);
  const [staffId, setStaffId] = useState(
    booking?.staffId || preset.staffId || service?.staffIds[0] || "",
  );
  const [date, setDate] = useState(
    booking?.startTime.slice(0, 10) || preset.date || TODAY,
  );
  const [slot, setSlot] = useState(preset.startTime || "");
  const customer = state.customers.find(
    (c) => c.id === (booking?.customerId || preset.customerId),
  );
  const [name, setName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [notes, setNotes] = useState(booking?.notes || "");
  const [result, setResult] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLock = useRef(false);

  const slots = availableSlots(state, serviceId, staffId, date, booking?.id);
  const [dateOpen, setDateOpen] = useState(false);
  const selectedStaff = state.staff.find((s) => s.id === staffId);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submissionLock.current) return;
    if (!service || !slots.includes(slot)) {
      setError("That time is no longer available. Please choose another time.");
      setStep(1);
      return;
    }
    if (
      name.trim().length < 2 ||
      phone.replace(/\D/g, "").length < 10 ||
      phone.replace(/\D/g, "").length > 15
    ) {
      setError(
        "Please enter your full name and a valid phone number (10–15 digits).",
      );
      return;
    }

    submissionLock.current = true;
    setIsSubmitting(true);
    setError("");

    try {
      if (booking) {
        const saved = await update(current => ({ ...current, bookings: current.bookings.map(b => b.id === booking.id ? { ...b, staffId, startTime: slot, endTime: endTime(slot, service.duration), status: "Rescheduled", activity: [...b.activity, { id: crypto.randomUUID(), title: "Reservation rescheduled", time: new Date().toISOString(), actor: publicFlow ? "customer" : "owner" }] } : b) }));
        if (!saved) { setError("Your reservation wasn’t changed. Check availability and try again."); return; }
        setResult({ ...booking, staffId, startTime: slot, endTime: endTime(slot, service.duration) });
      } else {
        const payload={serviceId,staffId,startTime:slot,name:name.trim(),phone:phone.trim(),notes};
        const response=publicFlow ? await api.public.createBooking(state.business.slug,payload) : await api.bookings.create(payload);
        acceptSnapshot(response.snapshot);
        setResult(response.booking);
      }
      toast.success(booking ? "Reservation rescheduled" : service.price===0 ? "Reservation confirmed" : "Reservation created");
    } catch (error) { setError(error instanceof Error ? error.message : "We couldn’t save your reservation. Please try again."); }
    finally { submissionLock.current=false;setIsSubmitting(false); }

  }
  return (
    <Modal
      busy={isSubmitting}
      wide
      title={
        result
          ? booking
            ? "A new time, just for you."
            : "Your booking is saved."
          : booking
            ? "Let’s find a new time."
            : "Make a little time."
      }
      description={
        result
          ? `${state.business.name} looks forward to seeing you.`
          : booking
            ? "Choose a time that works better for you."
            : `Your next appointment at ${state.business.name}.`
      }
      onClose={() => { if (!submissionLock.current) onClose(); }}
    >
      {result ? (
        <div className="pt-5 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <IconChecks size={30} />
          </span>
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {booking ? "Reservation rescheduled" : "Reservation created"}
          </p>
          <h2 className="my-2 text-[25px] font-medium tracking-tight text-foreground">{service?.name}</h2>
          <div className="my-6 space-y-3 rounded-xl bg-background p-5 text-left text-[12px] text-muted-foreground">
            <p className="flex items-center gap-3">
              <IconCalendarEvent size={18} className="shrink-0 text-muted-foreground" />
              {dateLabel(result.startTime, true)}
            </p>
            <p className="flex items-center gap-3">
              <IconClock size={18} className="shrink-0 text-muted-foreground" />
              {time(result.startTime)} – {time(result.endTime)}
            </p>
            <p className="flex items-center gap-3">
              <IconUser size={18} className="shrink-0 text-muted-foreground" />
              With {selectedStaff?.name}
            </p>
            <p className="flex items-center gap-3">
              <IconMapPin size={18} className="shrink-0 text-muted-foreground" />
              {state.business.address}
            </p>
          </div>
          <BookingCode code={result.code} />
          <p className="my-4 text-[12px] leading-5 text-muted-foreground">
            Keep this code somewhere safe. Use it to view, change, or cancel
            your reservation.
          </p>
          {!!service?.deposit && (
            <p className="mb-4 flex items-start gap-2 rounded-[11px] bg-background p-3 text-[12px] leading-5 text-muted-foreground">
              {money(service.deposit)} deposit is payable directly to the
              studio. No payment has been taken.
            </p>
          )}
          <Link href={`/pay/${result.code}`} onClick={onClose} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-[13px] font-medium text-primary transition hover:bg-muted"><IconCreditCard size={17} /> View payment options</Link>
          <Link
            className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/90"
            href={publicFlow ? `/r/${result.code}` : `/bookings/${result.id}`}
            onClick={onClose}
          >
            View reservation <IconArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <>
          <div className="my-7 flex items-center justify-between gap-2 border-b border-border pb-5">
            {["Service", "Date & time", "Your details"].map((label, i) => {
              const isActive = step === i;
              const isDone = step > i;
              return (
                <button
                  key={label}
                  disabled={isSubmitting || i > step || (!!booking && i === 0)}
                  className={`flex items-center gap-2 text-[12px] transition disabled:cursor-default ${
                    isActive
                      ? "font-semibold text-foreground"
                      : isDone
                        ? "font-medium text-foreground"
                        : "font-medium text-muted-foreground"
                  }`}
                  onClick={() => setStep(i)}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[12px] ${
                      isActive || isDone
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <IconCheck size={13} /> : i + 1}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
          {step === 0 && (
            <div className="max-h-[450px] space-y-2 overflow-y-auto">
              {state.services
                .filter((s) => s.active)
                .map((s) => (
                  <button
                    key={s.id}
                    className="flex w-full items-center gap-3 rounded-[13px] border border-border px-3 py-3 text-left transition hover:border-border hover:bg-background"
                    onClick={() => {
                      const chosenStaff =
                        preset.staffId && s.staffIds.includes(preset.staffId)
                          ? preset.staffId
                          : s.staffIds[0];
                      setServiceId(s.id);
                      setStaffId(chosenStaff);
                      setSlot(
                        preset.startTime &&
                          availableSlots(
                            state,
                            s.id,
                            chosenStaff,
                            date,
                          ).includes(preset.startTime)
                          ? preset.startTime
                          : "",
                      );
                      setStep(1);
                    }}
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-muted text-foreground">
                      <ServiceIcon serviceId={s.id} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[12px] font-semibold text-foreground">{s.name}</strong>
                      <small className="mt-1 block text-[12px] text-muted-foreground">
                        {duration(s.duration)}
                        {s.deposit ? ` · ${money(s.deposit)} deposit` : ""}
                      </small>
                    </span>
                    <b className="text-[12px] font-semibold text-foreground">{money(s.price)}</b>
                    <IconArrowRight size={16} className="text-muted-foreground" />
                  </button>
                ))}
              {!state.services.some((s) => s.active) && (
                <EmptyState
                  title="No services available"
                  description="The studio has no services available to book right now. Please call us."
                />
              )}
            </div>
          )}
          {step === 1 && (
            <div>
              <div className="mb-5 flex items-center gap-3 rounded-xl bg-background px-4 py-3 text-[12px]">
                <ServiceIcon serviceId={serviceId} />
                <strong className="flex-1 font-semibold text-foreground">{service?.name}</strong>
                <span className="text-muted-foreground">
                  {duration(service?.duration || 0)} ·{" "}
                  {money(service?.price || 0)}
                </span>
              </div>
              <label className="mb-2 block text-[12px] font-semibold text-foreground">
                Choose your specialist
              </label>
              <div className="mb-5 grid grid-cols-2 gap-2">
                {state.staff
                  .filter((s) => service?.staffIds.includes(s.id))
                  .map((s) => {
                    const isSelected = staffId === s.id;
                    return (
                      <button
                        key={s.id}
                        className={`flex items-center gap-2 rounded-xl border p-2 text-left text-[12px] transition ${
                          isSelected
                            ? "border-border bg-background"
                            : "border-border bg-card hover:bg-background"
                        }`}
                        onClick={() => {
                          setStaffId(s.id);
                          setSlot("");
                        }}
                      >
                        <Avatar name={s.name} src={s.avatarUrl} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-foreground">{s.name}</span>
                          <small className="block text-[12px] text-muted-foreground">{s.role}</small>
                        </span>
                        {isSelected && <IconCheck size={16} className="text-foreground" />}
                      </button>
                    );
                  })}
              </div>
              <div className="mb-6">
                <p className="mb-2 text-[12px] font-medium text-muted-foreground">Choose a date</p>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger className="flex h-11 w-full items-center justify-between rounded-xl bg-muted px-4 text-[13px]" aria-label="Choose appointment date">
                    {dateLabel(date || TODAY)} <IconCalendarEvent size={18} className="text-primary" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto rounded-2xl p-3" align="start">
                    <Calendar mode="single" selected={new Date(`${date || TODAY}T12:00:00`)} defaultMonth={new Date(`${date || TODAY}T12:00:00`)}
                      disabled={{ before: new Date(`${TODAY}T00:00:00`), after: new Date(`${addDays(TODAY, state.business.rules.maxAdvanceDays)}T23:59:59`) }}
                      onSelect={(selected) => { if (selected) { setDate(`${selected.getFullYear()}-${String(selected.getMonth()+1).padStart(2,"0")}-${String(selected.getDate()).padStart(2,"0")}`); setSlot(""); setDateOpen(false); } }}
                      className="bg-card [--cell-size:2.5rem]" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label className="block text-[12px] font-semibold text-foreground">
                  Available times
                </label>
                <small className="text-[12px] text-muted-foreground">
                  West Africa Time (WAT)
                </small>
              </div>
              <div className="grid max-h-[180px] grid-cols-4 gap-2 overflow-y-auto max-[560px]:grid-cols-3">
                {slots.map((s) => {
                  const isSelected = slot === s;
                  return (
                    <button
                      className={`rounded-lg border py-2 text-[12px] font-semibold transition ${
                        isSelected
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-transparent bg-muted text-foreground hover:bg-accent"
                      }`}
                      key={s}
                      onClick={() => {
                        setSlot(s);
                        setError("");
                      }}
                    >
                      {time(s)}
                    </button>
                  );
                })}
              </div>
              {!slots.length && (
                <p className="mt-3 flex items-start gap-2 rounded-[11px] bg-background p-3 text-[12px] leading-5 text-muted-foreground">
                  No times available for this specialist on this date. Try
                  another day or specialist.
                </p>
              )}
              {error && (
                <p className="mt-3 text-[12px] font-medium text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                {!booking && (
                  <Button
                    variant="secondary"
                    className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-border bg-card px-4 text-[12px] font-semibold text-foreground transition hover:bg-background"
                    onClick={() => setStep(0)}
                  >
                    <IconArrowLeft size={16} />
                    Back
                  </Button>
                )}
                <Button
                  className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                  disabled={!slots.includes(slot)}
                  onClick={() => setStep(2)}
                >
                  Continue <IconArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}
          {step === 2 && (
            <form onSubmit={submit}>
              <div className="mb-5 flex flex-col items-start gap-1 rounded-xl bg-background px-4 py-3 text-[12px]">
                <strong className="font-semibold text-foreground">{service?.name}</strong>
                <span className="text-muted-foreground">
                  {dateLabel(slot)} at {time(slot)} · {selectedStaff?.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
                <label className="mb-4 block text-[12px] font-semibold text-foreground">
                  Full name
                  <Input
                    disabled={isSubmitting}
                    autoComplete="name"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={!!booking}
                    placeholder="Your first and last name"
                    className="mt-2 block min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none read-only:bg-background read-only:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
                <label className="mb-4 block text-[12px] font-semibold text-foreground">
                  Phone number
                  <Input
                    disabled={isSubmitting}
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    readOnly={!!booking}
                    placeholder="+234 800 000 0000"
                    className="mt-2 block min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none read-only:bg-background read-only:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
              </div>
              <label className="mb-4 block text-[12px] font-semibold text-foreground">
                Anything we should know?{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
                <Textarea
                  disabled={isSubmitting}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Your preferences, or a little note for the studio…"
                  rows={3}
                  className="mt-2 block min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <div className="flex justify-between border-y border-dashed border-border py-4 text-[12px]">
                <span className="text-foreground">Total for your service</span>
                <strong className="text-[15px] font-semibold text-foreground">{money(service?.price || 0)}</strong>
              </div>
              {!!service?.deposit && (
                <p className="mt-3 flex items-start gap-2 rounded-[11px] bg-background p-3 text-[12px] leading-5 text-muted-foreground">
                  {money(service.deposit)} deposit payable directly to the
                  studio. No online payment is required here.
                </p>
              )}
              <p className="mt-3 text-[12px] leading-6 text-muted-foreground">
                {state.business.cancellationPolicy}
              </p>
              <label className="mb-4 mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
                <input type="checkbox" required className="accent-[#646464]" />
                I’ve read and agree to the studio’s booking and cancellation
                policies.
              </label>
              {error && (
                <p className="mt-3 text-[12px] font-medium text-destructive" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <Button
                  variant="secondary"
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-border bg-card px-4 text-[12px] font-semibold text-foreground transition hover:bg-background"
                  disabled={isSubmitting}
                  onClick={() => setStep(1)}
                >
                  <IconArrowLeft size={16} />
                  Back
                </Button>
                <Button
                  disabled={isSubmitting}
                  className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                  type="submit"
                >
                  {isSubmitting ? (
                    <>
                      <IconLoader2 size={16} className="animate-spin" />
                      <span>{booking ? "Rescheduling…" : "Confirming…"}</span>
                    </>
                  ) : (
                    <>
                      <span>{booking ? "Confirm new time" : "Confirm reservation"}</span>
                      <IconCheck size={16} />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </Modal>
  );
}
