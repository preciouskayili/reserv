"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconBell,
  IconCalendarEvent,
  IconCheck,
  IconClock,
  IconCreditCard,
  IconFileInvoice,
  IconLoader2,
  IconNotes,
  IconPhone,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useTriggerCallMutation } from "@/hooks/use-api";
import {
  type Booking,
  DEFAULT_CALL_PREFERENCES,
  dateLabel,
  duration,
  NOW,
  time,
  TODAY,
} from "@/lib/model";
import { paymentSummary } from "@/lib/payments";
import { useWorkspaceSave } from "@/hooks/use-workspace-save";
import {
  ActionCard,
  Avatar,
  BookingActivityList,
  BookingCode,
  BookingStatus,
  LocationCard,
  Modal,
} from "./shared";
import { BookingFlow } from "./booking-flow";

export function BookingDetails({
  booking,
  publicView = false,
}: {
  booking: Booking;
  publicView?: boolean;
}) {
  const { state, update, isSaving, canDismiss } = useWorkspaceSave();
  const [reschedule, setReschedule] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [notes, setNotes] = useState(booking.notes);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const callLock = useRef(false);
  const triggerCallMutation = useTriggerCallMutation();

  const customer = state.customers.find((c) => c.id === booking.customerId)!;
  const service = state.services.find((s) => s.id === booking.serviceId)!;
  const staff = state.staff.find((s) => s.id === booking.staffId)!;
  const calls = { ...DEFAULT_CALL_PREFERENCES, ...state.settings.calls };
  const payment = paymentSummary(state, booking);
  const terminal = ["Cancelled", "Completed"].includes(booking.status);

  async function setStatus(status: Booking["status"]) {
    if (!canDismiss()) return;
    if (status === "Completed") setIsCompleting(true);
    if (status === "Cancelled") setIsCancelling(true);

    const saved = await update((s) => ({
      ...s,
      bookings: s.bookings.map((b) =>
        b.id === booking.id
          ? {
              ...b,
              status,
              activity: [
                ...b.activity,
                {
                  id: crypto.randomUUID(),
                  title: `Reservation ${status.toLowerCase()}`,
                  time: NOW,
                  actor: publicView ? "customer" : "owner",
                },
              ],
            }
          : b,
      ),
    }));
    if (saved) toast.success(`Reservation ${status.toLowerCase()}`);
    setIsCompleting(false);
    setIsCancelling(false);
    if (saved && status === "Cancelled") setCancel(false);
  }

  const handleDispatchCall = async () => {
    if (callLock.current) return;
    callLock.current = true;
    try {
      await triggerCallMutation.mutateAsync({
        toNumber: customer.phone,
        customerName: customer.name,
        serviceName: service.name,
        appointmentTime: time(booking.startTime),
        appointmentDate: dateLabel(booking.startTime),
        bookingId: booking.id,
        callType: "reminder",
      });
    } catch {
      // Toast already handled by mutation hook
    } finally {
      callLock.current = false;
    }
  };
  return (
    <>
      <Link
        className={
          "back-link inline-flex items-center gap-2 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground mb-5"
        }
        href={publicView ? `/b/${state.business.slug}` : "/bookings"}
      >
        <IconArrowLeft size={16} />
        {publicView ? `Back to ${state.business.name}` : "All reservations"}
      </Link>
      <div
        className={
          publicView
            ? "mx-auto block w-full min-w-0 max-w-[940px]"
            : "mx-auto block w-full min-w-0 max-w-[940px]"
        }
      >
        <Card className="relative w-full min-w-0 gap-0 rounded-[40px] border-0 bg-white px-10 pb-10 pt-14 max-[760px]:rounded-[46px] max-[760px]:px-7 max-[760px]:pb-8 max-[760px]:pt-12 max-[560px]:rounded-[35px] max-[560px]:px-5">
          <div className="absolute left-1/2 top-6 h-[7px] w-[78px] -translate-x-1/2 rounded-full bg-muted" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[24px] font-medium leading-none tracking-tight text-muted-foreground max-[760px]:text-[20px]">
              {booking.startTime.startsWith(TODAY)
                ? "Today"
                : dateLabel(booking.startTime).split(",")[0]}
            </p>
            {terminal || payment.confirmed ? (
              <BookingStatus status={booking.status} />
            ) : payment.pending ? (
              <Link
                href={publicView ? `/pay/${booking.code}` : "/payments"}
                className="rounded-full bg-warning-surface px-4 py-2 text-[12px] font-medium text-warning"
              >
                Receipt under review
              </Link>
            ) : (
              <Link
                href={`/pay/${booking.code}`}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-medium text-white hover:bg-primary/90"
              >
                <IconCreditCard size={17} />{" "}
                {publicView ? "Pay to confirm" : "Awaiting payment"}
              </Link>
            )}
          </div>
          <h1 className="mb-8 mt-3 break-words text-[clamp(30px,4vw,44px)] font-medium leading-[1.02] tracking-tight max-[560px]:text-[30px]">
            {publicView ? "Your reservation" : "Reservation with"}
            <br />
            <span className="text-foreground">
              {publicView ? service.name : customer.name}
            </span>
          </h1>
          {!publicView && (
            <p className="mb-8 mt-[-20px] text-[14px] text-muted-foreground">
              {service.name}
            </p>
          )}

          <div
            className={`my-8 grid gap-4 ${
              terminal ? "grid-cols-1" : "grid-cols-3 max-[560px]:gap-2"
            }`}
          >
            <ActionCard
              icon={IconPhone}
              label={publicView ? "Call studio" : "Contact"}
              href={`tel:${(publicView ? state.business.phone : customer.phone).replaceAll(" ", "")}`}
            />
            {!terminal && (
              <>
                <ActionCard
                  icon={IconCalendarEvent}
                  label="Reschedule"
                  disabled={isSaving}
                  onClick={() => setReschedule(true)}
                />
                <ActionCard
                  icon={IconTrash}
                  label="Cancel"
                  danger
                  disabled={isSaving}
                  onClick={() => setCancel(true)}
                />
              </>
            )}
          </div>
          <div className="mt-0 grid grid-cols-2 gap-2">
            <div className="flex min-h-[145px] flex-col items-center justify-center rounded-[22px] bg-background px-6 py-7 text-center max-[760px]:min-h-[120px] max-[560px]:min-h-[110px] max-[560px]:px-2 max-[560px]:py-5">
              <p className="text-[16px] text-muted-foreground max-[760px]:text-[12px]">
                Date & time
              </p>
              <strong className="mt-3 text-[23px] font-medium tracking-tight text-foreground max-[760px]:text-[17px] max-[560px]:text-[13px]">
                {time(booking.startTime)}
              </strong>
              <span className="mt-1 block text-[14px] text-muted-foreground max-[760px]:text-[12px] max-[560px]:text-[12px]">
                {dateLabel(booking.startTime, true)}
              </span>
            </div>
            <div className="flex min-h-[145px] flex-col items-center justify-center rounded-[22px] bg-background px-6 py-7 text-center max-[760px]:min-h-[120px] max-[560px]:min-h-[110px] max-[560px]:px-2 max-[560px]:py-5">
              <p className="text-[16px] text-muted-foreground max-[760px]:text-[12px]">
                Service
              </p>
              <strong className="mt-3 text-[23px] font-medium tracking-tight text-foreground max-[760px]:text-[17px] max-[560px]:text-[13px]">
                {service.name}
              </strong>
              <span className="mt-1 block text-[14px] text-muted-foreground max-[760px]:text-[12px] max-[560px]:text-[12px]">
                {duration(service.duration)} · until {time(booking.endTime)}
              </span>
            </div>
            <div className="flex min-h-[145px] flex-col items-center justify-center rounded-[22px] bg-background px-6 py-7 text-center max-[760px]:min-h-[120px] max-[560px]:min-h-[110px] max-[560px]:px-2 max-[560px]:py-5">
              <p className="text-[16px] text-muted-foreground max-[760px]:text-[12px]">
                {publicView ? "Reserved for" : "Customer"}
              </p>
              <strong className="mt-3 text-[23px] font-medium tracking-tight text-foreground max-[760px]:text-[17px] max-[560px]:text-[13px]">
                {customer.name}
              </strong>
              <span className="mt-1 block text-[14px] text-muted-foreground max-[760px]:text-[12px] max-[560px]:text-[12px]">
                {customer.phone}
              </span>
            </div>
            <div className="flex min-h-[145px] flex-col items-center justify-center rounded-[22px] bg-background px-6 py-7 text-center max-[760px]:min-h-[120px] max-[560px]:min-h-[110px] max-[560px]:px-2 max-[560px]:py-5">
              <p className="text-[16px] text-muted-foreground max-[760px]:text-[12px]">
                Your specialist
              </p>
              <strong className="mt-3 flex items-center justify-center gap-2 text-[23px] font-medium tracking-tight text-foreground max-[760px]:text-[17px] max-[560px]:text-[13px]">
                <Avatar name={staff.name} className="h-6 w-6 text-[12px]" />
                {staff.name}
              </strong>
              <span className="mt-1 block text-[14px] text-muted-foreground max-[760px]:text-[12px] max-[560px]:text-[12px]">
                {staff.role}
              </span>
            </div>
          </div>
          <div className="my-7">
            <h3 className="mb-5 text-[24px] font-medium tracking-tight text-muted-foreground">
              Find your way here
            </h3>
            <LocationCard />
          </div>
          <div className="mt-8">
            <BookingCode code={booking.code} />
          </div>
          {publicView && (
            <p className="mt-3 text-[12px] leading-6 text-muted-foreground">
              Keep this code handy. You can use it to find your reservation or
              mention it when you call the studio.
            </p>
          )}
          {!terminal && (
            <div className="mt-6 flex flex-wrap gap-2">
              {publicView && !payment.confirmed && (
                payment.pending ? (
                  <Link
                    href={`/pay/${booking.code}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-warning-surface px-4 text-[12px] font-semibold text-warning transition hover:opacity-90"
                  >
                    <IconClock size={16} />
                    Receipt under review
                  </Link>
                ) : (
                  <Link
                    href={`/pay/${booking.code}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-primary/90"
                  >
                    <IconCreditCard size={16} />
                    Pay to confirm
                  </Link>
                )
              )}
              {!publicView && (
                <>
                  {booking.status === "Confirmed" && (
                    <Button
                      variant="secondary"
                      disabled={isSaving}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-border bg-white px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background disabled:opacity-60"
                      onClick={() => setStatus("Completed")}
                    >
                      {isCompleting ? (
                        <IconLoader2 size={16} className="animate-spin text-primary" />
                      ) : (
                        <IconCheck size={16} />
                      )}
                      {isCompleting ? "Completing…" : "Mark completed"}
                    </Button>
                  )}
                  {!payment.confirmed && (
                    payment.pending ? (
                      <Link
                        href="/payments"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-border bg-warning-surface px-4 text-[12px] font-semibold text-warning transition hover:opacity-90"
                      >
                        <IconFileInvoice size={15} />
                        Review payment receipt
                      </Link>
                    ) : (
                      <Link
                        href={`/pay/${booking.code}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-border bg-white px-4 text-[12px] font-semibold text-foreground transition hover:bg-muted"
                      >
                        <IconCreditCard size={15} />
                        Record payment to confirm
                      </Link>
                    )
                  )}
                </>
              )}
            </div>
          )}
          {!publicView && (
            <div className="mt-5">
              <Link
                href={`/r/${booking.code}`}
                className="inline-flex items-center gap-2 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground"
              >
                View customer reservation page <IconArrowUpRight size={15} />
              </Link>
            </div>
          )}

          {/* Booking Activity in main card */}
          <div className="mt-8 rounded-[24px] bg-background p-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {publicView ? "YOUR RESERVATION" : "THE STORY SO FAR"}
            </p>
            <h3 className="mt-1 text-[17px] font-semibold text-foreground">
              Booking activity
            </h3>
            <BookingActivityList booking={booking} />
          </div>

          {/* A little heads-up in main card */}
          {(publicView ||
            state.business.bookingPolicy ||
            state.business.cancellationPolicy) && (
            <div className="mt-4 rounded-[24px] bg-background p-6">
              <h3 className="text-[17px] font-semibold text-foreground">
                A little heads-up
              </h3>
              {state.business.bookingPolicy && (
                <div className="mt-3">
                  <h4 className="text-[12px] font-semibold text-foreground">
                    Booking policy
                  </h4>
                  <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                    {state.business.bookingPolicy}
                  </p>
                </div>
              )}
              {state.business.cancellationPolicy && (
                <div className="mt-3">
                  <h4 className="text-[12px] font-semibold text-foreground">
                    Cancellation policy
                  </h4>
                  <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                    {state.business.cancellationPolicy}
                  </p>
                </div>
              )}
            </div>
          )}
          {!publicView && (
            <section className="mt-6 space-y-4">
              {!terminal && (
                <div className="flex items-start gap-3 rounded-2xl bg-muted/70 p-5">
                  <IconBell
                    size={20}
                    stroke={1.6}
                    className="mt-0.5 shrink-0 text-muted-foreground"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[14px] font-medium">
                        Voice AI reminder calls
                      </h3>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                        Aethex AI
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                      {calls.enabled
                        ? `Configured to remind customers ${duration(calls.reminderMinutes)} before their visit. You can also dispatch an immediate call now.`
                        : "Outbound Voice AI reminder calls can be dispatched on demand or scheduled automatically."}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={triggerCallMutation.isPending}
                        onClick={handleDispatchCall}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border-0 bg-white px-3.5 text-[12px] font-semibold text-foreground shadow-none transition hover:bg-black/5 hover:text-primary disabled:opacity-60"
                      >
                        {triggerCallMutation.isPending ? (
                          <>
                            <IconLoader2 size={15} className="animate-spin text-primary" />
                            <span>Dispatching call…</span>
                          </>
                        ) : (
                          <>
                            <IconPhone size={15} className="text-primary" />
                            <span>Dispatch Voice AI call now</span>
                          </>
                        )}
                      </Button>
                      <Link
                        href="/settings#automatic-calls"
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        Call settings <IconArrowUpRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              <div className="rounded-2xl bg-muted/70 p-5">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                  <IconNotes size={19} stroke={1.6} />A note for the visit
                </h3>
                <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                  Keep notes on preferences or anything to keep in mind.
                </p>
                <Textarea
                  aria-label="Booking notes"
                  value={notes}
                  rows={3}
                  disabled={isSaving}
                  placeholder="Anything to keep in mind…"
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-3 w-full resize-y rounded-xl border-0 bg-white p-3 text-[12px] outline-none focus:border-border"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isSaving}
                  className="mt-3 inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-[12px] font-semibold text-foreground transition hover:border-border disabled:opacity-60"
                  onClick={async () => {
                    if (!canDismiss()) return;
                    setIsSavingNote(true);
                    const saved = await update((s) => ({
                      ...s,
                      bookings: s.bookings.map((b) =>
                        b.id === booking.id ? { ...b, notes } : b,
                      ),
                    }));
                    setIsSavingNote(false);
                    if (!saved) return;
                    setNoteSaved(true);
                    toast.success("Visit note saved");
                    setTimeout(() => setNoteSaved(false), 1800);
                  }}
                >
                  {isSavingNote ? (
                    <>
                      <IconLoader2 size={14} className="animate-spin text-primary" />
                      Saving…
                    </>
                  ) : noteSaved ? (
                    <>
                      <IconCheck size={14} className="text-emerald-600" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <IconCheck size={16} /> Save note
                    </>
                  )}
                </Button>
              </div>
            </section>
          )}
        </Card>
      </div>
      {reschedule && (
        <BookingFlow
          booking={booking}
          publicFlow={publicView}
          onClose={() => setReschedule(false)}
        />
      )}
      {cancel && (
        <Modal
          title="Cancel this reservation?"
          description="A little change of plans."
          busy={isSaving}
          onClose={() => { if (canDismiss()) setCancel(false); }}
        >
          <div className="my-5 rounded-xl bg-background p-4 text-[12px]">
            <strong className="font-semibold text-foreground">
              {service.name}
            </strong>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {dateLabel(booking.startTime)} · {time(booking.startTime)}
            </p>
          </div>
          <p className="text-[12px] leading-5 text-muted-foreground">
            {state.business.cancellationPolicy}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <Button
              variant="secondary"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-border bg-white px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background"
              disabled={isSaving}
              onClick={() => { if (canDismiss()) setCancel(false); }}
            >
              Keep reservation
            </Button>
            <Button
              variant="destructive"
              disabled={isSaving}
              className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#a8514b] bg-[#a8514b] px-4 text-[12px] font-semibold text-white transition hover:bg-[#91453f] disabled:opacity-60"
              onClick={() => {
                setStatus("Cancelled");
              }}
            >
              {isCancelling ? (
                <>
                  <IconLoader2 size={15} className="animate-spin" />
                  <span>Cancelling…</span>
                </>
              ) : (
                <>
                  <IconTrash size={15} />
                  <span>Cancel reservation</span>
                </>
              )}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
