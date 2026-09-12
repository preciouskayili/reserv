"use client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendarEvent,
  IconCheck,
  IconChecks,
  IconClock,
  IconMapPin,
  IconUser,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  addDays,
  availableSlots,
  type Booking,
  dateLabel,
  duration,
  endTime,
  generateCode,
  money,
  NOW,
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
  const { state, update } = useStore();
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
  const slots = availableSlots(state, serviceId, staffId, date, booking?.id);
  const selectedStaff = state.staff.find((s) => s.id === staffId);
  function submit(event: FormEvent) {
    event.preventDefault();
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
    const existingCustomer =
      customer ||
      state.customers.find(
        (c) => c.phone.replace(/\D/g, "") === phone.replace(/\D/g, ""),
      );
    const customerId = existingCustomer?.id || crypto.randomUUID();
    const next: Booking = booking
      ? {
          ...booking,
          startTime: slot,
          endTime: endTime(slot, service.duration),
          staffId,
          status: "Rescheduled",
          notes,
          activity: [
            ...booking.activity,
            {
              id: crypto.randomUUID(),
              title: "Reservation rescheduled",
              detail: `${dateLabel(booking.startTime)}, ${time(booking.startTime)} → ${dateLabel(slot)}, ${time(slot)}`,
              time: NOW,
              actor: publicFlow ? "customer" : "owner",
            },
          ],
        }
      : {
          id: crypto.randomUUID(),
          code: generateCode(state.bookings),
          businessId: state.business.id,
          customerId,
          serviceId,
          staffId,
          startTime: slot,
          endTime: endTime(slot, service.duration),
          status: "Confirmed",
          notes,
          createdAt: NOW,
          activity: [
            {
              id: crypto.randomUUID(),
              title: "Reservation created and confirmed",
              time: NOW,
              actor: publicFlow ? "customer" : "owner",
            },
          ],
        };
    update((s) => ({
      ...s,
      customers: existingCustomer
        ? s.customers
        : [
            ...s.customers,
            {
              id: customerId,
              name: name.trim(),
              phone: phone.trim(),
              notes: "",
            },
          ],
      bookings: booking
        ? s.bookings.map((b) => (b.id === booking.id ? next : b))
        : [...s.bookings, next],
    }));
    setResult(next);
    toast.success(booking ? "Reservation rescheduled" : "You’re all booked in");
  }
  return (
    <Modal
      wide
      title={
        result
          ? booking
            ? "A new time, just for you."
            : "You’re all booked in."
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
      onClose={onClose}
    >
      {result ? (
        <div className="pt-5 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#eeeeee] text-[#6e6e6e]">
            <IconChecks size={30} />
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a0a0a0]">
            {booking ? "Reservation rescheduled" : "Reservation confirmed"}
          </p>
          <h2 className="my-2 text-[25px] font-medium tracking-[-0.05em] text-[#1e1e20]">{service?.name}</h2>
          <div className="my-6 space-y-3 rounded-xl bg-[#f9f9f9] p-5 text-left text-[11px] text-[#737373]">
            <p className="flex items-center gap-3">
              <IconCalendarEvent size={18} className="shrink-0 text-[#979797]" />
              {dateLabel(result.startTime, true)}
            </p>
            <p className="flex items-center gap-3">
              <IconClock size={18} className="shrink-0 text-[#979797]" />
              {time(result.startTime)} – {time(result.endTime)}
            </p>
            <p className="flex items-center gap-3">
              <IconUser size={18} className="shrink-0 text-[#979797]" />
              With {selectedStaff?.name}
            </p>
            <p className="flex items-center gap-3">
              <IconMapPin size={18} className="shrink-0 text-[#979797]" />
              {state.business.address}
            </p>
          </div>
          <BookingCode code={result.code} />
          <p className="my-4 text-[11px] leading-5 text-[#8e8e8e]">
            Keep this code somewhere safe. Use it to view, change, or cancel
            your reservation.
          </p>
          {!!service?.deposit && (
            <p className="mb-4 flex items-start gap-2 rounded-[11px] bg-[#f6f6f6] p-3 text-[11px] leading-5 text-[#828282]">
              {money(service.deposit)} deposit is payable directly to the
              studio. No payment has been taken.
            </p>
          )}
          <Link
            className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#1e1e20] px-4 text-[11px] font-semibold text-white transition hover:bg-[#38383c]"
            href={publicFlow ? `/r/${result.code}` : `/bookings/${result.id}`}
            onClick={onClose}
          >
            View reservation <IconArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <>
          <div className="my-7 flex items-center justify-between gap-2 border-b border-[#f0f0f0] pb-5">
            {["Service", "Date & time", "Your details"].map((label, i) => {
              const isActive = step === i;
              const isDone = step > i;
              return (
                <button
                  key={label}
                  disabled={i > step || (!!booking && i === 0)}
                  className={`flex items-center gap-2 text-[10px] transition disabled:cursor-default ${
                    isActive
                      ? "font-semibold text-[#4b4b4b]"
                      : isDone
                        ? "font-medium text-[#4b4b4b]"
                        : "font-medium text-[#b2b2b2]"
                  }`}
                  onClick={() => setStep(i)}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] ${
                      isActive || isDone
                        ? "bg-[#4f4f4f] text-white"
                        : "bg-[#f0f0f0] text-[#707070]"
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
                    className="flex w-full items-center gap-3 rounded-[13px] border border-[#ececec] px-3 py-3 text-left transition hover:border-[#acacac] hover:bg-[#fafafa]"
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
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#ebebed] text-[#555558]">
                      <ServiceIcon serviceId={s.id} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[12px] font-semibold text-[#28282a]">{s.name}</strong>
                      <small className="mt-1 block text-[10px] text-[#a3a3a3]">
                        {duration(s.duration)}
                        {s.deposit ? ` · ${money(s.deposit)} deposit` : ""}
                      </small>
                    </span>
                    <b className="text-[11px] font-semibold text-[#323235]">{money(s.price)}</b>
                    <IconArrowRight size={16} className="text-[#939393]" />
                  </button>
                ))}
              {!state.services.some((s) => s.active) && (
                <EmptyState
                  title="A little pause"
                  description="The studio has no services available to book right now. Please call us."
                />
              )}
            </div>
          )}
          {step === 1 && (
            <div>
              <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#f6f6f6] px-4 py-3 text-[11px]">
                <ServiceIcon serviceId={serviceId} />
                <strong className="flex-1 font-semibold text-[#2f2f2f]">{service?.name}</strong>
                <span className="text-[#8c8c8c]">
                  {duration(service?.duration || 0)} ·{" "}
                  {money(service?.price || 0)}
                </span>
              </div>
              <label className="mb-2 block text-[11px] font-semibold text-[#636363]">
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
                        className={`flex items-center gap-2 rounded-xl border p-2 text-left text-[11px] transition ${
                          isSelected
                            ? "border-[#a2a2a2] bg-[#f8f8f8]"
                            : "border-[#ebebeb] bg-white hover:bg-[#fafafa]"
                        }`}
                        onClick={() => {
                          setStaffId(s.id);
                          setSlot("");
                        }}
                      >
                        <Avatar name={s.name} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-[#2f2f2f]">{s.name}</span>
                          <small className="block text-[9px] text-[#a2a2a2]">{s.role}</small>
                        </span>
                        {isSelected && <IconCheck size={16} className="text-[#555558]" />}
                      </button>
                    );
                  })}
              </div>
              <label className="mb-4 block text-[11px] font-semibold text-[#636363]">
                Choose a date
                <Input
                  type="date"
                  min={TODAY}
                  max={addDays(TODAY, state.business.rules.maxAdvanceDays)}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSlot("");
                  }}
                  className="mt-2 block min-h-10 w-full rounded-[10px] border-0 bg-[#f1f1f4] px-3 py-2.5 text-[11px] text-[#2f2f2f] shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                />
              </label>
              <div className="mb-6 grid grid-cols-7 gap-1.5 max-[560px]:gap-0.5">
                {Array.from({ length: 7 }, (_, i) =>
                  addDays(date || TODAY, i),
                ).map((d) => {
                  const isSelected = d === date;
                  return (
                    <button
                      key={d}
                      onClick={() => {
                        setDate(d);
                        setSlot("");
                      }}
                      className={`flex h-12 flex-col items-center justify-center rounded-lg border text-[#838383] transition ${
                        isSelected
                          ? "border-[#858585] bg-[#efefef] text-[#494949]"
                          : "border-[#ebebeb] bg-white hover:bg-[#fafafa]"
                      }`}
                    >
                      <small className="text-[8px]">
                        {new Date(`${d}T12:00:00`).toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </small>
                      <strong className="text-[13px] font-semibold">{Number(d.slice(8))}</strong>
                    </button>
                  );
                })}
              </div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label className="block text-[11px] font-semibold text-[#636363]">
                  Available times
                </label>
                <small className="text-[10px] text-[#8e8e8e]">
                  West Africa Time (WAT)
                </small>
              </div>
              <div className="grid max-h-[180px] grid-cols-4 gap-2 overflow-y-auto max-[560px]:grid-cols-3">
                {slots.map((s) => {
                  const isSelected = slot === s;
                  return (
                    <button
                      className={`rounded-lg border py-2 text-[10px] font-semibold transition ${
                        isSelected
                          ? "border-[#4f4f4f] bg-[#4f4f4f] text-white"
                          : "border-[#e8e8e8] bg-white text-[#6f6f6f] hover:bg-[#f4f4f4]"
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
                <p className="mt-3 flex items-start gap-2 rounded-[11px] bg-[#f6f6f6] p-3 text-[11px] leading-5 text-[#828282]">
                  No times available for this specialist on this date. Try
                  another day or specialist.
                </p>
              )}
              {error && (
                <p className="mt-3 text-[11px] font-medium text-[#af625b]" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#efefef] pt-5">
                {!booking && (
                  <Button
                    variant="secondary"
                    className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[#e5e5e7] bg-white px-4 text-[11px] font-semibold text-[#303033] transition hover:bg-[#f7f7f8]"
                    onClick={() => setStep(0)}
                  >
                    <IconArrowLeft size={16} />
                    Back
                  </Button>
                )}
                <Button
                  className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#1e1e20] px-4 text-[11px] font-semibold text-white transition hover:bg-[#38383c] disabled:opacity-50"
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
              <div className="mb-5 flex flex-col items-start gap-1 rounded-xl bg-[#f6f6f6] px-4 py-3 text-[11px]">
                <strong className="font-semibold text-[#2f2f2f]">{service?.name}</strong>
                <span className="text-[#8c8c8c]">
                  {dateLabel(slot)} at {time(slot)} · {selectedStaff?.name}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
                <label className="mb-4 block text-[11px] font-semibold text-[#636363]">
                  Full name
                  <Input
                    autoComplete="name"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={!!booking}
                    placeholder="Your first and last name"
                    className="mt-2 block min-h-10 w-full rounded-[10px] border-0 bg-[#f1f1f4] px-3 py-2.5 text-[11px] text-[#2f2f2f] placeholder:text-[#b5b5b5] shadow-none outline-none read-only:bg-[#f8f8f8] read-only:text-[#8b8b8b] focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                  />
                </label>
                <label className="mb-4 block text-[11px] font-semibold text-[#636363]">
                  Phone number
                  <Input
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    readOnly={!!booking}
                    placeholder="+234 800 000 0000"
                    className="mt-2 block min-h-10 w-full rounded-[10px] border-0 bg-[#f1f1f4] px-3 py-2.5 text-[11px] text-[#2f2f2f] placeholder:text-[#b5b5b5] shadow-none outline-none read-only:bg-[#f8f8f8] read-only:text-[#8b8b8b] focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                  />
                </label>
              </div>
              <label className="mb-4 block text-[11px] font-semibold text-[#636363]">
                Anything we should know?{" "}
                <span className="font-normal text-[#8e8e8e]">(optional)</span>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Your preferences, or a little note for the studio…"
                  rows={3}
                  className="mt-2 block min-h-16 w-full resize-y rounded-[10px] border-0 bg-[#f1f1f4] px-3 py-2.5 text-[11px] text-[#2f2f2f] placeholder:text-[#b5b5b5] shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                />
              </label>
              <div className="flex justify-between border-y border-dashed border-[#e7e7e7] py-4 text-[11px]">
                <span className="text-[#636363]">Total for your service</span>
                <strong className="text-[15px] font-semibold text-[#202022]">{money(service?.price || 0)}</strong>
              </div>
              {!!service?.deposit && (
                <p className="mt-3 flex items-start gap-2 rounded-[11px] bg-[#f6f6f6] p-3 text-[11px] leading-5 text-[#828282]">
                  {money(service.deposit)} deposit payable directly to the
                  studio. No online payment is required here.
                </p>
              )}
              <p className="mt-3 text-[11px] leading-6 text-[#9d9d9d]">
                {state.business.cancellationPolicy}
              </p>
              <label className="mb-4 mt-2 flex items-center gap-2 text-[11px] text-[#727272]">
                <input type="checkbox" required className="accent-[#646464]" />
                I’ve read and agree to the studio’s booking and cancellation
                policies.
              </label>
              {error && (
                <p className="mt-3 text-[11px] font-medium text-[#af625b]" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#efefef] pt-5">
                <Button
                  variant="secondary"
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[#e5e5e7] bg-white px-4 text-[11px] font-semibold text-[#303033] transition hover:bg-[#f7f7f8]"
                  onClick={() => setStep(1)}
                >
                  <IconArrowLeft size={16} />
                  Back
                </Button>
                <Button
                  className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#1e1e20] px-4 text-[11px] font-semibold text-white transition hover:bg-[#38383c]"
                  type="submit"
                >
                  {booking ? "Confirm new time" : "Confirm reservation"}
                  <IconCheck size={16} />
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </Modal>
  );
}
