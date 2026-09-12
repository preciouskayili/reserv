"use client";
import { ui } from "./tw";
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
} from "@/lib/reserv/model";
import { useStore } from "@/lib/reserv/store";
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
        className={"back-link inline-flex items-center gap-2 text-[11px] font-semibold text-[#6f6f6f] transition hover:text-[#292929] mb-5"}
        href={publicView ? `/b/${state.business.slug}` : "/bookings"}
      >
        <IconArrowLeft size={16} />
        {publicView ? `Back to ${state.business.name}` : "All reservations"}
      </Link>
      <div className={ui(`details-layout ${publicView ? "public-details" : ""}`)}>
        <Card className={"details-card !border-0 !bg-white !pt-[94px] !pb-12 max-[760px]:!pt-[72px] max-[760px]:!pb-8 border-[#ececec] p-8 [&_h1]:my-4 [&_>_.text-link]:mt-5 max-[560px]:p-5 relative rounded-[78px] bg-white px-[48px] pb-12 pt-[94px] [&::before]:absolute [&::before]:left-1/2 [&::before]:top-6 [&::before]:h-[7px] [&::before]:w-[78px] [&::before]:-translate-x-1/2 [&::before]:rounded-full [&::before]:bg-[#dadadc] [&::before]:content-[''] [&_h1]:mb-8 [&_h1]:mt-3 [&_h1]:text-[clamp(43px,4.8vw,63px)] [&_h1]:leading-[1.02] [&_h1]:font-medium [&_h1]:tracking-[-0.07em] [&_h1_span]:text-[#2d2d30] [&_>_.booking-code]:mt-8 max-[760px]:rounded-[46px] max-[760px]:px-7 max-[760px]:pb-8 max-[760px]:pt-[72px] max-[560px]:rounded-[35px] max-[560px]:px-5 max-[560px]:[&_h1]:text-[39px] border-0 shadow-[0_28px_70px_-50px_#00000033]"}>
          <div className={"row-between flex items-center justify-between gap-4"}>
            <p className={"detail-day text-[40px] font-medium leading-none tracking-[-0.065em] text-[#a6a6a8] max-[760px]:text-[30px]"}>
              {booking.startTime.startsWith(TODAY)
                ? "Today"
                : dateLabel(booking.startTime).split(",")[0]}
            </p>
            <BookingStatus status={booking.status} />
          </div>
          <h1>
            {publicView ? "Your reservation" : "Reservation with"}
            <br />
            <span>{publicView ? service.name : customer.name}</span>
          </h1>
          {!publicView && <p className={"detail-service mt-[-20px] mb-8 text-[14px] text-[#8f8f92]"}>{service.name}</p>}
          <div className={ui(`detail-actions ${terminal ? "single" : ""}`)}>
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
          <Card className={"detail-facts !grid !grid-cols-2 !gap-2 !rounded-[28px] !border-0 !bg-transparent !p-0 !py-0 grid grid-cols-2 [&_>_div]:rounded-[22px] [&_>_div]:bg-[#f7f7f8] [&_strong]:mt-3 [&_strong]:flex [&_strong]:items-center [&_strong]:gap-2 [&_strong]:tracking-[-0.035em] [&_.avatar]:h-6 [&_.avatar]:w-6 [&_.avatar]:text-[8px] [&_span:not(.avatar)]:mt-1 [&_span:not(.avatar)]:block mt-0 [&_>_div]:min-h-[145px] [&_>_div]:px-6 [&_>_div]:py-7 [&_>_div]:text-center [&_p]:text-[16px] [&_p]:text-[#96969a] [&_strong]:justify-center [&_strong]:text-[23px] [&_strong]:font-medium [&_strong]:text-[#333336] [&_span:not(.avatar)]:text-[14px] [&_span:not(.avatar)]:text-[#9b9b9f] max-[760px]:[&_p]:text-[12px] max-[760px]:[&_strong]:text-[17px] max-[760px]:[&_span:not(.avatar)]:text-[11px] max-[560px]:[&_>_div]:min-h-[110px] max-[560px]:[&_>_div]:px-2 max-[560px]:[&_>_div]:py-5 max-[560px]:[&_strong]:text-[13px] max-[560px]:[&_span:not(.avatar)]:text-[10px]"}>
            <div>
              <p>Date & time</p>
              <strong>{time(booking.startTime)}</strong>
              <span>{dateLabel(booking.startTime, true)}</span>
            </div>
            <div>
              <p>Service</p>
              <strong>{service.name}</strong>
              <span>
                {duration(service.duration)} · until {time(booking.endTime)}
              </span>
            </div>
            <div>
              <p>{publicView ? "Reserved for" : "Customer"}</p>
              <strong>{customer.name}</strong>
              <span>{customer.phone}</span>
            </div>
            <div>
              <p>Your specialist</p>
              <strong className={"staff-detail"}>
                <Avatar name={staff.name} />
                {staff.name}
              </strong>
              <span>{staff.role}</span>
            </div>
          </Card>
          <div className={"detail-location my-7 [&_h3]:mb-5 [&_h3]:text-[24px] [&_h3]:font-medium [&_h3]:tracking-[-0.05em] [&_h3]:text-[#9b9b9e]"}>
            <h3>Find your way here</h3>
            <LocationCard />
          </div>
          <BookingCode code={booking.code} />
          {publicView && (
            <p className={"fine-print text-[11px] leading-6 text-[#9d9d9d]"}>
              Keep this code handy. You can use it to find your reservation or
              mention it when you call the studio.
            </p>
          )}
          {!terminal && (
            <div className={"details-bottom-actions mt-6 flex flex-wrap gap-2"}>
              {publicView &&
                ["Pending", "Needs confirmation"].includes(booking.status) && (
                  <Button
                    className={"button primary inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"}
                    onClick={() => setStatus("Confirmed")}
                  >
                    <IconCheck size={17} />
                    Confirm my attendance
                  </Button>
                )}
              {!publicView && (
                <>
                  <Button variant="secondary"
                    className={"button inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"}
                    onClick={() => setStatus("Completed")}
                  >
                    <IconCheck size={16} />
                    Mark completed
                  </Button>
                  {booking.status !== "Confirmed" && (
                    <Button variant="secondary"
                      className={"button inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"}
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
            <Link href={`/r/${booking.code}`} className={"inline-flex items-center gap-2 text-[11px] font-semibold text-[#6f6f6f] transition hover:text-[#292929]"}>
              View customer reservation page <IconArrowUpRight size={15} />
            </Link>
          )}
        </Card>
        <aside className={"details-aside flex-col [&_.panel_h3]:mb-2 [&_.panel_h3]:text-[17px] [&_.panel_h3]:font-semibold [&_.panel_h3]:tracking-[-0.035em] [&_.panel_p:not(.eyebrow)]:text-[11px] [&_.panel_p:not(.eyebrow)]:leading-5 [&_.panel_p:not(.eyebrow)]:text-[#989898] [&_textarea]:mt-2 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-[#ececec] [&_textarea]:bg-[#fafbf9] [&_textarea]:p-3 [&_textarea]:text-[11px] [&_textarea]:outline-none [&_textarea]:focus:border-[#afafaf] [&_.small-button]:mt-2 max-[1023px]:grid max-[1023px]:grid-cols-2 mt-5 grid grid-cols-2 items-start gap-4 [&_.panel]:rounded-[28px] [&_.panel]:border-0 [&_.panel]:bg-white max-[760px]:grid-cols-1"}>
          {!publicView && !terminal && (
            <Card className={"panel reminder-card rounded-[21px] border-[#ededed] p-6 border-0 bg-[#f8f8fa] shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a] [&_>_.service-symbol]:mb-6 [&_strong]:my-2 [&_strong]:block [&_strong]:text-[13px] [&_.soft-label]:my-2 [&_.button]:mt-5 [&_.text-link]:mt-3"}>
              <span className={"service-symbol inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#ebebed] text-[#555558]"}>
                <IconBell size={22} />
              </span>
              <h3>A thoughtful reminder.</h3>
              <p>
                {booking.reminder
                  ? "AI call reminder planned"
                  : "No reminder planned yet"}
              </p>
              {booking.reminder && (
                <strong>
                  {dateLabel(booking.reminder)}, {time(booking.reminder)}
                </strong>
              )}
              <span className={"soft-label inline-flex items-center gap-1.5 rounded-full bg-[#f2f2f2] px-2.5 py-1 text-[10px] font-medium text-[#7b7b7b]"}>Receptionist not connected</span>
              <p className={"fine-print text-[11px] leading-6 text-[#9d9d9d]"}>
                Reminder times are saved in this demo. Calls will be available
                when your receptionist is connected.
              </p>
              <Button variant="secondary" className={"button full inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"} onClick={() => setReminder(true)}>
                Change reminder <IconClock size={16} />
              </Button>
              <button
                className={"inline-flex items-center gap-2 text-[11px] font-semibold text-[#6f6f6f] transition hover:text-[#292929]"}
                onClick={() =>
                  toast.info(
                    "Your receptionist isn’t connected yet. Use Contact to call the customer directly.",
                  )
                }
              >
                Ask agent to call <IconArrowUpRight size={14} />
              </button>
            </Card>
          )}
          {!publicView && (
            <Card className={"panel rounded-[21px] border-[#ededed] p-6 border-0 bg-[#f8f8fa] shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]"}>
              <h3>A note for the visit</h3>
              <Textarea
                aria-label="Booking notes"
                value={notes}
                rows={3}
                placeholder="Anything to keep in mind…"
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button variant="secondary" size="sm"
                className={"small-button inline-flex h-8 items-center justify-center rounded-lg border border-[#e7e7e7] bg-white px-3 text-[10px] font-semibold text-[#646464] transition hover:border-[#bebebe]"}
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
            </Card>
          )}
          <Card className={"panel rounded-[21px] border-[#ededed] p-6 border-0 bg-[#f8f8fa] shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]"}>
            <p className={"eyebrow text-[10px] font-semibold tracking-[0.17em] text-[#a0a0a0] uppercase"}>
              {publicView ? "YOUR RESERVATION" : "THE STORY SO FAR"}
            </p>
            <h3>Booking activity</h3>
            <BookingActivityList booking={booking} />
          </Card>
          {publicView && (
            <Card className={"panel policy-card rounded-[20px] p-6 [&_h4]:mt-5 [&_h4]:text-[11px] [&_h4]:font-semibold [&_p]:mt-2 [&_p]:text-[10px] [&_p]:leading-5 [&_p]:text-[#9a9a9a] border-[#e8e8ea] border-0 bg-[#f8f8fa] shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]"}>
              <h3>A little heads-up</h3>
              <p>{state.business.bookingPolicy}</p>
              <p>{state.business.cancellationPolicy}</p>
            </Card>
          )}
        </aside>
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
          <div className={"cancel-summary my-5 rounded-xl bg-[#f9f9f9] p-4 text-[12px] [&_p]:mt-1 [&_p]:text-[11px] [&_p]:text-[#959595]"}>
            <strong>{service.name}</strong>
            <p>
              {dateLabel(booking.startTime)} · {time(booking.startTime)}
            </p>
          </div>
          <p className={"muted text-[#8e8e8e]"}>{state.business.cancellationPolicy}</p>
          <div className={"flow-footer mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#efefef] pt-5 [&_.button:last-child]:ml-auto"}>
            <Button variant="secondary" className={"button inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"} onClick={() => setCancel(false)}>
              Keep reservation
            </Button>
            <Button variant="destructive"
              className={"button danger-button inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"}
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
            <label className={"field mb-4 block text-[11px] font-semibold text-[#636363] [&_input]:mt-2 [&_input]:block [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border-[#e8e8e8] [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-[11px] [&_input]:font-normal [&_input]:text-[#2f2f2f] [&_input]:outline-none [&_input]:transition [&_input]:placeholder:text-[#b5b5b5] [&_input]:focus:border-[#a0a0a0] [&_input]:focus:ring-2 [&_input]:focus:ring-[#a2a2a228] [&_textarea]:mt-2 [&_textarea]:block [&_textarea]:min-h-10 [&_textarea]:w-full [&_textarea]:rounded-[10px] [&_textarea]:border-[#e8e8e8] [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-[11px] [&_textarea]:font-normal [&_textarea]:text-[#2f2f2f] [&_textarea]:outline-none [&_textarea]:transition [&_textarea]:placeholder:text-[#b5b5b5] [&_textarea]:focus:border-[#a0a0a0] [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-[#a2a2a228] [&_select]:mt-2 [&_select]:block [&_select]:min-h-10 [&_select]:w-full [&_select]:rounded-[10px] [&_select]:border-[#e8e8e8] [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-[11px] [&_select]:font-normal [&_select]:text-[#2f2f2f] [&_select]:outline-none [&_select]:transition [&_select]:placeholder:text-[#b5b5b5] [&_select]:focus:border-[#a0a0a0] [&_select]:focus:ring-2 [&_select]:focus:ring-[#a2a2a228] [&_textarea]:resize-y [&_input[readonly]]:bg-[#f8f8f8] [&_input[readonly]]:text-[#8b8b8b] [&_input]:border-0 [&_input]:bg-[#f1f1f4] [&_input]:shadow-none [&_textarea]:border-0 [&_textarea]:bg-[#f1f1f4] [&_textarea]:shadow-none [&_select]:border-0 [&_select]:bg-[#f1f1f4] [&_select]:shadow-none [&_input:focus]:border-0 [&_input:focus]:ring-2 [&_input:focus]:ring-[#d8d8da] [&_textarea:focus]:border-0 [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[#d8d8da] [&_select:focus]:border-0 [&_select:focus]:ring-2 [&_select:focus]:ring-[#d8d8da]"}>
              Reminder date & time
              <Input
                required
                type="datetime-local"
                min={NOW.slice(0, 16)}
                max={booking.startTime.slice(0, 16)}
                value={reminderTime.slice(0, 16)}
                onChange={(e) => setReminderTime(`${e.target.value}:00`)}
              />
            </label>
            <Button className={"button primary full inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"} type="submit">
              Save reminder
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
