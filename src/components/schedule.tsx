"use client";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  IconArrowRight,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCircle,
  IconClock,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { useStore } from "@/lib/store";
import {
  addDays,
  type Booking,
  dateLabel,
  duration,
  NOW,
  time,
  TODAY,
} from "@/lib/model";
import {
  Avatar,
  BookingCard,
  EmptyState,
  PageHeader,
  SegmentedControl,
  ServiceIcon,
} from "./shared";
import { type BookingPreset } from "./booking-flow";

type Props = {
  onNew: (preset?: BookingPreset) => void;
  onBooking: (booking: Booking) => void;
};
const START_HOUR = 8;
const END_HOUR = 19;
const HOUR_HEIGHT = 78;
function offset(dateTime: string) {
  const d = new Date(dateTime);
  return (d.getHours() - START_HOUR + d.getMinutes() / 60) * HOUR_HEIGHT;
}
function weekDays(date: string) {
  const weekday = (new Date(`${date}T12:00:00`).getDay() + 6) % 7;
  const monday = addDays(date, -weekday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
function WeekStrip({
  selected,
  setSelected,
  dayOnly = false,
}: {
  selected: string;
  setSelected: (date: string) => void;
  dayOnly?: boolean;
}) {
  const { state } = useStore();
  const days = dayOnly ? [selected] : weekDays(selected);
  return (
    <div
      className={`mx-auto mb-5 flex max-w-[1070px] items-center border-b border-[#e5e5e7] pb-5 ${
        dayOnly ? "justify-center" : "justify-between"
      }`}
    >
      {!dayOnly && <div className="w-10 max-[560px]:hidden" />}
      {days.map((day) => {
        const isSelected = selected === day;
        const count = state.bookings.filter(
          (b) => b.startTime.startsWith(day) && b.status !== "Cancelled",
        ).length;
        const attention = state.bookings.some(
          (b) =>
            b.startTime.startsWith(day) &&
            ["Needs confirmation", "Pending"].includes(b.status),
        );
        return (
          <button
            key={day}
            aria-pressed={isSelected}
            className="flex w-[70px] flex-col items-center gap-1 max-[560px]:w-[calc(100%/7)]"
            onClick={() => setSelected(day)}
          >
            <span
              className={`text-[10px] font-medium max-[560px]:text-[8px] ${
                isSelected ? "text-[#1f1f21]" : "text-[#97979a]"
              }`}
            >
              {new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "short",
              })}
            </span>
            <strong
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold transition max-[560px]:h-7 max-[560px]:w-7 max-[560px]:text-[11px] ${
                isSelected
                  ? "bg-[#202022] text-white"
                  : "text-[#4a4a4d] hover:bg-[#f0f0f2]"
              }`}
            >
              {Number(day.slice(8))}
            </strong>
            <i
              className="flex h-[7px] items-center gap-0.5"
              aria-label={`${count} reservations`}
            >
              {Array.from({ length: Math.min(4, count) }, (_, i) => (
                <b
                  key={i}
                  className={`h-[5px] w-[5px] rounded-full ${
                    attention && i === 0 ? "bg-[#dd8b84]" : "bg-[#bcbcbf]"
                  }`}
                />
              ))}
            </i>
          </button>
        );
      })}
      {!dayOnly && <div className="w-10 max-[560px]:hidden" />}
    </div>
  );
}
function ScheduleTimeline({
  day,
  staff,
  onNew,
  onBooking,
}: { day: string; staff: string } & Props) {
  const { state } = useStore();
  const events = state.bookings
    .filter(
      (b) =>
        b.startTime.startsWith(day) &&
        b.status !== "Cancelled" &&
        (staff === "all" || b.staffId === staff),
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const hours =
    state.business.hours[(new Date(`${day}T12:00:00`).getDay() + 6) % 7];
  const nowOffset = day === TODAY ? offset(NOW) : -1;
  return (
    <div
      className={"reference-timeline relative mx-auto w-full max-w-[950px]"}
      style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT + 50 }}
    >
      <div
        className={
          "timeline-spine absolute bottom-0 top-0 w-px bg-[#cbcbce] [left:27%] max-[560px]:[left:25%]"
        }
      />
      {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
        <span
          key={i}
          className={
            "reference-hour absolute w-14 -translate-y-2 text-right text-[9px] font-medium text-[#a0a0a3] [left:calc(27%_-_83px)] max-[760px]:[left:calc(27%_-_75px)] max-[560px]:w-12 max-[560px]:text-[8px] max-[560px]:[left:calc(25%_-_66px)]"
          }
          style={{ top: i * HOUR_HEIGHT }}
        >
          {String(START_HOUR + i).padStart(2, "0")}:00
        </span>
      ))}
      {!hours.closed &&
        Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => {
          const hour = START_HOUR + Math.floor(i / 2);
          const minute = i % 2 ? 30 : 0;
          const start = `${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
          const inside =
            `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` >=
              hours.open &&
            `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` <
              hours.close &&
            start > NOW;
          return (
            <button
              key={i}
              className="absolute z-0 flex items-center gap-2 pl-14 text-[10px] font-medium text-[#858589] opacity-0 transition hover:bg-[#e5e5e7] hover:opacity-100 disabled:hover:bg-transparent disabled:hover:opacity-0 [left:27%] [right:6%] max-[560px]:[left:25%]"
              aria-label={`Add reservation at ${time(start)}`}
              disabled={!inside}
              style={{ top: (i * HOUR_HEIGHT) / 2, height: HOUR_HEIGHT / 2 }}
              onClick={() =>
                onNew({
                  date: day,
                  startTime: start,
                  ...(staff === "all" ? {} : { staffId: staff }),
                })
              }
            >
              <IconPlus size={14} className="rounded-full bg-white p-0.5" />
              <span>Add a booking</span>
            </button>
          );
        })}
      {nowOffset >= 0 && (
        <div
          className="pointer-events-none absolute z-20 h-px bg-[#d3a39e] [left:27%] [right:7%] max-[560px]:[left:25%] max-[560px]:[right:3%]"
          style={{ top: nowOffset }}
        >
          <i className="absolute -left-[5px] -top-[5px] h-[11px] w-[11px] rounded-full bg-[#d7958e]" />
          <span className="absolute -top-[17px] right-0 text-[8px] font-bold tracking-[0.06em] text-[#bf817b]">NOW · 10:15</span>
        </div>
      )}
      {events.map((b, index) => {
        const service = state.services.find((s) => s.id === b.serviceId)!;
        const customer = state.customers.find((c) => c.id === b.customerId)!;
        const staffMember = state.staff.find((s) => s.id === b.staffId)!;
        const height = Math.max(
          50,
          ((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) /
            60000 /
            60) *
            HOUR_HEIGHT -
            4,
        );
        const previous = events[index - 1];
        const overlaps = previous && previous.endTime > b.startTime;
        const isFinished = b.status === "Completed";
        const needsAttention = ["Needs confirmation", "Pending"].includes(b.status);
        return (
          <button
            key={b.id}
            onClick={() => onBooking(b)}
            className={`absolute z-10 flex items-center text-left transition hover:brightness-[0.96] [left:calc(27%_-_18px)] max-[560px]:[left:calc(25%_-_17px)] max-[560px]:[right:3%] ${
              overlaps ? "[right:46%]" : "[right:7%]"
            }`}
            style={{ top: offset(b.startTime) + 2, height }}
          >
            <span
              className={`absolute bottom-0 left-0 top-0 flex w-9 items-center justify-center rounded-full border ${
                isFinished
                  ? "border-[#dedee0] bg-[#e1e1e3] text-[#66666a]"
                  : needsAttention
                    ? "border-[#f0cfca] bg-[#f8e4e2] text-[#b26e68]"
                    : "border-[#dedee0] bg-white text-[#4a4a4d]"
              }`}
            >
              <ServiceIcon serviceId={service.id} size={18} />
            </span>
            <span className="ml-12 flex min-w-0 flex-1 flex-col justify-center py-1 max-[560px]:ml-11">
              <small className="text-[9px] font-medium text-[#99999d] max-[560px]:text-[8px]">
                {time(b.startTime)} – {time(b.endTime)} ·{" "}
                {duration(service.duration)}
              </small>
              <strong
                className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-semibold tracking-[-0.02em] max-[560px]:text-[10px] ${
                  isFinished
                    ? "text-[#8f8f93] line-through"
                    : "text-[#28282a]"
                }`}
              >
                {service.name}
              </strong>
              <em className="mt-1 text-[10px] not-italic text-[#858589] max-[560px]:text-[8px]">
                {customer.name} <span className="text-[#aaaab0] max-[560px]:hidden">· {staffMember.name}</span>
              </em>
            </span>
            <span
              className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                isFinished
                  ? "border-[#d59a93] bg-[#e8aaa3] text-white"
                  : needsAttention
                    ? "border-[#c9877e] text-[#b8746b]"
                    : "border-[#7c7c80] text-[#626266]"
              }`}
              aria-label={b.status}
            >
              {b.status === "Completed" || b.status === "Confirmed" ? (
                <IconCheck size={13} />
              ) : (
                <IconCircle size={13} />
              )}
            </span>
          </button>
        );
      })}
      {events.map((b, i) => {
        const next = events[i + 1];
        if (!next) return null;
        const gap =
          (new Date(next.startTime).getTime() - new Date(b.endTime).getTime()) /
          60000;
        if (gap < 30) return null;
        return (
          <button
            key={`gap-${b.id}`}
            className="absolute z-20 flex items-center gap-2 rounded-full bg-[#e6e6e8] px-2 py-1 text-[9px] text-[#98989c] transition hover:bg-white hover:text-[#28282a] [left:calc(27%_+_32px)] max-[560px]:[left:calc(25%_+_22px)]"
            style={{
              top: offset(b.endTime) + Math.min((gap / 120) * HOUR_HEIGHT, 16),
            }}
            onClick={() => onNew({ date: day, startTime: b.endTime })}
          >
            <IconClock size={13} /> {duration(gap)} free{" "}
            <span className="ml-1 font-semibold text-[#737377]">＋ Add booking</span>
          </button>
        );
      })}
      {hours.closed && (
        <div className="absolute left-[36%] right-[8%] top-[34%] text-center text-[22px] font-medium tracking-[-0.05em] text-[#7e7e82]">
          A day to pause.
          <span className="mt-2 block text-[11px] font-normal tracking-normal text-[#aaaab0]">The studio is closed today.</span>
        </div>
      )}
      {!hours.closed && !events.length && (
        <div className="absolute left-[36%] right-[8%] top-[34%] text-center text-[22px] font-medium tracking-[-0.05em] text-[#7e7e82]">
          A little room in your day.
          <span className="mt-2 block text-[11px] font-normal tracking-normal text-[#aaaab0]">Click an open time to add a reservation.</span>
        </div>
      )}
    </div>
  );
}
function ScheduleScaffold({
  day,
  setDay,
  onNew,
  onBooking,
  calendar = false,
  dayOnly = false,
  modeControl,
}: {
  day: string;
  setDay: (day: string) => void;
  calendar?: boolean;
  dayOnly?: boolean;
  modeControl?: React.ReactNode;
} & Props) {
  const { state } = useStore();
  const [staff, setStaff] = useState("all");
  const all = state.bookings.filter(
    (b) => b.startTime.startsWith(day) && b.status !== "Cancelled",
  );
  const attention = all.filter((b) =>
    ["Needs confirmation", "Pending"].includes(b.status),
  );
  const next = all.find((b) => b.startTime > NOW && b.status !== "Completed");
  return (
    <>
      <div className="relative mb-7 grid grid-cols-[1fr_auto_1fr] items-center gap-4 max-[760px]:grid-cols-[1fr_auto]">
        <div className="max-[760px]:col-span-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#9b9b9e]">
            {calendar ? "YOUR WEEK, YOUR WAY" : "A GOOD DAY BEGINS HERE"}
          </span>
          <h1 className="mt-2 text-[27px] font-medium tracking-[-0.055em] text-[#252527] max-[760px]:text-[24px]">
            {calendar ? "Calendar" : `Good morning, ${state.settings.owner}.`}
          </h1>
        </div>
        <div className="flex items-center gap-2 max-[760px]:col-start-1 max-[560px]:gap-0">
          <button
            aria-label="Previous day or week"
            onClick={() => setDay(addDays(day, calendar && !dayOnly ? -7 : -1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e3e3e5] bg-white text-[#6f6f72] transition hover:text-[#1b1b1d] max-[560px]:h-6 max-[560px]:w-6"
          >
            <IconChevronLeft size={18} />
          </button>
          <button
            className="min-w-[162px] text-center text-[14px] font-semibold tracking-[-0.035em] text-[#252527] max-[560px]:min-w-[132px] max-[560px]:text-[11px]"
            onClick={() => setDay(TODAY)}
          >
            {new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </button>
          <button
            aria-label="Next day or week"
            onClick={() => setDay(addDays(day, calendar && !dayOnly ? 7 : 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e3e3e5] bg-white text-[#6f6f72] transition hover:text-[#1b1b1d] max-[560px]:h-6 max-[560px]:w-6"
          >
            <IconChevronRight size={18} />
          </button>
        </div>
        <div className="flex justify-end gap-2 max-[760px]:col-start-2">
          {modeControl}
          <Button
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#1e1e20] px-4 text-[11px] font-semibold text-white transition hover:bg-[#38383c]"
            onClick={() => onNew({ date: day })}
          >
            <IconPlus size={17} />
            New booking
          </Button>
        </div>
      </div>
      <WeekStrip selected={day} setSelected={setDay} dayOnly={dayOnly} />
      <div className="grid grid-cols-[230px_minmax(0,1fr)] items-start gap-5 max-[1023px]:grid-cols-[180px_minmax(0,1fr)] max-[1023px]:gap-3 max-[760px]:grid-cols-1">
        <aside className="flex flex-col gap-4 pt-2 max-[760px]:grid max-[760px]:grid-cols-2 max-[560px]:grid-cols-1">
          <div className="rounded-[20px] border-0 bg-[#f8f8fa] p-5 max-[560px]:hidden">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a0a0a0]">
                {calendar ? "SELECTED DAY" : "TODAY"}
              </span>
              <span className="rounded-full bg-[#f0f0f1] px-2.5 py-1 text-[9px] font-medium text-[#8a8a8e]">
                {all.length} bookings
              </span>
            </div>
            <h2 className="mt-7 text-[20px] font-medium tracking-[-0.045em] text-[#252527]">{dateLabel(day).split(",")[0]}</h2>
            <p className="mt-2 text-[11px] leading-5 text-[#98989c]">
              {all.length
                ? `Your first appointment is at ${time(all[0].startTime)}.`
                : "A little room to breathe."}
            </p>
          </div>
          {attention.length > 0 && (
            <div className="rounded-[20px] border-0 bg-[#f8f8fa] p-5 max-[560px]:p-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a0a0a0]">
                NEEDS A REPLY
              </span>
              {attention.map((b) => {
                const c = state.customers.find((c) => c.id === b.customerId)!;
                return (
                  <button
                    key={b.id}
                    onClick={() => onBooking(b)}
                    className="mt-4 flex w-full items-center gap-2 rounded-[12px] bg-[#f4f4f5] p-2 text-left transition hover:bg-[#ececee]"
                  >
                    <Avatar name={c.name} />
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[10px] font-semibold text-[#252527]">{c.name}</strong>
                      <small className="mt-0.5 block text-[9px] text-[#a47f74]">{b.status}</small>
                    </span>
                    <IconArrowRight size={15} className="text-[#b2b2b4]" />
                  </button>
                );
              })}
            </div>
          )}
          {next && (
            <div className="rounded-[20px] border-0 bg-[#f8f8fa] p-5 max-[760px]:hidden">
              <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a0a0a0]">
                COMING UP
              </span>
              <strong className="mt-5 block text-[23px] font-medium tracking-[-0.05em] text-[#252527]">{time(next.startTime)}</strong>
              <p className="mt-1 text-[10px] leading-5 text-[#929295]">
                {state.services.find((s) => s.id === next.serviceId)?.name} with{" "}
                {state.customers.find((c) => c.id === next.customerId)?.name}
              </p>
              <button
                onClick={() => onBooking(next)}
                className="mt-5 inline-flex items-center gap-2 text-[10px] font-semibold text-[#545457] hover:text-[#1e1e20]"
              >
                View reservation <IconArrowRight size={13} />
              </button>
            </div>
          )}
          <Link
            href={calendar ? "/" : "/calendar"}
            className="mt-1 inline-flex items-center gap-2 px-3 text-[10px] font-semibold text-[#545457] hover:text-[#1e1e20] max-[760px]:hidden"
          >
            {calendar ? "Back to week" : "Open calendar"}
            <IconArrowRight size={15} />
          </Link>
        </aside>
        <section className="overflow-hidden rounded-[36px] border-0 bg-[#f8f8fa] max-[760px]:rounded-[26px]">
          <div className="flex items-center justify-between border-b border-[#e2e2e4] px-8 py-4 text-[10px] font-medium text-[#7f7f82] max-[560px]:px-4">
            <span className="flex items-center gap-2">
              <i className="h-1.5 w-1.5 rounded-full bg-[#252527]" />
              {day === TODAY ? "Today’s timeline" : dateLabel(day)}
            </span>
            <label className="flex items-center gap-2">
              Staff{" "}
              <select
                aria-label="Filter timeline by staff"
                value={staff}
                onChange={(e) => setStaff(e.target.value)}
                className="rounded-full border border-[#dcdcdf] bg-[#f9f9fa] px-3 py-1.5 text-[10px] font-medium text-[#545457] outline-none"
              >
                <option value="all">All staff</option>
                {state.staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ScheduleTimeline
            day={day}
            staff={staff}
            onNew={onNew}
            onBooking={onBooking}
          />
        </section>
      </div>
    </>
  );
}
function placeEvents(events: Booking[]) {
  const ordered = [...events].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
  const groups: Booking[][] = [];
  let group: Booking[] = [];
  let groupEnd = "";
  for (const event of ordered) {
    if (group.length && event.startTime >= groupEnd) {
      groups.push(group);
      group = [];
      groupEnd = "";
    }
    group.push(event);
    if (event.endTime > groupEnd) groupEnd = event.endTime;
  }
  if (group.length) groups.push(group);
  return groups.flatMap((items) => {
    const laneEnds: string[] = [];
    const placed = items.map((booking) => {
      let lane = laneEnds.findIndex((end) => end <= booking.startTime);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = booking.endTime;
      return { booking, lane };
    });
    return placed.map((item) => ({ ...item, lanes: laneEnds.length }));
  });
}
export function CalendarPage({ onNew, onBooking }: Props) {
  const { state } = useStore();
  const [day, setDay] = useState(TODAY);
  const [mode, setMode] = useState<"Week" | "Day">("Week");
  const [staff, setStaff] = useState("all");
  const days = weekDays(day);
  const first = new Date(`${days[0]}T12:00:00`);
  const last = new Date(`${days[6]}T12:00:00`);
  const range = `${first.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${last.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  if (mode === "Day")
    return (
      <ScheduleScaffold
        day={day}
        setDay={setDay}
        calendar
        dayOnly
        modeControl={
          <span className="static z-10">
            <SegmentedControl
              options={["Week", "Day"]}
              value={mode}
              onChange={setMode}
            />
          </span>
        }
        onNew={onNew}
        onBooking={onBooking}
      />
    );
  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a0a0a0]">
            YOUR WEEK AT A GLANCE
          </p>
          <h1 className="mt-2 text-[48px] font-medium tracking-[-0.065em] text-[#202022] max-[760px]:text-[38px]">
            Your calendar.
          </h1>
          <p className="mt-2 text-[13px] text-[#939396]">All seven days, with room for what’s next.</p>
        </div>
        <Button
          className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#1e1e20] px-4 text-[11px] font-semibold text-white transition hover:bg-[#38383c]"
          onClick={() => onNew({ date: day })}
        >
          <IconPlus size={17} />
          New booking
        </Button>
      </div>
      <Card className="overflow-hidden rounded-[28px] border-0 bg-[#f8f8fa] !gap-0 !py-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-0 border-[#e8e8ea] px-6 py-5 max-[760px]:px-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e7e7e9] text-[#7c7c7c] transition hover:bg-white hover:text-[#303030]"
              aria-label="Previous week"
              onClick={() => setDay(addDays(day, -7))}
            >
              <IconChevronLeft size={18} />
            </Button>
            <h2 className="min-w-[180px] text-center text-[17px] font-semibold tracking-[-0.04em] text-[#202022]">{range}</h2>
            <Button
              variant="ghost"
              size="icon"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e7e7e9] text-[#7c7c7c] transition hover:bg-white hover:text-[#303030]"
              aria-label="Next week"
              onClick={() => setDay(addDays(day, 7))}
            >
              <IconChevronRight size={18} />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="ml-2 inline-flex h-8 items-center justify-center rounded-lg border border-[#e7e7e7] bg-white px-3 text-[10px] font-semibold text-[#646464] transition hover:border-[#bebebe]"
              onClick={() => setDay(TODAY)}
            >
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter calendar by staff"
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
              className="h-9 rounded-lg border-0 bg-[#f1f1f4] px-3 text-[11px] font-medium text-[#535357] shadow-none outline-none"
            >
              <option value="all">All staff</option>
              {state.staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <SegmentedControl
              options={["Week", "Day"]}
              value={mode}
              onChange={setMode}
            />
          </div>
        </div>
        <div className="max-h-[min(930px,calc(100vh-310px))] overflow-auto max-[760px]:max-h-[min(800px,calc(100vh-280px))]">
          <div className="grid min-w-[1120px] [grid-template-columns:64px_repeat(7,minmax(145px,1fr))]">
            <div className="sticky top-0 z-30 flex h-[72px] items-center justify-center border-b-0 border-[#e5e5e7] bg-[#f8f8fa] text-[9px] font-semibold text-[#aaaab0]">
              WAT
            </div>
            {days.map((date) => {
              const isToday = date === TODAY;
              const count = state.bookings.filter(
                (b) => b.startTime.startsWith(date) && b.status !== "Cancelled",
              ).length;
              return (
                <button
                  key={date}
                  className={`sticky top-0 z-30 flex h-[72px] flex-col items-center justify-center border-b-0 border-l-0 border-[#e9e9eb] text-[10px] transition hover:bg-[#f1f1f3] [box-shadow:inset_-1px_0_#ededf0] ${
                    isToday ? "bg-[#f5f5f6] text-[#252527]" : "bg-[#f8f8fa] text-[#909094]"
                  }`}
                  onClick={() => {
                    setDay(date);
                    setMode("Day");
                  }}
                  aria-label={`Show ${dateLabel(date)} in day view`}
                >
                  <span className="text-[10px]">
                    {new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </span>
                  <strong
                    className={`my-1 flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold ${
                      isToday
                        ? "bg-[#252527] text-white"
                        : "text-[#303033]"
                    }`}
                  >
                    {Number(date.slice(8))}
                  </strong>
                  <small className="text-[9px] text-[#aaaab0]">
                    {count
                      ? `${count} booking${count > 1 ? "s" : ""}`
                      : "Open day"}
                  </small>
                </button>
              );
            })}
            <div
              className="relative border-r-0 border-[#e9e9eb] bg-[#fbfbfc]"
              style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}
            >
              {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                <span
                  key={i}
                  className={`absolute right-2 text-[9px] font-medium text-[#aaaab0] ${
                    i === 0 ? "translate-y-1" : "-translate-y-2"
                  }`}
                  style={{ top: i * HOUR_HEIGHT }}
                >
                  {String(START_HOUR + i).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            {days.map((date) => {
              const hours =
                state.business.hours[
                  (new Date(`${date}T12:00:00`).getDay() + 6) % 7
                ];
              const events = placeEvents(
                state.bookings.filter(
                  (b) =>
                    b.startTime.startsWith(date) &&
                    b.status !== "Cancelled" &&
                    (staff === "all" || staff === b.staffId),
                ),
              );
              const isToday = date === TODAY;
              return (
                <div
                  key={date}
                  className={`relative border-r-0 border-[#e9e9eb] [box-shadow:inset_-1px_0_#ededf0] [background-image:repeating-linear-gradient(_to_bottom,#e9e9eb_0,#e9e9eb_1px,transparent_1px,transparent_78px_)] ${
                    isToday ? "bg-[#fafafa]" : hours.closed ? "bg-[#f7f7f8]" : "bg-[#fbfbfc]"
                  }`}
                  style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}
                >
                  {Array.from(
                    { length: (END_HOUR - START_HOUR) * 2 },
                    (_, i) => {
                      const hour = START_HOUR + Math.floor(i / 2),
                        minute = i % 2 ? 30 : 0;
                      const clock = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
                      const start = `${date}T${clock}:00`;
                      const enabled =
                        !hours.closed &&
                        start > NOW &&
                        clock >= hours.open &&
                        clock < hours.close;
                      return (
                        <button
                          key={i}
                          className="absolute z-0 flex w-full items-center justify-center border-0 border-dashed border-[#f0f0f1] text-[#5f5f63] opacity-0 transition hover:bg-[#eeeeef] hover:opacity-100 disabled:hover:bg-transparent disabled:hover:opacity-0"
                          style={{
                            top: (i * HOUR_HEIGHT) / 2,
                            height: HOUR_HEIGHT / 2,
                          }}
                          disabled={!enabled}
                          aria-label={`New booking ${dateLabel(date)} at ${time(start)}`}
                          onClick={() =>
                            onNew({
                              date,
                              startTime: start,
                              ...(staff === "all" ? {} : { staffId: staff }),
                            })
                          }
                        >
                          <IconPlus size={15} className="h-5 w-5 rounded-full bg-white p-0.5" />
                        </button>
                      );
                    },
                  )}
                  {hours.closed && (
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-medium uppercase tracking-[0.18em] text-[#bababe]">
                      Closed
                    </span>
                  )}
                  {events.map(({ booking, lane, lanes }) => {
                    const service = state.services.find(
                      (s) => s.id === booking.serviceId,
                    )!;
                    const customer = state.customers.find(
                      (c) => c.id === booking.customerId,
                    )!;
                    const minutes =
                      (new Date(booking.endTime).getTime() -
                        new Date(booking.startTime).getTime()) /
                      60000;
                    const isCompleted = booking.status === "Completed";
                    const isPending = ["Pending", "Needs confirmation"].includes(booking.status);
                    return (
                      <button
                        key={booking.id}
                        className={`absolute z-10 overflow-hidden rounded-[9px] border-0 p-2 text-left transition hover:z-20 hover:bg-[#e0e0e3] ${
                          isCompleted
                            ? "bg-[#f3f3f4] text-[#858589]"
                            : isPending
                              ? "bg-[#faf0ef] text-[#8d6762]"
                              : "bg-[#ebebed] text-[#353538]"
                        }`}
                        style={{
                          top: offset(booking.startTime) + 2,
                          height: Math.max(
                            32,
                            (minutes / 60) * HOUR_HEIGHT - 4,
                          ),
                          left: `calc(${(lane / lanes) * 100}% + 3px)`,
                          width: `calc(${100 / lanes}% - 6px)`,
                        }}
                        onClick={() => onBooking(booking)}
                        aria-label={`${service.name} with ${customer.name}, ${time(booking.startTime)} to ${time(booking.endTime)}. ${booking.status}.`}
                      >
                        <small className={`block overflow-hidden text-ellipsis whitespace-nowrap text-[9px] font-medium ${isPending ? "text-[#a88580]" : "text-[#757579]"}`}>
                          {time(booking.startTime)} – {time(booking.endTime)}
                        </small>
                        <strong className={`mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold leading-[1.15] tracking-[-0.025em] ${isCompleted ? "line-through" : ""}`}>
                          {service.name}
                        </strong>
                        {minutes >= 60 && (
                          <span className={`mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-[10px] ${isPending ? "text-[#a88580]" : "text-[#636367]"}`}>
                            {customer.name}
                          </span>
                        )}
                        {minutes >= 120 && (
                          <em className="mt-2 block overflow-hidden text-ellipsis whitespace-nowrap text-[9px] not-italic text-[#858589]">
                            {
                              state.staff.find((s) => s.id === booking.staffId)
                                ?.name
                            }
                          </em>
                        )}
                      </button>
                    );
                  })}
                  {date === TODAY && (
                    <div
                      className="pointer-events-none absolute z-20 h-px w-full bg-[#d48880]"
                      style={{ top: offset(NOW) }}
                    >
                      <i className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-[#d48880]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-5 border-0 border-[#e8e8ea] px-6 py-4 text-[10px] text-[#77777b]">
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-[2px] bg-[#b9b9bc]" />
            Confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-[2px] bg-[#dba9a3]" />
            Needs attention
          </span>
          <p className="ml-auto text-[#a3a3a7] max-[760px]:ml-0">Click an open time to add a reservation · All times WAT</p>
        </div>
      </Card>
    </>
  );
}

export function BookingsPage({ onNew, onBooking }: Props) {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Upcoming");
  const bookings = state.bookings
    .filter((b) => {
      const c = state.customers.find((c) => c.id === b.customerId)!;
      const s = state.services.find((s) => s.id === b.serviceId)!;
      const searchMatch = `${c.name} ${c.phone} ${b.code} ${s.name}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const statusMatch =
        filter === "All" ||
        (filter === "Upcoming" &&
          b.startTime >= NOW &&
          !["Cancelled", "Completed"].includes(b.status)) ||
        (filter === "Needs attention" &&
          ["Pending", "Needs confirmation"].includes(b.status)) ||
        (filter === "Past" &&
          (b.startTime < NOW || b.status === "Completed")) ||
        (filter === "Cancelled" && b.status === "Cancelled");
      return searchMatch && statusMatch;
    })
    .sort((a, b) =>
      filter === "Past"
        ? b.startTime.localeCompare(a.startTime)
        : a.startTime.localeCompare(b.startTime),
    );
  const dates = [...new Set(bookings.map((b) => b.startTime.slice(0, 10)))];
  return (
    <>
      <PageHeader
        eyebrow="EVERY VISIT, IN ONE PLACE"
        title="Reservations."
        description="Good things on the calendar."
        action={
          <Button
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#1e1e20] px-4 text-[11px] font-semibold text-white transition hover:bg-[#38383c]"
            onClick={() => onNew()}
          >
            <IconPlus size={18} />
            New booking
          </Button>
        }
      />
      <Card className="overflow-hidden rounded-[22px] border-0 bg-[#f8f8fa]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f0f0] px-6 py-5 max-[560px]:px-4">
          <div className="flex flex-wrap items-center gap-1 max-[560px]:overflow-x-auto">
            {["Upcoming", "Needs attention", "Past", "Cancelled", "All"].map(
              (f) => {
                const isActive = filter === f;
                return (
                  <button
                    key={f}
                    className={`rounded-lg px-3 py-2 text-[11px] transition max-[560px]:whitespace-nowrap ${
                      isActive
                        ? "bg-[#f0f0f0] font-semibold text-[#686868]"
                        : "font-medium text-[#999999] hover:bg-[#f6f6f6]"
                    }`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                );
              },
            )}
          </div>
          <label className="flex h-9 min-w-[230px] items-center gap-2 rounded-xl border-0 bg-[#f1f1f4] px-3 text-[#a7a7a7] shadow-none">
            <IconSearch size={17} />
            <Input
              aria-label="Search reservations"
              placeholder="Name, phone or booking code"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border-0 bg-transparent text-[11px] text-[#2e2e2e] placeholder:text-[#b5b5b5] shadow-none outline-none focus-visible:ring-0"
            />
          </label>
        </div>
        {dates.map((d, index) => (
          <div
            className={`px-6 py-5 max-[560px]:px-4 ${
              index > 0 ? "border-t border-[#f1f1f1]" : ""
            }`}
            key={d}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a0a0a0]">
                {d === TODAY ? "TODAY · " : ""}
                {dateLabel(d)}
              </p>
              <span className="text-[10px] text-[#8e8e8e]">
                {bookings.filter((b) => b.startTime.startsWith(d)).length}{" "}
                reservations
              </span>
            </div>
            <div className="space-y-2">
              {bookings
                .filter((b) => b.startTime.startsWith(d))
                .map((b) => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onClick={() => onBooking(b)}
                  />
                ))}
            </div>
          </div>
        ))}
        {!bookings.length && (
          <EmptyState
            title="Nothing here just yet."
            description="Try another filter or search, or make a new reservation."
          />
        )}
      </Card>
    </>
  );
}
