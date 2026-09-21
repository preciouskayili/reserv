"use client";
import { DatePicker } from "./date-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, TableSummary } from "./ui/data-table";
import { Fragment, useState } from "react";
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
  BookingStatus,
  EmptyState,
  PageHeader,
  ReservationIcon,
  SegmentedControl,
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
}: {
  selected: string;
  setSelected: (date: string) => void;
  dayOnly?: boolean;
}) {
  const { state } = useStore();
  const days = weekDays(selected);
  return (
    <div className="mx-auto mb-5 flex w-full items-center justify-between border-b border-border pb-5">
      <div className="w-10 max-[560px]:hidden" />
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
              className={`text-[12px] font-medium max-[560px]:text-[12px] ${
                isSelected ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "short",
              })}
            </span>
            <strong
              className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold transition max-[560px]:h-7 max-[560px]:w-7 max-[560px]:text-[12px] ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
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
                    attention && i === 0 ? "bg-[#dd8b84]" : "bg-muted"
                  }`}
                />
              ))}
            </i>
          </button>
        );
      })}
      <div className="w-10 max-[560px]:hidden" />
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
      className={"reference-timeline relative mx-auto w-full"}
      style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT + 50 }}
    >
      <div
        className={
          "timeline-spine absolute bottom-0 top-0 w-px bg-border left-16"
        }
      />
      {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
        <span
          key={i}
          className={
            "reference-hour absolute left-0 w-12 -translate-y-2 text-right text-[12px] font-medium text-muted-foreground"
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
              className="absolute z-0 flex items-center gap-2 pl-14 text-[12px] font-medium text-muted-foreground opacity-0 transition hover:bg-muted hover:opacity-100 disabled:hover:bg-transparent disabled:hover:opacity-0 left-16 right-3"
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
              <IconPlus size={14} className="rounded-full bg-card p-0.5" />
              <span>Add a booking</span>
            </button>
          );
        })}
      {nowOffset >= 0 && (
        <div
          className="pointer-events-none absolute z-20 h-px bg-[#d3a39e] left-16 right-3"
          style={{ top: nowOffset }}
        >
          <i className="absolute -left-[5px] -top-[5px] h-[11px] w-[11px] rounded-full bg-[#d7958e]" />
          <span className="absolute -top-[17px] right-0 text-[12px] font-bold tracking-wide text-[#bf817b]">NOW · {time(NOW)}</span>
        </div>
      )}
      {placeEvents(events).map(({ booking: b, lane, lanes }) => {
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
        const isFinished = b.status === "Completed";
        const needsAttention = ["Needs confirmation", "Pending"].includes(b.status);
        return (
          <button
            key={b.id}
            onClick={() => onBooking(b)}
            className="absolute z-10 flex items-center rounded-xl bg-muted/70 px-3 text-left transition hover:bg-accent"
            style={{ top: offset(b.startTime) + 2, height, left: `calc(64px + ${lane * 100 / lanes}% - ${lane * 76 / lanes}px)`, width: `calc(${100 / lanes}% - ${76 / lanes + 6}px)` }}
          >
            <span
              className={`absolute bottom-0 left-0 top-0 flex w-9 items-center justify-center rounded-full border ${
                isFinished
                  ? "border-border bg-muted text-foreground"
                  : needsAttention
                    ? "border-[#f0cfca] bg-[#f8e4e2] text-[#b26e68]"
                    : "border-border bg-card text-foreground"
              }`}
            >
              <ReservationIcon size={18} />
            </span>
            <span className="ml-12 flex min-w-0 flex-1 flex-col justify-center py-1 max-[560px]:ml-11">
              <small className="text-[12px] font-medium text-muted-foreground max-[560px]:text-[12px]">
                {time(b.startTime)} – {time(b.endTime)} ·{" "}
                {duration(service.duration)}
              </small>
              <strong
                className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-semibold max-[560px]:text-[12px] ${
                  isFinished
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {service.name}
              </strong>
              <em className="mt-1 text-[12px] not-italic text-muted-foreground max-[560px]:text-[12px]">
                {customer.name} <span className="text-muted-foreground max-[560px]:hidden">· {staffMember.name}</span>
              </em>
            </span>
            <span
              className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                isFinished
                  ? "border-[#d59a93] bg-[#e8aaa3] text-white"
                  : needsAttention
                    ? "border-[#c9877e] text-[#b8746b]"
                    : "border-border text-foreground"
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
            className="absolute z-20 flex items-center gap-2 rounded-full bg-muted px-2 py-1 text-[12px] text-muted-foreground transition hover:bg-card hover:text-foreground [left:calc(15%_+_32px)] max-[560px]:[left:calc(15%_+_22px)]"
            style={{
              top: offset(b.endTime) + Math.min((gap / 120) * HOUR_HEIGHT, 16),
            }}
            onClick={() => onNew({ date: day, startTime: b.endTime })}
          >
            <IconClock size={13} /> {duration(gap)} free{" "}
            <span className="ml-1 font-semibold text-muted-foreground">＋ Add booking</span>
          </button>
        );
      })}
      {hours.closed && (
        <div className="absolute left-[36%] right-[8%] top-[34%] text-center text-[22px] font-medium tracking-tight text-muted-foreground">
          A day to pause.
          <span className="mt-2 block text-[12px] font-normal tracking-normal text-muted-foreground">The studio is closed today.</span>
        </div>
      )}
      {!hours.closed && !events.length && (
        <div className="absolute left-[36%] right-[8%] top-[34%] text-center text-[22px] font-medium tracking-tight text-muted-foreground">
          No appointments scheduled
          <span className="mt-2 block text-[12px] font-normal tracking-normal text-muted-foreground">Click an open time to add a reservation.</span>
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
      <div className="relative mb-7 flex flex-wrap items-center justify-between gap-4">
        <div className="max-[760px]:col-span-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {calendar ? "YOUR WEEK, YOUR WAY" : "A GOOD DAY BEGINS HERE"}
          </span>
          <h1 className="mt-2 text-[27px] font-medium tracking-tight text-foreground max-[760px]:text-[24px]">
            {calendar ? "Calendar" : `Good morning, ${state.settings.owner}.`}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button
            aria-label="Previous day"
            onClick={() => setDay(addDays(day, -1))}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground "
          >
            <IconChevronLeft size={18} />
          </button>
          <DatePicker value={day} onChange={setDay} />
          <button
            aria-label="Next day"
            onClick={() => setDay(addDays(day, 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground "
          >
            <IconChevronRight size={18} />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {modeControl}
          <Button
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/90"
            onClick={() => onNew({ date: day })}
          >
            <IconPlus size={17} />
            New booking
          </Button>
        </div>
      </div>
      <WeekStrip selected={day} setSelected={setDay} />
      <div className="grid grid-cols-[230px_minmax(0,1fr)] items-start gap-5 max-[1023px]:grid-cols-[180px_minmax(0,1fr)] max-[1023px]:gap-3 max-[760px]:grid-cols-1">
        <aside className="flex flex-col gap-4 pt-2 max-[760px]:grid max-[760px]:grid-cols-2 max-[560px]:grid-cols-1">
          <div className="rounded-[20px] border-0 bg-card p-5 max-[560px]:hidden">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {calendar ? "SELECTED DAY" : "TODAY"}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
                {all.length} bookings
              </span>
            </div>
            <h2 className="mt-7 text-[20px] font-medium tracking-tight text-foreground">{dateLabel(day).split(",")[0]}</h2>
            <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
              {all.length
                ? `Your first appointment is at ${time(all[0].startTime)}.`
                : "No appointments scheduled"}
            </p>
          </div>
          {attention.length > 0 && (
            <div className="rounded-[20px] border-0 bg-card p-5 max-[560px]:p-3">
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                NEEDS A REPLY
              </span>
              {attention.map((b) => {
                const c = state.customers.find((c) => c.id === b.customerId)!;
                return (
                  <button
                    key={b.id}
                    onClick={() => onBooking(b)}
                    className="mt-4 flex w-full items-center gap-2 rounded-[12px] bg-background p-2 text-left transition hover:bg-muted"
                  >
                    <Avatar name={c.name} />
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[12px] font-semibold text-foreground">{c.name}</strong>
                      <small className="mt-0.5 block text-[12px] text-warning">{b.status}</small>
                    </span>
                    <IconArrowRight size={15} className="text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
          {next && (
            <div className="rounded-[20px] border-0 bg-card p-5 max-[760px]:hidden">
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                COMING UP
              </span>
              <strong className="mt-5 block text-[23px] font-medium text-foreground">{time(next.startTime)}</strong>
              <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                {state.services.find((s) => s.id === next.serviceId)?.name} with{" "}
                {state.customers.find((c) => c.id === next.customerId)?.name}
              </p>
              <button
                onClick={() => onBooking(next)}
                className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold text-foreground hover:text-foreground"
              >
                View reservation <IconArrowRight size={13} />
              </button>
            </div>
          )}
        </aside>
        <section className="overflow-hidden rounded-[20px] border-0 bg-card max-[760px]:rounded-[26px]">
          <div className="flex items-center justify-between border-b border-border px-8 py-4 text-[12px] font-medium text-muted-foreground max-[560px]:px-4">
            <span className="flex items-center gap-2">
              <i className="h-1.5 w-1.5 rounded-full bg-primary" />
              {day === TODAY ? "Today’s timeline" : dateLabel(day)}
            </span>
            <label className="flex items-center gap-2">
              Staff{" "}
              <Select value={staff} onValueChange={(value) => value && setStaff(value)} items={[{value: "all", label: "All staff"}, ...state.staff.map(s => ({value: s.id, label: s.name}))]}>
                <SelectTrigger aria-label="Filter timeline by staff" className="h-10 min-w-32 border-0 bg-muted px-3 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent alignItemWithTrigger={false}><SelectItem value="all">All staff</SelectItem>{state.staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
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
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            YOUR WEEK AT A GLANCE
          </p>
          <h1 className="mt-2 text-[30px] font-medium tracking-tight text-foreground max-[760px]:text-[30px]">
            Your calendar.
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">View and manage appointments for the week.</p>
        </div>
        <Button
          className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/90"
          onClick={() => onNew({ date: day })}
        >
          <IconPlus size={17} />
          New booking
        </Button>
      </div>
      <Card className="overflow-hidden rounded-[20px] border-0 bg-card !gap-0 !py-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-0 border-border px-6 py-5 max-[760px]:px-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-card hover:text-foreground"
              aria-label="Previous week"
              onClick={() => setDay(addDays(day, -7))}
            >
              <IconChevronLeft size={18} />
            </Button>
            <DatePicker value={day} onChange={setDay}>{range}</DatePicker>
            <Button
              variant="ghost"
              size="icon"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-card hover:text-foreground"
              aria-label="Next week"
              onClick={() => setDay(addDays(day, 7))}
            >
              <IconChevronRight size={18} />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="ml-2 inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-3 text-[12px] font-semibold text-foreground transition hover:border-border"
              onClick={() => setDay(TODAY)}
            >
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select value={staff} onValueChange={(value) => value && setStaff(value)} items={[{value: "all", label: "All staff"}, ...state.staff.map(s => ({value: s.id, label: s.name}))]}>
                <SelectTrigger aria-label="Filter calendar by staff" className="h-10 min-w-32 border-0 bg-muted px-3 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent alignItemWithTrigger={false}><SelectItem value="all">All staff</SelectItem>{state.staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            <SegmentedControl
              options={["Week", "Day"]}
              value={mode}
              onChange={setMode}
            />
          </div>
        </div>
        <div className="max-h-[min(930px,calc(100vh-285px))] overflow-auto max-[760px]:max-h-[min(800px,calc(100vh-280px))]">
          <div className="grid min-w-[910px] [grid-template-columns:56px_repeat(7,minmax(122px,1fr))]">
            <div className="sticky top-0 z-30 flex h-[72px] items-center justify-center border-b-0 border-border bg-card text-[12px] font-semibold text-muted-foreground">
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
                  className={`sticky top-0 z-30 flex h-[72px] flex-col items-center justify-center border-b-0 border-l-0 border-border text-[12px] transition hover:bg-muted [box-shadow:inset_-1px_0_var(--border)] ${
                    isToday ? "bg-background text-foreground" : "bg-card text-muted-foreground"
                  }`}
                  onClick={() => {
                    setDay(date);
                    setMode("Day");
                  }}
                  aria-label={`Show ${dateLabel(date)} in day view`}
                >
                  <span className="text-[12px]">
                    {new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </span>
                  <strong
                    className={`my-1 flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold ${
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {Number(date.slice(8))}
                  </strong>
                  <small className="text-[12px] text-muted-foreground">
                    {count
                      ? `${count} booking${count > 1 ? "s" : ""}`
                      : "Open day"}
                  </small>
                </button>
              );
            })}
            <div
              className="relative border-r-0 border-border bg-card"
              style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}
            >
              {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                <span
                  key={i}
                  className={`absolute right-2 text-[12px] font-medium text-muted-foreground ${
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
                  className={`relative border-r-0 border-border [box-shadow:inset_-1px_0_var(--border)] [background-image:repeating-linear-gradient(to_bottom,var(--border)_0,var(--border)_1px,transparent_1px,transparent_78px)] ${
                    isToday ? "bg-background" : hours.closed ? "bg-background" : "bg-card"
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
                          className="absolute z-0 flex w-full items-center justify-center border-0 border-dashed border-border text-foreground opacity-0 transition hover:bg-muted hover:opacity-100 disabled:hover:bg-transparent disabled:hover:opacity-0"
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
                          <IconPlus size={15} className="h-5 w-5 rounded-full bg-card p-0.5" />
                        </button>
                      );
                    },
                  )}
                  {hours.closed && (
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
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
                        className={`absolute z-10 overflow-hidden rounded-[9px] border-0 p-2 text-left transition hover:z-20 hover:bg-muted ${
                          isCompleted
                            ? "bg-muted text-muted-foreground"
                            : isPending
                              ? "bg-warning-surface text-warning"
                              : "bg-accent text-primary"
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
                        <small className={`block overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-medium ${isPending ? "text-warning" : "text-muted-foreground"}`}>
                          {time(booking.startTime)} – {time(booking.endTime)}
                        </small>
                        <strong className={`mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-semibold leading-[1.3] ${isCompleted ? "line-through" : ""}`}>
                          {service.name}
                        </strong>
                        {minutes >= 60 && (
                          <span className={`mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-[12px] ${isPending ? "text-warning" : "text-foreground"}`}>
                            {customer.name}
                          </span>
                        )}
                        {minutes >= 120 && (
                          <em className="mt-2 block overflow-hidden text-ellipsis whitespace-nowrap text-[12px] not-italic text-muted-foreground">
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
        <div className="flex flex-wrap items-center gap-5 border-0 border-border px-6 py-4 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-[2px] bg-primary" />
            Confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-[2px] bg-[#dba9a3]" />
            Needs attention
          </span>
          <p className="ml-auto text-muted-foreground max-[760px]:ml-0">Click an open time to add a reservation · All times WAT</p>
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
        eyebrow="BOOKING MANAGEMENT"
        title="Bookings"
        description="Search bookings, check payment status, and manage appointments."
        action={
          <Button
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/90"
            onClick={() => onNew()}
          >
            <IconPlus size={18} />
            New booking
          </Button>
        }
      />
      <section className="table-panel">
        <div className="table-toolbar">
          <div className="flex flex-wrap items-center gap-1 max-[560px]:overflow-x-auto">
            {["Upcoming", "Needs attention", "Past", "Cancelled", "All"].map(
              (f) => {
                const isActive = filter === f;
                return (
                  <button
                    key={f}
                    className="table-filter"
                    aria-pressed={isActive}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                );
              },
            )}
          </div>
          <div className="table-search">
            <IconSearch
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search reservations"
              placeholder="Name, phone or booking code"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-transparent bg-muted pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground shadow-none transition focus-visible:border-border focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
        <DataTable label="Reservations">
          <thead><tr><th scope="col">Customer / booking</th><th scope="col">Service</th><th scope="col">Time</th><th scope="col">Specialist</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {dates.map((d) => (
              <Fragment key={d}>
                <tr className="table-group"><th colSpan={6} scope="rowgroup"><span className="font-medium text-foreground">{d === TODAY ? "Today · " : ""}{dateLabel(d)}</span></th></tr>
                {bookings.filter((b) => b.startTime.startsWith(d)).map((b) => {
                  const customer = state.customers.find((c) => c.id === b.customerId);
                  const service = state.services.find((s) => s.id === b.serviceId);
                  const staff = state.staff.find((s) => s.id === b.staffId);
                  return <tr key={b.id}>
                    <td><span className="table-primary">{customer?.name}</span><span className="table-secondary font-mono">{b.code}</span></td>
                    <td><span className="table-primary">{service?.name}</span><span className="table-secondary">{service ? duration(service.duration) : ""}</span></td>
                    <td className="whitespace-nowrap tabular-nums">{time(b.startTime)}<span className="table-secondary">until {time(b.endTime)}</span></td>
                    <td><span className="flex items-center gap-2"><Avatar name={staff?.name ?? "Unassigned"} src={staff?.avatarUrl} /><span>{staff?.name ?? "Unassigned"}</span></span></td>
                    <td><BookingStatus status={b.status} /></td>
                    <td className="text-right"><button className="table-action" onClick={() => onBooking(b)} aria-label={`View reservation ${b.code}`}>View <IconChevronRight size={15} /></button></td>
                  </tr>;
                })}
              </Fragment>
            ))}
          </tbody>
        </DataTable>
        {!bookings.length && (
          <EmptyState
            title="No bookings found"
            description="Try another filter or search, or make a new reservation."
            action={query || filter !== "All" ? <Button variant="outline" onClick={() => { setQuery(""); setFilter("All"); }}>Clear filters</Button> : <Button onClick={() => onNew()}>New booking</Button>}
          />
        )}
        <TableSummary count={bookings.length} noun="reservation" />
      </section>
    </>
  );
}
