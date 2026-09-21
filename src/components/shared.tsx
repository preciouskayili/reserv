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
  IconCalendarEvent,
  IconCheck,
  IconChevronRight,
  IconCopy,
  IconClock,
  IconFlower,
  IconBuildingStore,
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
import { useState, type ReactNode } from "react";

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-baseline font-semibold leading-none text-foreground tracking-tight ${
        small ? "text-[19px]" : "text-[27px]"
      }`}
      aria-label="Reserv home"
    >
      reserv
      <span className="ml-[2px] h-[5px] w-[5px] rounded-full bg-primary" />
    </Link>
  );
}
export const studioIcons = { store: IconBuildingStore, flower: IconFlower, scissors: IconScissors, sparkles: IconSparkles };
export function StudioMark({ large = false }: { large?: boolean }) {
  const { state } = useStore();
  const Icon = studioIcons[state.business.icon ?? "store"];
  return <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-muted text-foreground ${large ? "h-14 w-14 rounded-[18px]" : "h-9 w-9 rounded-xl"}`}>
    {state.business.logoUrl ? <ProfileImage src={state.business.logoUrl} name={state.business.name} fallback={<Icon stroke={1.4} size={large ? 28 : 20} />} /> : <Icon stroke={1.4} size={large ? 28 : 20} />}
  </span>;
}
function ProfileImage({ src, name, fallback }: { src: string; name: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState<string | null>(null);
  // User-uploaded, bounded images; retain initials if a remote image becomes unavailable.
  // eslint-disable-next-line @next/next/no-img-element
  return failed === src ? fallback : <img src={src} alt={name} className="h-full w-full object-cover" onError={() => setFailed(src)} />;
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
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 text-[30px] font-medium leading-[1.15] tracking-tight text-foreground max-[560px]:text-[26px]">
          {title}
        </h1>
        {description && (
          <p className="page-description mt-3 text-[14px] text-muted-foreground">
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
  Confirmed: "bg-success-surface text-success",
  Pending: "bg-warning-surface text-warning",
  "Needs confirmation": "bg-warning-surface text-warning",
  Cancelled: "bg-danger-surface text-destructive",
  Completed: "bg-muted text-foreground",
  Rescheduled: "bg-muted text-foreground",
};

export function BookingStatus({ status }: { status: Status }) {
  return (
    <Badge
      variant="secondary"
      className={`status-pill ${
        statusColors[status] || "bg-muted text-muted-foreground"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}
export function BookingCode({ code }: { code: string }) {
  return (
    <Card className="flex flex-row items-center justify-between gap-0 rounded-[18px] border-0 bg-muted px-5 py-4 shadow-none">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Booking code
        </p>
        <strong className="mt-1 block font-mono text-[20px] font-semibold tracking-[0.08em] text-foreground">
          {code}
        </strong>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:border-border hover:bg-card hover:text-foreground"
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
  src,
  size = "",
  className = "",
}: {
  name: string;
  src?: string;
  size?: "large" | "tiny" | string;
  className?: string;
}) {
  const sizeClasses =
    size === "large"
      ? "h-14 w-14 text-[18px]"
      : size === "tiny"
        ? "h-6 w-6 text-[12px]"
        : size
          ? size
          : "h-9 w-9 text-[12px]";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-bold text-foreground ${sizeClasses} ${className}`}
    >
      {src ? <ProfileImage src={src} name={name} fallback={initials(name)} /> : initials(name)}
    </span>
  );
}
export function ReservationIcon({ size = 20 }: { size?: number }) {
  return <IconCalendarEvent size={size} stroke={1.5} />;
}
export function ServiceIcon({
  size = 20,
}: {
  size?: number;
  serviceId?: string;
}) {
  return <IconCalendarEvent size={size} stroke={1.5} />;
}
export function ActionCard({
  icon: Icon,
  label,
  onClick,
  danger,
  disabled = false,
  href,
}: {
  icon: TablerIcon;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  href?: string;
}) {
  const content = (
    <>
      <Icon size={24} className="size-6 shrink-0" stroke={1.6} />
      <span>{label}</span>
    </>
  );
  const baseClasses = `flex min-h-[104px] flex-col items-center justify-center gap-3 rounded-2xl border-0 px-3 text-[14px] font-medium transition max-[560px]:min-h-[92px] max-[560px]:text-[12px] ${
    danger
      ? "bg-danger-surface text-destructive hover:bg-destructive/10"
      : "bg-muted text-foreground hover:bg-muted"
  }`;
  return href ? (
    <a href={href} className={baseClasses}>
      {content}
    </a>
  ) : (
    <Button
      variant="secondary"
      disabled={disabled}
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
  busy = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  busy?: boolean;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        showCloseButton={!busy}
        aria-busy={busy || undefined}
        className={`rounded-[28px] border-0 bg-card p-9 shadow-none max-[560px]:rounded-[22px] max-[560px]:p-5 ${
          wide ? "sm:max-w-[820px]" : "sm:max-w-[660px]"
        }`}
      >
        <DialogTitle className="pr-10 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          {title}
        </DialogTitle>
        <DialogDescription className="-mt-1 mb-3 max-w-xl pr-8 text-[13px] leading-6 text-muted-foreground">
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
    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl p-8 text-center text-muted-foreground">
      <IconFlower size={32} stroke={1.2} />
      <h3 className="mt-4 text-[17px] font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1 max-w-[270px] text-[12px] leading-5 text-muted-foreground">
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
      <TabsList className="flex h-10 gap-1 rounded-xl border-0 bg-muted p-1">
        {options.map((option) => (
          <TabsTrigger
            key={option}
            value={option}
            className="rounded-lg border-0 px-4 py-1.5 text-[12px] font-semibold text-muted-foreground transition data-active:bg-card data-active:text-foreground data-active:shadow-none"
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
    <Card className="rounded-xl border-0 bg-card p-0 shadow-none">
      <button
        className={`flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-background ${
          compact ? "p-3" : ""
        } ${booking.status === "Completed" ? "opacity-75" : ""}`}
        onClick={onClick}
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-muted text-foreground">
          <ReservationIcon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-foreground max-[560px]:text-[12px]">
              {service.name}
            </h3>
            <BookingStatus status={booking.status} />
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {customer.name}
            <span className="px-2 text-muted-foreground">·</span>
            {duration(service.duration)}
          </p>
          {!compact && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-[12px] text-muted-foreground max-[560px]:mt-2">
              <span>
                <Avatar name={staff.name} src={staff.avatarUrl} size="h-[18px] w-[18px] text-[10px]" className="mr-1.5" />
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
          className="mt-3 shrink-0 text-muted-foreground"
        />
      </button>
    </Card>
  );
}
export function ServiceCard({
  service,
  action,
  footer,
  publicView = false,
}: {
  service: Service;
  action?: ReactNode;
  footer?: ReactNode;
  publicView?: boolean;
}) {
  const { state } = useStore();
  return (
    <Card
      className={`flex min-h-92 h-full flex-col gap-0 rounded-2xl border-0 p-6 shadow-none ${publicView ? "bg-muted" : "bg-card"}`}
    >
      <div className="flex flex-1 items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-foreground">
            {service.name}
          </h3>
          <p className="mt-2 max-w-lg text-[13px] leading-6 text-muted-foreground">
            {service.description}
          </p>
        </div>
        {action}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[16px] font-semibold text-foreground">
          {money(service.price)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <IconClock size={15} stroke={1.6} />
          {duration(service.duration)}
        </span>
        {!service.active && (
          <span className="rounded-full bg-muted px-2 py-1 text-[12px] text-muted-foreground">
            Hidden
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-[12px] text-muted-foreground">
        <span>
          {service.staffIds
            .map((id) => state.staff.find((s) => s.id === id)?.name)
            .join(" & ")}
        </span>
        <span>
          {service.deposit ? `${money(service.deposit)} deposit` : "No deposit"}
        </span>
      </div>
      {footer && (
        <div className="mt-5 rounded-xl bg-muted/70 px-3 py-2">{footer}</div>
      )}
    </Card>
  );
}
export function LocationCard() {
  return <GoogleLocationCard />;
}
export function BusinessHours({ hours }: { hours?: Array<{ day: string; open: string; close: string; closed: boolean }> } = {}) {
  const { state } = useStore();
  const list = hours || state.business.hours;
  return (
    <div className="space-y-0">
      {list.map((h) => (
        <div
          key={h.day}
          className={`flex items-center justify-between border-b border-border py-2.5 text-[12px] last:border-0 ${
            h.day === "Saturday" ? "font-semibold text-foreground" : ""
          }`}
        >
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {h.day}
            {h.day === "Saturday" && (
              <small className="rounded-full bg-muted px-1.5 py-0.5 text-[12px] font-medium text-muted-foreground">
                Today
              </small>
            )}
          </span>
          <span className="font-semibold text-foreground">
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
            <span className="absolute bottom-0 left-[13px] top-7 w-px bg-muted" />
          )}
          <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <IconCheck size={12} />
          </span>
          <div>
            <strong className="block pt-0.5 text-[12px] font-semibold text-foreground">
              {item.title}
            </strong>
            {item.detail && (
              <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
                {item.detail}
              </p>
            )}
            <small className="mt-1 block text-[12px] text-muted-foreground">
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
