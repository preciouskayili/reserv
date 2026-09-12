"use client";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconCheck,
  IconChevronRight,
  IconCopy,
  IconFlower,
  IconScissors,
  IconSparkles,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import { toast } from "sonner";
import {
  type Booking,
  type BookingStatus as Status,
  type Service,
  duration,
  initials,
  money,
  time,
} from "@/lib/model";
import { useStore } from "@/lib/store";
import { GoogleLocationCard } from "./google-map";
import type { ReactNode } from "react";

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-baseline font-semibold leading-none text-[#1e1e1e] tracking-[-0.085em] ${
        small ? "text-[19px]" : "text-[30px]"
      }`}
      aria-label="Reserv home"
    >
      reserv
      <span className="ml-[2px] h-[5px] w-[5px] rounded-full bg-[#999999]" />
    </Link>
  );
}
export function StudioMark({ large = false }: { large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center bg-[#ececf0] text-[#4e4e52] ${
        large ? "h-14 w-14 rounded-[18px]" : "h-9 w-9 rounded-xl"
      }`}
    >
      <IconFlower stroke={1.1} size={large ? 28 : 20} />
    </span>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header mb-9 flex flex-wrap items-end justify-between gap-4 max-[760px]:mb-6">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a0a0a0]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 text-[clamp(36px,4vw,55px)] font-medium leading-[1.09] tracking-[-0.062em] text-[#1e1e20] max-[760px]:text-[39px] max-[560px]:text-[34px]">
          {title}
        </h1>
        {description && (
          <p className="page-description mt-3 text-[14px] text-[#8a8a8a]">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="header-actions flex flex-wrap items-center gap-2 pb-1">
          {action}
        </div>
      )}
    </header>
  );
}
const statusColors: Record<Status, string> = {
  Confirmed: "bg-[#eef8f2] text-[#3b7a57]",
  Pending: "bg-[#fff4ec] text-[#ab765b]",
  "Needs confirmation": "bg-[#fff4ec] text-[#ab765b]",
  Cancelled: "bg-[#fcf0ef] text-[#aa6661]",
  Completed: "bg-[#f0f0f1] text-[#656569]",
  Rescheduled: "bg-[#f0f0f1] text-[#656569]",
};

export function BookingStatus({ status }: { status: Status }) {
  return (
    <Badge
      variant="secondary"
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border-0 px-2.5 py-1 text-[9px] font-semibold ${
        statusColors[status] || "bg-[#f1f1f1] text-[#787878]"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}
export function BookingCode({ code }: { code: string }) {
  return (
    <Card className="flex flex-row items-center justify-between gap-0 rounded-[18px] border-0 bg-[#f1f1f4] px-5 py-4 shadow-none">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#a0a0a0]">
          Booking code
        </p>
        <strong className="mt-1 block font-mono text-[20px] font-semibold tracking-[0.2em] text-[#323235]">
          {code}
        </strong>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-[#7c7c7c] transition hover:border-[#eaeaea] hover:bg-white hover:text-[#303030]"
        aria-label="Copy booking code"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            toast.success("Booking code copied");
          } catch {
            toast.info(`Your booking code is ${code}`);
          }
        }}
      >
        <IconCopy size={18} />
      </Button>
    </Card>
  );
}
export function Avatar({
  name,
  size = "",
  className = "",
}: {
  name: string;
  size?: "large" | "tiny" | string;
  className?: string;
}) {
  const sizeClasses =
    size === "large"
      ? "h-14 w-14 text-[18px]"
      : size === "tiny"
        ? "h-6 w-6 text-[8px]"
        : size
          ? size
          : "h-9 w-9 text-[11px]";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#ebebed] font-bold text-[#555558] ${sizeClasses} ${className}`}
    >
      {initials(name)}
    </span>
  );
}
export function ServiceIcon({
  serviceId,
  size = 20,
}: {
  serviceId: string;
  size?: number;
}) {
  const Icon = ["nails", "pedicure"].includes(serviceId)
    ? IconSparkles
    : IconScissors;
  return <Icon size={size} stroke={1.5} />;
}
export function ActionCard({
  icon: Icon,
  label,
  onClick,
  danger,
  href,
}: {
  icon: TablerIcon;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  href?: string;
}) {
  const content = (
    <>
      <Icon size={24} stroke={1.6} />
      <span>{label}</span>
    </>
  );
  const baseClasses = `flex min-h-[145px] flex-col items-center justify-center gap-2 rounded-[28px] border-0 px-2 text-[18px] font-medium tracking-[-0.04em] transition max-[760px]:min-h-[110px] max-[760px]:rounded-[20px] max-[760px]:text-[13px] max-[560px]:min-h-[95px] max-[560px]:rounded-[17px] max-[560px]:text-[10px] ${
    danger
      ? "bg-[#faeeee] text-[#b34d4a] hover:bg-[#f6e4e4]"
      : "bg-[#f1f1f4] text-[#313134] hover:bg-[#efeff1]"
  }`;
  return href ? (
    <a href={href} className={baseClasses}>
      {content}
    </a>
  ) : (
    <Button
      variant="secondary"
      className={`!h-auto !w-full !p-0 ${baseClasses}`}
      onClick={onClick}
    >
      {content}
    </Button>
  );
}
export function Modal({
  title,
  description,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={`rounded-[28px] border-0 bg-white p-7 shadow-[0_30px_70px_-20px_#00000033] max-[560px]:rounded-[22px] max-[560px]:p-5 ${
          wide ? "max-w-[650px]" : "max-w-[520px]"
        }`}
      >
        <DialogTitle className="pr-8 text-[26px] font-medium leading-tight tracking-[-0.055em] text-[#202022]">
          {title}
        </DialogTitle>
        <DialogDescription className="text-[12px] text-[#8e8e8e]">
          {description || "Manage the details below."}
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl p-8 text-center text-[#a0a0a0]">
      <IconFlower size={32} stroke={1.2} />
      <h3 className="mt-4 text-[17px] font-semibold text-[#343434]">{title}</h3>
      <p className="mt-1 max-w-[270px] text-[12px] leading-5 text-[#949494]">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as T)}>
      <TabsList className="flex gap-1 rounded-full border-0 bg-[#efeff1] p-1">
        {options.map((option) => (
          <TabsTrigger
            key={option}
            value={option}
            className="rounded-full border-0 px-4 py-1.5 text-[11px] font-semibold text-[#808084] transition data-active:bg-white data-active:text-[#252527] data-active:shadow-[0_2px_8px_#0000000d]"
          >
            {option}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
export function BookingCard({
  booking,
  onClick,
  compact = false,
}: {
  booking: Booking;
  onClick: () => void;
  compact?: boolean;
}) {
  const { state } = useStore();
  const service = state.services.find((s) => s.id === booking.serviceId)!;
  const customer = state.customers.find((c) => c.id === booking.customerId)!;
  const staff = state.staff.find((s) => s.id === booking.staffId)!;
  return (
    <Card className="rounded-[24px] border-0 bg-white p-0 shadow-none">
      <button
        className={`flex w-full items-start gap-4 rounded-[24px] p-5 text-left transition hover:bg-[#fafafc] ${
          compact ? "p-3.5" : ""
        } ${booking.status === "Completed" ? "opacity-75" : ""}`}
        onClick={onClick}
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#ebebed] text-[#555558]">
          <ServiceIcon serviceId={service.id} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[14px] font-semibold tracking-[-0.025em] text-[#252528] max-[560px]:text-[12px]">
              {service.name}
            </h3>
            <BookingStatus status={booking.status} />
          </div>
          <p className="mt-1 text-[12px] text-[#8a8a8a]">
            {customer.name}
            <span className="px-2 text-[#bababa]">·</span>
            {duration(service.duration)}
          </p>
          {!compact && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#f1f1f1] pt-3 text-[10px] text-[#909090] max-[560px]:mt-2">
              <span>
                <span className="mr-1.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#ebebed] text-[7px] font-bold text-[#555558]">
                  {staff.initials}
                </span>
                with {staff.name}
              </span>
              <span>
                {time(booking.startTime)} – {time(booking.endTime)}
              </span>
            </div>
          )}
        </div>
        <IconChevronRight
          size={18}
          className="mt-3 shrink-0 text-[#aeaeae]"
        />
      </button>
    </Card>
  );
}
export function ServiceCard({
  service,
  action,
}: {
  service: Service;
  action?: ReactNode;
}) {
  const { state } = useStore();
  return (
    <Card
      className={`flex min-h-[230px] flex-col rounded-[28px] border-0 bg-[#f8f8fa] p-5 shadow-none ${
        !service.active ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#ebebed] text-[#555558]">
          <ServiceIcon serviceId={service.id} size={24} />
        </span>
        {!service.active && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f2f2] px-2.5 py-1 text-[10px] font-medium text-[#7b7b7b]">
            Hidden
          </span>
        )}
        {action}
      </div>
      <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.04em] text-[#252528]">
        {service.name}
      </h3>
      <p className="mt-2 flex-1 text-[11px] leading-[1.7] text-[#949494]">
        {service.description}
      </p>
      <div className="mt-5 flex items-center justify-between text-[17px] font-semibold tracking-[-0.04em] text-[#252528]">
        {money(service.price)}
        <span className="text-[10px] font-medium tracking-normal text-[#989898]">
          {duration(service.duration)}
        </span>
      </div>
      <div className="mt-4 flex justify-between gap-2 border-t border-[#ededf0] pt-3 text-[9px] text-[#a1a1a1]">
        <span>
          {service.staffIds
            .map((id) => state.staff.find((s) => s.id === id)?.name)
            .join(" & ")}
        </span>
        <span>
          {service.deposit ? `${money(service.deposit)} deposit` : "No deposit"}
        </span>
      </div>
    </Card>
  );
}
export function LocationCard() {
  return <GoogleLocationCard />;
}
export function BusinessHours() {
  const { state } = useStore();
  return (
    <div className="space-y-0">
      {state.business.hours.map((h) => (
        <div
          key={h.day}
          className={`flex items-center justify-between border-b border-[#f0f0f0] py-2.5 text-[10px] last:border-0 ${
            h.day === "Saturday" ? "font-semibold text-[#252527]" : ""
          }`}
        >
          <span className="flex items-center gap-1.5 text-[#8f8f8f]">
            {h.day}
            {h.day === "Saturday" && (
              <small className="rounded-full bg-[#eeeeee] px-1.5 py-0.5 text-[8px] font-medium text-[#767676]">
                Today
              </small>
            )}
          </span>
          <span className="font-semibold text-[#323235]">
            {h.closed
              ? "Closed"
              : `${time(`2026-09-12T${h.open}:00`)} – ${time(`2026-09-12T${h.close}:00`)}`}
          </span>
        </div>
      ))}
    </div>
  );
}
export function BookingActivityList({ booking }: { booking: Booking }) {
  return (
    <div className="mt-5">
      {booking.activity.map((item, idx) => (
        <div key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
          {idx < booking.activity.length - 1 && (
            <span className="absolute bottom-0 left-[13px] top-7 w-px bg-[#e7e7e7]" />
          )}
          <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1f1f1] text-[#7b7b7b]">
            <IconCheck size={12} />
          </span>
          <div>
            <strong className="block pt-0.5 text-[11px] font-semibold text-[#2d2d30]">
              {item.title}
            </strong>
            {item.detail && (
              <p className="mt-1 text-[11px] leading-5 text-[#88888b]">
                {item.detail}
              </p>
            )}
            <small className="mt-1 block text-[9px] text-[#afafaf]">
              {new Date(item.time).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              , {time(item.time)}{" "}
              <span>
                ·{" "}
                {item.actor === "owner"
                  ? "Studio"
                  : item.actor === "customer"
                    ? "Customer"
                    : "Receptionist"}
              </span>
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}
