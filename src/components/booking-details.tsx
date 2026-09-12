"use client";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconBell,
  IconCalendarEvent,
  IconCheck,
  IconClock,
  IconPhone,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
  type Booking,
  dateLabel,
  duration,
  NOW,
  time,
  TODAY,
} from "@/lib/model";
import { useStore } from "@/lib/store";
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
  const { state, update } = useStore();
  const [reschedule, setReschedule] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(
    booking.reminder || `${TODAY}T11:00:00`,
  );
  const [notes, setNotes] = useState(booking.notes);
  const customer = state.customers.find((c) => c.id === booking.customerId)!;
  const service = state.services.find((s) => s.id === booking.serviceId)!;
  const staff = state.staff.find((s) => s.id === booking.staffId)!;
  const terminal = ["Cancelled", "Completed"].includes(booking.status);
  function setStatus(status: Booking["status"]) {
    update((s) => ({
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
    toast.success(`Reservation ${status.toLowerCase()}`);
  }
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
            ? "mx-auto block max-w-[940px]"
            : "mx-auto block max-w-[940px]"
        }
      >
        <Card className="relative rounded-[78px] border-0 bg-white px-12 pb-12 pt-[94px] max-[760px]:rounded-[46px] max-[760px]:px-7 max-[760px]:pb-8 max-[760px]:pt-[72px] max-[560px]:rounded-[35px] max-[560px]:px-5">
          <div className="absolute left-1/2 top-6 h-[7px] w-[78px] -translate-x-1/2 rounded-full bg-muted" />
          <div className="flex items-center justify-between gap-4">
            <p className="text-[40px] font-medium leading-none tracking-tight text-muted-foreground max-[760px]:text-[30px]">
              {booking.startTime.startsWith(TODAY)
                ? "Today"
                : dateLabel(booking.startTime).split(",")[0]}
            </p>
            <BookingStatus status={booking.status} />
          </div>
          <h1 className="mb-8 mt-3 text-[clamp(43px,4.8vw,63px)] font-medium leading-[1.02] tracking-tight max-[560px]:text-[30px]">
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
                  onClick={() => setReschedule(true)}
                />
                <ActionCard
                  icon={IconTrash}
                  label="Cancel"
                  danger
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
              {publicView &&
                ["Pending", "Needs confirmation"].includes(booking.status) && (
                  <Button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-border bg-primary px-4 text-[12px] font-semibold text-white transition hover:border-border hover:bg-primary/90"
                    onClick={() => setStatus("Confirmed")}
                  >
                    <IconCheck size={17} />
                    Confirm my attendance
                  </Button>
                )}
              {!publicView && (
                <>
                  <Button
                    variant="secondary"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-border bg-white px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background"
                    onClick={() => setStatus("Completed")}
                  >
                    <IconCheck size={16} />
                    Mark completed
                  </Button>
                  {booking.status !== "Confirmed" && (
                    <Button
                      variant="secondary"
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-border bg-white px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background"
                      onClick={() => setStatus("Confirmed")}
                    >
                      Confirm booking
                    </Button>
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
        </Card>

        {!publicView && (
          <aside className="mt-5 grid grid-cols-2 items-start gap-4 max-[760px]:grid-cols-1">
            {!terminal && (
              <div className="rounded-[24px] bg-card p-6">
                <span className="mb-6 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-muted text-foreground">
                  <IconBell size={22} />
                </span>
                <h3 className="text-[17px] font-semibold text-foreground">
                  A thoughtful reminder.
                </h3>
                <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                  {booking.reminder
                    ? "AI call reminder planned"
                    : "No reminder planned yet"}
                </p>
                {booking.reminder && (
                  <strong className="my-2 block text-[13px] font-semibold text-foreground">
                    {dateLabel(booking.reminder)}, {time(booking.reminder)}
                  </strong>
                )}
                <span className="my-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
                  Receptionist not connected
                </span>
                <p className="mt-2 text-[12px] leading-6 text-muted-foreground">
                  Reminder times are saved in this demo. Calls will be available
                  when your receptionist is connected.
                </p>
                <Button
                  variant="secondary"
                  className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-white px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background"
                  onClick={() => setReminder(true)}
                >
                  Change reminder <IconClock size={16} />
                </Button>
                <button
                  className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground"
                  onClick={() =>
                    toast.info(
                      "Your receptionist isn’t connected yet. Use Contact to call the customer directly.",
                    )
                  }
                >
                  Ask agent to call <IconArrowUpRight size={14} />
                </button>
              </div>
            )}
            <div className="rounded-[24px] bg-card p-6">
              <h3 className="text-[17px] font-semibold text-foreground">
                A note for the visit
              </h3>
              <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                Keep notes on preferences or anything to keep in mind.
              </p>
              <Textarea
                aria-label="Booking notes"
                value={notes}
                rows={3}
                placeholder="Anything to keep in mind…"
                onChange={(e) => setNotes(e.target.value)}
                className="mt-3 w-full resize-y rounded-xl border border-border bg-background p-3 text-[12px] outline-none focus:border-border"
              />
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-white px-3 text-[12px] font-semibold text-foreground transition hover:border-border"
                onClick={() => {
                  update((s) => ({
                    ...s,
                    bookings: s.bookings.map((b) =>
                      b.id === booking.id ? { ...b, notes } : b,
                    ),
                  }));
                  toast.success("Visit note saved");
                }}
              >
                Save note
              </Button>
            </div>
          </aside>
        )}
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
          onClose={() => setCancel(false)}
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
              onClick={() => setCancel(false)}
            >
              Keep reservation
            </Button>
            <Button
              variant="destructive"
              className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#a8514b] bg-[#a8514b] px-4 text-[12px] font-semibold text-white transition hover:bg-[#91453f]"
              onClick={() => {
                setStatus("Cancelled");
                setCancel(false);
              }}
            >
              Cancel reservation
            </Button>
          </div>
        </Modal>
      )}
      {reminder && (
        <Modal
          title="A timely little reminder."
          description="Plan a reminder for this reservation. Calls are not connected yet."
          onClose={() => setReminder(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update((s) => ({
                ...s,
                bookings: s.bookings.map((b) =>
                  b.id === booking.id
                    ? {
                        ...b,
                        reminder: reminderTime,
                        activity: [
                          ...b.activity,
                          {
                            id: crypto.randomUUID(),
                            title: "Reminder planned",
                            detail: `${dateLabel(reminderTime)}, ${time(reminderTime)} · Call pending connection`,
                            time: NOW,
                            actor: "owner",
                          },
                        ],
                      }
                    : b,
                ),
              }));
              setReminder(false);
              toast.success("Reminder time saved; calling is not connected");
            }}
          >
            <label className="mb-4 block text-[12px] font-semibold text-foreground">
              Reminder date & time
              <Input
                required
                type="datetime-local"
                min={NOW.slice(0, 16)}
                max={booking.startTime.slice(0, 16)}
                value={reminderTime.slice(0, 16)}
                onChange={(e) => setReminderTime(`${e.target.value}:00`)}
                className="mt-2 block min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus:ring-2 focus:ring-[#d8d8da]"
              />
            </label>
            <Button
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-primary px-4 text-[12px] font-semibold text-white transition hover:border-border hover:bg-primary/90"
              type="submit"
            >
              Save reminder
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
