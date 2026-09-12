"use client";
import { ui } from "./tw";
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
import { useStore } from "@/lib/reserv/store";
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
} from "@/lib/reserv/model";
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
        <div className={"confirmation pt-5 text-center [&_h2]:my-2 [&_h2]:text-[25px] [&_h2]:font-medium [&_h2]:tracking-[-0.05em] [&_>_.muted]:my-4 [&_>_.muted]:text-[11px] [&_>_.muted]:leading-5 [&_>_.button]:mt-5"}>
          <span className={"confirmation-icon mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#eeeeee] text-[#6e6e6e]"}>
            <IconChecks size={30} />
          </span>
          <p className={"eyebrow text-[10px] font-semibold tracking-[0.17em] text-[#a0a0a0] uppercase"}>
            {booking ? "Reservation rescheduled" : "Reservation confirmed"}
          </p>
          <h2>{service?.name}</h2>
          <div className={"confirmation-summary my-6 space-y-3 rounded-xl bg-[#f9f9f9] p-5 text-left [&_p]:flex [&_p]:items-center [&_p]:gap-3 [&_p]:text-[11px] [&_p]:text-[#737373] [&_svg]:shrink-0 [&_svg]:text-[#979797]"}>
            <p>
              <IconCalendarEvent size={18} />
              {dateLabel(result.startTime, true)}
            </p>
            <p>
              <IconClock size={18} />
              {time(result.startTime)} – {time(result.endTime)}
            </p>
            <p>
              <IconUser size={18} />
              With {selectedStaff?.name}
            </p>
            <p>
              <IconMapPin size={18} />
              {state.business.address}
            </p>
          </div>
          <BookingCode code={result.code} />
          <p className={"muted text-[#8e8e8e]"}>
            Keep this code somewhere safe. Use it to view, change, or cancel
            your reservation.
          </p>
          {!!service?.deposit && (
            <p className={"notice flex items-start gap-2 rounded-[11px] bg-[#f6f6f6] p-3 text-[11px] leading-5 text-[#828282]"}>
              {money(service.deposit)} deposit is payable directly to the
              studio. No payment has been taken.
            </p>
          )}
          <Link
            className={"button primary full inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"}
            href={publicFlow ? `/r/${result.code}` : `/bookings/${result.id}`}
            onClick={onClose}
          >
            View reservation <IconArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <>
          <div className={"flow-steps my-7 flex items-center justify-between gap-2 border-b border-[#f0f0f0] pb-5 [&_button]:flex [&_button]:items-center [&_button]:gap-2 [&_button]:text-[10px] [&_button]:font-medium [&_button]:text-[#b2b2b2] [&_button]:disabled:cursor-default [&_button_span]:flex [&_button_span]:h-5 [&_button_span]:w-5 [&_button_span]:items-center [&_button_span]:justify-center [&_button_span]:rounded-full [&_button_span]:bg-[#f0f0f0] [&_button_span]:text-[9px] [&_button.active]:font-semibold [&_button.active]:text-[#4b4b4b] [&_button.active_span]:bg-[#4f4f4f] [&_button.active_span]:text-white [&_button.done_span]:bg-[#4f4f4f] [&_button.done_span]:text-white"}>
            {["Service", "Date & time", "Your details"].map((label, i) => (
              <button
                key={label}
                disabled={i > step || (!!booking && i === 0)}
                className={ui(step === i ? "active" : step > i ? "done" : "")}
                onClick={() => setStep(i)}
              >
                <span>{step > i ? <IconCheck size={13} /> : i + 1}</span>
                {label}
              </button>
            ))}
          </div>
          {step === 0 && (
            <div className={"service-options max-h-[450px] space-y-2 overflow-y-auto"}>
              {state.services
                .filter((s) => s.active)
                .map((s) => (
                  <button
                    key={s.id}
                    className={"service-option flex w-full items-center gap-3 rounded-[13px] border border-[#ececec] px-3 py-3 text-left transition hover:border-[#acacac] hover:bg-[#fafafa] [&_>_span:nth-child(2)]:flex-1 [&_strong]:block [&_small]:block [&_strong]:text-[12px] [&_small]:mt-1 [&_small]:text-[10px] [&_small]:text-[#a3a3a3] [&_b]:text-[11px] [&_>_svg]:text-[#939393]"}
                    onClick={() => {
                      const chosenStaff = preset.staffId && s.staffIds.includes(preset.staffId) ? preset.staffId : s.staffIds[0];
                      setServiceId(s.id);
                      setStaffId(chosenStaff);
                      setSlot(preset.startTime && availableSlots(state, s.id, chosenStaff, date).includes(preset.startTime) ? preset.startTime : "");
                      setStep(1);
                    }}
                  >
                    <span className={"service-symbol inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#ebebed] text-[#555558]"}>
                      <ServiceIcon serviceId={s.id} />
                    </span>
                    <span>
                      <strong>{s.name}</strong>
                      <small>
                        {duration(s.duration)}
                        {s.deposit ? ` · ${money(s.deposit)} deposit` : ""}
                      </small>
                    </span>
                    <b>{money(s.price)}</b>
                    <IconArrowRight size={16} />
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
            <div className={"flow-time"}>
              <div className={"selection-summary mb-5 flex items-center gap-3 rounded-xl bg-[#f6f6f6] px-4 py-3 text-[11px] [&_strong]:flex-1 [&_span]:text-[#8c8c8c] [&.stacked]:flex-col [&.stacked]:items-start [&.stacked]:gap-1"}>
                <ServiceIcon serviceId={serviceId} />
                <strong>{service?.name}</strong>
                <span>
                  {duration(service?.duration || 0)} ·{" "}
                  {money(service?.price || 0)}
                </span>
              </div>
              <label className={"field-label mb-2 block text-[11px] font-semibold text-[#636363]"}>Choose your specialist</label>
              <div className={"staff-options mb-5 grid grid-cols-2 gap-2 [&_button]:flex [&_button]:items-center [&_button]:gap-2 [&_button]:rounded-xl [&_button]:border [&_button]:border-[#ebebeb] [&_button]:p-2 [&_button]:text-left [&_button]:text-[11px] [&_button.selected]:border-[#a2a2a2] [&_button.selected]:bg-[#f8f8f8] [&_button_>_span:nth-child(2)]:flex-1 [&_button_small]:block [&_button_small]:text-[9px] [&_button_small]:text-[#a2a2a2]"}>
                {state.staff
                  .filter((s) => service?.staffIds.includes(s.id))
                  .map((s) => (
                    <button
                      key={s.id}
                      className={ui(staffId === s.id ? "selected" : "")}
                      onClick={() => {
                        setStaffId(s.id);
                        setSlot("");
                      }}
                    >
                      <Avatar name={s.name} />
                      <span>
                        {s.name}
                        <small>{s.role}</small>
                      </span>
                      {staffId === s.id && <IconCheck size={16} />}
                    </button>
                  ))}
              </div>
              <label className={"field mb-4 block text-[11px] font-semibold text-[#636363] [&_input]:mt-2 [&_input]:block [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border-[#e8e8e8] [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-[11px] [&_input]:font-normal [&_input]:text-[#2f2f2f] [&_input]:outline-none [&_input]:transition [&_input]:placeholder:text-[#b5b5b5] [&_input]:focus:border-[#a0a0a0] [&_input]:focus:ring-2 [&_input]:focus:ring-[#a2a2a228] [&_textarea]:mt-2 [&_textarea]:block [&_textarea]:min-h-10 [&_textarea]:w-full [&_textarea]:rounded-[10px] [&_textarea]:border-[#e8e8e8] [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-[11px] [&_textarea]:font-normal [&_textarea]:text-[#2f2f2f] [&_textarea]:outline-none [&_textarea]:transition [&_textarea]:placeholder:text-[#b5b5b5] [&_textarea]:focus:border-[#a0a0a0] [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-[#a2a2a228] [&_select]:mt-2 [&_select]:block [&_select]:min-h-10 [&_select]:w-full [&_select]:rounded-[10px] [&_select]:border-[#e8e8e8] [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-[11px] [&_select]:font-normal [&_select]:text-[#2f2f2f] [&_select]:outline-none [&_select]:transition [&_select]:placeholder:text-[#b5b5b5] [&_select]:focus:border-[#a0a0a0] [&_select]:focus:ring-2 [&_select]:focus:ring-[#a2a2a228] [&_textarea]:resize-y [&_input[readonly]]:bg-[#f8f8f8] [&_input[readonly]]:text-[#8b8b8b] [&_input]:border-0 [&_input]:bg-[#f1f1f4] [&_input]:shadow-none [&_textarea]:border-0 [&_textarea]:bg-[#f1f1f4] [&_textarea]:shadow-none [&_select]:border-0 [&_select]:bg-[#f1f1f4] [&_select]:shadow-none [&_input:focus]:border-0 [&_input:focus]:ring-2 [&_input:focus]:ring-[#d8d8da] [&_textarea:focus]:border-0 [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[#d8d8da] [&_select:focus]:border-0 [&_select:focus]:ring-2 [&_select:focus]:ring-[#d8d8da]"}>
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
                />
              </label>
              <div className={"date-strip mb-6 grid grid-cols-7 gap-1.5 [&_button]:flex [&_button]:h-12 [&_button]:flex-col [&_button]:items-center [&_button]:justify-center [&_button]:rounded-lg [&_button]:border [&_button]:border-[#ebebeb] [&_button]:text-[#838383] [&_button.selected]:border-[#858585] [&_button.selected]:bg-[#efefef] [&_button.selected]:text-[#494949] [&_small]:text-[8px] [&_strong]:text-[13px] max-[560px]:gap-0.5"}>
                {Array.from({ length: 7 }, (_, i) =>
                  addDays(date || TODAY, i),
                ).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDate(d);
                      setSlot("");
                    }}
                    className={ui(d === date ? "selected" : "")}
                  >
                    <small>
                      {new Date(`${d}T12:00:00`).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </small>
                    <strong>{Number(d.slice(8))}</strong>
                  </button>
                ))}
              </div>
              <div className={"row-between flex items-center justify-between gap-4"}>
                <label className={"field-label mb-2 block text-[11px] font-semibold text-[#636363]"}>Available times</label>
                <small className={"muted text-[#8e8e8e]"}>West Africa Time (WAT)</small>
              </div>
              <div className={"time-slots grid max-h-[180px] grid-cols-4 gap-2 overflow-y-auto [&_button]:rounded-lg [&_button]:border [&_button]:border-[#e8e8e8] [&_button]:py-2 [&_button]:text-[10px] [&_button]:font-semibold [&_button]:text-[#6f6f6f] [&_button]:hover:bg-[#f4f4f4] [&_button.selected]:border-[#4f4f4f] [&_button.selected]:bg-[#4f4f4f] [&_button.selected]:text-white max-[560px]:grid-cols-3"}>
                {slots.map((s) => (
                  <button
                    className={ui(slot === s ? "selected" : "")}
                    key={s}
                    onClick={() => {
                      setSlot(s);
                      setError("");
                    }}
                  >
                    {time(s)}
                  </button>
                ))}
              </div>
              {!slots.length && (
                <p className={"notice flex items-start gap-2 rounded-[11px] bg-[#f6f6f6] p-3 text-[11px] leading-5 text-[#828282]"}>
                  No times available for this specialist on this date. Try
                  another day or specialist.
                </p>
              )}
              {error && (
                <p className={"form-error mt-3 text-[11px] font-medium text-[#af625b]"} role="alert">
                  {error}
                </p>
              )}
              <div className={"flow-footer mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#efefef] pt-5 [&_.button:last-child]:ml-auto"}>
                {!booking && (
                  <Button variant="secondary" className={"button ghost inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"} onClick={() => setStep(0)}>
                    <IconArrowLeft size={16} />
                    Back
                  </Button>
                )}
                <Button
                  className={"button primary inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"}
                  disabled={!slots.includes(slot)}
                  onClick={() => setStep(2)}
                >
                  Continue <IconArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}
          {step === 2 && (
            <form className={"booking-form [&_.fine-print]:mt-3"} onSubmit={submit}>
              <div className={"selection-summary stacked mb-5 flex items-center gap-3 rounded-xl bg-[#f6f6f6] px-4 py-3 text-[11px] [&_strong]:flex-1 [&_span]:text-[#8c8c8c] [&.stacked]:flex-col [&.stacked]:items-start [&.stacked]:gap-1"}>
                <strong>{service?.name}</strong>
                <span>
                  {dateLabel(slot)} at {time(slot)} · {selectedStaff?.name}
                </span>
              </div>
              <div className={"form-grid grid grid-cols-2 gap-3 [&.three]:grid-cols-3 max-[560px]:grid-cols-1 max-[560px]:[&.three]:grid-cols-1"}>
                <label className={"field mb-4 block text-[11px] font-semibold text-[#636363] [&_input]:mt-2 [&_input]:block [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border-[#e8e8e8] [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-[11px] [&_input]:font-normal [&_input]:text-[#2f2f2f] [&_input]:outline-none [&_input]:transition [&_input]:placeholder:text-[#b5b5b5] [&_input]:focus:border-[#a0a0a0] [&_input]:focus:ring-2 [&_input]:focus:ring-[#a2a2a228] [&_textarea]:mt-2 [&_textarea]:block [&_textarea]:min-h-10 [&_textarea]:w-full [&_textarea]:rounded-[10px] [&_textarea]:border-[#e8e8e8] [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-[11px] [&_textarea]:font-normal [&_textarea]:text-[#2f2f2f] [&_textarea]:outline-none [&_textarea]:transition [&_textarea]:placeholder:text-[#b5b5b5] [&_textarea]:focus:border-[#a0a0a0] [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-[#a2a2a228] [&_select]:mt-2 [&_select]:block [&_select]:min-h-10 [&_select]:w-full [&_select]:rounded-[10px] [&_select]:border-[#e8e8e8] [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-[11px] [&_select]:font-normal [&_select]:text-[#2f2f2f] [&_select]:outline-none [&_select]:transition [&_select]:placeholder:text-[#b5b5b5] [&_select]:focus:border-[#a0a0a0] [&_select]:focus:ring-2 [&_select]:focus:ring-[#a2a2a228] [&_textarea]:resize-y [&_input[readonly]]:bg-[#f8f8f8] [&_input[readonly]]:text-[#8b8b8b] [&_input]:border-0 [&_input]:bg-[#f1f1f4] [&_input]:shadow-none [&_textarea]:border-0 [&_textarea]:bg-[#f1f1f4] [&_textarea]:shadow-none [&_select]:border-0 [&_select]:bg-[#f1f1f4] [&_select]:shadow-none [&_input:focus]:border-0 [&_input:focus]:ring-2 [&_input:focus]:ring-[#d8d8da] [&_textarea:focus]:border-0 [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[#d8d8da] [&_select:focus]:border-0 [&_select:focus]:ring-2 [&_select:focus]:ring-[#d8d8da]"}>
                  Full name
                  <Input
                    autoComplete="name"
                    required
                    minLength={2}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={!!booking}
                    placeholder="Your first and last name"
                  />
                </label>
                <label className={"field mb-4 block text-[11px] font-semibold text-[#636363] [&_input]:mt-2 [&_input]:block [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border-[#e8e8e8] [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-[11px] [&_input]:font-normal [&_input]:text-[#2f2f2f] [&_input]:outline-none [&_input]:transition [&_input]:placeholder:text-[#b5b5b5] [&_input]:focus:border-[#a0a0a0] [&_input]:focus:ring-2 [&_input]:focus:ring-[#a2a2a228] [&_textarea]:mt-2 [&_textarea]:block [&_textarea]:min-h-10 [&_textarea]:w-full [&_textarea]:rounded-[10px] [&_textarea]:border-[#e8e8e8] [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-[11px] [&_textarea]:font-normal [&_textarea]:text-[#2f2f2f] [&_textarea]:outline-none [&_textarea]:transition [&_textarea]:placeholder:text-[#b5b5b5] [&_textarea]:focus:border-[#a0a0a0] [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-[#a2a2a228] [&_select]:mt-2 [&_select]:block [&_select]:min-h-10 [&_select]:w-full [&_select]:rounded-[10px] [&_select]:border-[#e8e8e8] [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-[11px] [&_select]:font-normal [&_select]:text-[#2f2f2f] [&_select]:outline-none [&_select]:transition [&_select]:placeholder:text-[#b5b5b5] [&_select]:focus:border-[#a0a0a0] [&_select]:focus:ring-2 [&_select]:focus:ring-[#a2a2a228] [&_textarea]:resize-y [&_input[readonly]]:bg-[#f8f8f8] [&_input[readonly]]:text-[#8b8b8b] [&_input]:border-0 [&_input]:bg-[#f1f1f4] [&_input]:shadow-none [&_textarea]:border-0 [&_textarea]:bg-[#f1f1f4] [&_textarea]:shadow-none [&_select]:border-0 [&_select]:bg-[#f1f1f4] [&_select]:shadow-none [&_input:focus]:border-0 [&_input:focus]:ring-2 [&_input:focus]:ring-[#d8d8da] [&_textarea:focus]:border-0 [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[#d8d8da] [&_select:focus]:border-0 [&_select:focus]:ring-2 [&_select:focus]:ring-[#d8d8da]"}>
                  Phone number
                  <Input
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    readOnly={!!booking}
                    placeholder="+234 800 000 0000"
                  />
                </label>
              </div>
              <label className={"field mb-4 block text-[11px] font-semibold text-[#636363] [&_input]:mt-2 [&_input]:block [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border-[#e8e8e8] [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-[11px] [&_input]:font-normal [&_input]:text-[#2f2f2f] [&_input]:outline-none [&_input]:transition [&_input]:placeholder:text-[#b5b5b5] [&_input]:focus:border-[#a0a0a0] [&_input]:focus:ring-2 [&_input]:focus:ring-[#a2a2a228] [&_textarea]:mt-2 [&_textarea]:block [&_textarea]:min-h-10 [&_textarea]:w-full [&_textarea]:rounded-[10px] [&_textarea]:border-[#e8e8e8] [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-[11px] [&_textarea]:font-normal [&_textarea]:text-[#2f2f2f] [&_textarea]:outline-none [&_textarea]:transition [&_textarea]:placeholder:text-[#b5b5b5] [&_textarea]:focus:border-[#a0a0a0] [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-[#a2a2a228] [&_select]:mt-2 [&_select]:block [&_select]:min-h-10 [&_select]:w-full [&_select]:rounded-[10px] [&_select]:border-[#e8e8e8] [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-[11px] [&_select]:font-normal [&_select]:text-[#2f2f2f] [&_select]:outline-none [&_select]:transition [&_select]:placeholder:text-[#b5b5b5] [&_select]:focus:border-[#a0a0a0] [&_select]:focus:ring-2 [&_select]:focus:ring-[#a2a2a228] [&_textarea]:resize-y [&_input[readonly]]:bg-[#f8f8f8] [&_input[readonly]]:text-[#8b8b8b] [&_input]:border-0 [&_input]:bg-[#f1f1f4] [&_input]:shadow-none [&_textarea]:border-0 [&_textarea]:bg-[#f1f1f4] [&_textarea]:shadow-none [&_select]:border-0 [&_select]:bg-[#f1f1f4] [&_select]:shadow-none [&_input:focus]:border-0 [&_input:focus]:ring-2 [&_input:focus]:ring-[#d8d8da] [&_textarea:focus]:border-0 [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[#d8d8da] [&_select:focus]:border-0 [&_select:focus]:ring-2 [&_select:focus]:ring-[#d8d8da]"}>
                Anything we should know?{" "}
                <span className={"muted text-[#8e8e8e]"}>(optional)</span>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Your preferences, or a little note for the studio…"
                  rows={3}
                />
              </label>
              <div className={"booking-total flex justify-between border-y border-dashed border-[#e7e7e7] py-4 text-[11px] [&_strong]:text-[15px]"}>
                <span>Total for your service</span>
                <strong>{money(service?.price || 0)}</strong>
              </div>
              {!!service?.deposit && (
                <p className={"notice flex items-start gap-2 rounded-[11px] bg-[#f6f6f6] p-3 text-[11px] leading-5 text-[#828282]"}>
                  {money(service.deposit)} deposit payable directly to the
                  studio. No online payment is required here.
                </p>
              )}
              <p className={"fine-print text-[11px] leading-6 text-[#9d9d9d]"}>{state.business.cancellationPolicy}</p>
              <label className={"check-field mb-4 flex items-center gap-2 text-[11px] text-[#727272] [&_input]:accent-[#646464]"}>
                <input type="checkbox" required />
                I’ve read and agree to the studio’s booking and cancellation
                policies.
              </label>
              {error && (
                <p className={"form-error mt-3 text-[11px] font-medium text-[#af625b]"} role="alert">
                  {error}
                </p>
              )}
              <div className={"flow-footer mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#efefef] pt-5 [&_.button:last-child]:ml-auto"}>
                <Button variant="secondary"
                  type="button"
                  className={"button ghost inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"}
                  onClick={() => setStep(1)}
                >
                  <IconArrowLeft size={16} />
                  Back
                </Button>
                <Button className={"button primary inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"} type="submit">
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
