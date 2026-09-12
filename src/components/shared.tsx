"use client";
import { ui } from "./tw";
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
} from "@/lib/reserv/model";
import { useStore } from "@/lib/reserv/store";
import { GoogleLocationCard } from "./google-map";
import type { ReactNode } from "react";

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/"
      className={ui(`brand ${small ? "small" : ""}`)}
      aria-label="Reserv home"
    >
      reserv
      <span
        className={
          "brand-dot ml-[2px] h-[5px] w-[5px] rounded-full bg-[#999999]"
        }
      />
    </Link>
  );
}
export function StudioMark({ large = false }: { large?: boolean }) {
  return (
    <span className={ui(`studio-mark ${large ? "large" : ""}`)}>
      <IconFlower stroke={1.1} />
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
    <header
      className={
        "page-header mb-9 flex flex-wrap items-end justify-between gap-4 [&_h1]:mt-3 [&_h1]:text-[clamp(36px,4vw,55px)] [&_h1]:leading-[1.09] [&_h1]:font-medium [&_h1]:tracking-[-0.062em] max-[760px]:mb-6 max-[760px]:[&_h1]:text-[39px] max-[560px]:[&_h1]:text-[34px] [&_h1]:text-[#1e1e20]"
      }
    >
      <div>
        {eyebrow && (
          <p
            className={
              "eyebrow text-[10px] font-semibold tracking-[0.17em] text-[#a0a0a0] uppercase"
            }
          >
            {eyebrow}
          </p>
        )}
        <h1>{title}</h1>
        {description && (
          <p className={"page-description mt-3 text-[14px] text-[#8a8a8a]"}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <div
          className={"header-actions flex flex-wrap items-center gap-2 pb-1"}
        >
          {action}
        </div>
      )}
    </header>
  );
}
export function BookingStatus({ status }: { status: Status }) {
  return (
    <Badge
      variant="secondary"
      className={ui(
        `status status-${status.toLowerCase().replaceAll(" ", "-")} !border-0`,
      )}
    >
      <span />
      {status}
    </Badge>
  );
}
export function BookingCode({ code }: { code: string }) {
  return (
    <Card
      className={
        "booking-code !flex-row !gap-0 !border-0 !py-3 shadow-[0_10px_24px_-22px_#00000020] flex items-center justify-between rounded-[15px] border-dashed px-4 py-3.5 [&_strong]:mt-1 [&_strong]:block [&_strong]:font-mono [&_strong]:text-[20px] [&_strong]:font-semibold [&_strong]:tracking-[0.2em] [&_.eyebrow]:text-[8px] border-[#dcdcdf] [&_strong]:text-[#323235] border-0 bg-[#f1f1f4]"
      }
    >
      <div>
        <p
          className={
            "eyebrow text-[10px] font-semibold tracking-[0.17em] text-[#a0a0a0] uppercase"
          }
        >
          Booking code
        </p>
        <strong>{code}</strong>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={
          "icon-button inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-[#7c7c7c] transition hover:border-[#eaeaea] hover:bg-white hover:text-[#303030]"
        }
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
export function Avatar({ name, size = "" }: { name: string; size?: string }) {
  return <span className={ui(`avatar ${size}`)}>{initials(name)}</span>;
}
export function ServiceIcon({
  serviceId,
  size = 20,
}: {
  serviceId: string;
  size?: number;
}) {
  const Icon = ["nails", "pedicure"].includes(serviceId) ? IconSparkles : IconScissors;
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
      <Icon size={23} stroke={1.6} />
      <span>{label}</span>
    </>
  );
  return href ? (
    <a href={href} className={ui(`action-card ${danger ? "danger" : ""}`)}>
      {content}
    </a>
  ) : (
    <Button
      variant="secondary"
      className={ui(
        `action-card !h-auto !flex-col !border-0 ${danger ? "danger" : ""}`,
      )}
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
        className={ui(`reserv-modal ${wide ? "reserv-modal-wide" : ""}`)}
      >
        <DialogTitle
          className={
            "reserv-modal-title pr-8 text-[26px] leading-tight font-medium tracking-[-0.055em]"
          }
        >
          {title}
        </DialogTitle>
        <DialogDescription>
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
    <div
      className={
        "empty-state flex min-h-[250px] flex-col items-center justify-center rounded-2xl p-8 text-center text-[#a0a0a0] [&_h3]:mt-4 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:text-[#343434] [&_p]:mt-1 [&_p]:max-w-[270px] [&_p]:text-[12px] [&_p]:leading-5 [&_p]:text-[#949494] [&_.button]:mt-5"
      }
    >
      <IconFlower size={32} stroke={1.2} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
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
      <TabsList
        className={
          "segmented !rounded-full !border-0 !bg-[#efeff1] !p-1 flex gap-1 rounded-lg bg-[#f3f3f3] p-1 [&_button]:min-w-12 [&_button]:rounded-md [&_button]:px-3 [&_button]:py-1.5 [&_button]:text-[10px] [&_button]:font-semibold [&_button]:text-[#969696] [&_button.selected]:bg-white [&_button.selected]:text-[#343434] [&_button.selected]:shadow-[0_1px_3px_#ddd]"
        }
      >
        {options.map((option) => (
          <TabsTrigger
            key={option}
            value={option}
            className={
              "!rounded-full !border-0 !px-4 !text-[11px] data-active:!bg-white data-active:!text-[#252527] data-active:shadow-[0_3px_12px_#00000010]"
            }
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
    <Card
      className={
        "!gap-0 !rounded-[24px] !border-0 !py-0 shadow-[0_14px_32px_-26px_#00000024]"
      }
    >
      <button
        className={ui(
          `booking-card !border-0 ${compact ? "compact" : ""} ${booking.status === "Completed" ? "is-completed" : ""}`,
        )}
        onClick={onClick}
      >
        <span
          className={
            "service-symbol inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#ebebed] text-[#555558]"
          }
        >
          <ServiceIcon serviceId={service.id} />
        </span>
        <div
          className={
            "booking-card-main min-w-0 flex-1 [&_>_p]:mt-1 [&_>_p]:text-[12px] [&_>_p]:text-[#8a8a8a]"
          }
        >
          <div
            className={
              "booking-card-title flex flex-wrap items-center justify-between gap-2 [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:tracking-[-0.025em] max-[560px]:[&_h3]:text-[12px] max-[560px]:[&_.status]:text-[8px]"
            }
          >
            <h3>{service.name}</h3>
            <BookingStatus status={booking.status} />
          </div>
          <p>
            {customer.name}
            <span className={"middle-dot px-2 text-[#bababa]"}>·</span>
            {duration(service.duration)}
          </p>
          {!compact && (
            <div
              className={
                "booking-card-bottom mt-4 flex flex-wrap items-center justify-between gap-2 border-[#f1f1f1] pt-3 text-[10px] text-[#909090] max-[560px]:mt-2 border-0"
              }
            >
              <span>
                <span
                  className={
                    "mini-avatar mr-1.5 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full text-[7px] font-bold bg-[#ebebed] text-[#555558]"
                  }
                >
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
          className={"card-chevron mt-3 shrink-0 text-[#aeaeae]"}
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
      className={ui(
        `service-card !gap-0 !rounded-[28px] !border-0 !p-5 shadow-[0_16px_36px_-28px_#00000024] ${!service.active ? "disabled-service" : ""}`,
      )}
    >
      <div className={"row-between flex items-center justify-between gap-4"}>
        <span
          className={
            "service-symbol inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#ebebed] text-[#555558]"
          }
        >
          <ServiceIcon serviceId={service.id} size={24} />
        </span>
        {!service.active && (
          <span
            className={
              "soft-label inline-flex items-center gap-1.5 rounded-full bg-[#f2f2f2] px-2.5 py-1 text-[10px] font-medium text-[#7b7b7b]"
            }
          >
            Hidden
          </span>
        )}
        {action}
      </div>
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <div
        className={
          "service-price mt-5 flex items-center justify-between text-[17px] font-semibold tracking-[-0.04em] [&_span]:text-[10px] [&_span]:font-medium [&_span]:tracking-normal [&_span]:text-[#989898]"
        }
      >
        {money(service.price)}
        <span>{duration(service.duration)}</span>
      </div>
      <div
        className={
          "service-card-footer mt-4 flex justify-between gap-2 border-[#f0f0f0] pt-3 text-[9px] text-[#a1a1a1] border-0"
        }
      >
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
    <div
      className={
        "hours-list [&_>_div]:flex [&_>_div]:items-center [&_>_div]:justify-between [&_>_div]:border-b [&_>_div]:border-[#f0f0f0] [&_>_div]:py-2.5 [&_>_div]:text-[10px] [&_>_div:last-child]:border-0 [&_>_div_>_span:first-child]:text-[#8f8f8f] [&_>_div_>_span:last-child]:font-semibold [&_small]:ml-1.5 [&_small]:rounded-full [&_small]:bg-[#eeeeee] [&_small]:px-1.5 [&_small]:py-0.5 [&_small]:text-[8px] [&_small]:text-[#767676]"
      }
    >
      {state.business.hours.map((h) => (
        <div
          key={h.day}
          className={ui(h.day === "Saturday" ? "today-hours" : "")}
        >
          <span>
            {h.day}
            {h.day === "Saturday" && <small>Today</small>}
          </span>
          <span>
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
    <div className={"activity-list mt-5"}>
      {booking.activity.map((item) => (
        <div
          className={
            "activity-item relative flex gap-3 pb-6 [&:not(:last-child)::before]:absolute [&:not(:last-child)::before]:bottom-0 [&:not(:last-child)::before]:left-[13px] [&:not(:last-child)::before]:top-7 [&:not(:last-child)::before]:w-px [&:not(:last-child)::before]:bg-[#e7e7e7] [&:not(:last-child)::before]:content-[''] [&_strong]:block [&_strong]:pt-0.5 [&_strong]:text-[11px] [&_strong]:font-semibold [&_p]:mt-1 [&_small]:mt-2 [&_small]:block [&_small]:text-[9px] [&_small]:text-[#afafaf]"
          }
          key={item.id}
        >
          <span
            className={
              "activity-dot relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1f1f1] text-[#7b7b7b]"
            }
          >
            <IconCheck size={12} />
          </span>
          <div>
            <strong>{item.title}</strong>
            {item.detail && <p>{item.detail}</p>}
            <small>
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
