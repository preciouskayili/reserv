export type BookingStatus =
  | "Confirmed"
  | "Pending"
  | "Needs confirmation"
  | "Cancelled"
  | "Completed"
  | "Rescheduled";
export interface StaffMember {
  id: string;
  name: string;
  role: string;
  initials: string;
}
export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  deposit: number;
  staffIds: string[];
  active: boolean;
}
export interface Customer {
  id: string;
  name: string;
  phone: string;
  notes: string;
}
export interface BookingActivity {
  id: string;
  title: string;
  detail?: string;
  time: string;
  actor: "owner" | "customer" | "agent";
}
export interface Booking {
  id: string;
  code: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes: string;
  createdAt: string;
  reminder?: string;
  totalAmount?: number;
  requiredAmount?: number;
  activity: BookingActivity[];
}
export interface BusinessHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}
export interface AvailabilityRule {
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  slotMinutes: number;
}
export interface Business {
  id: string;
  name: string;
  slug: string;
  owner: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  hours: BusinessHours[];
  bookingPolicy: string;
  cancellationPolicy: string;
  depositPolicy: string;
  faqs: { question: string; answer: string }[];
  rules: AvailabilityRule;
}
export interface AgentActivity {
  id: string;
  title: string;
  detail: string;
  time: string;
  kind: "confirmed" | "rescheduled" | "created";
}
export interface CallPreferences {
  enabled: boolean;
  reminderMinutes: number;
  unpaidEnabled: boolean;
  unpaidIntervalMinutes: number;
}
export const DEFAULT_CALL_PREFERENCES: CallPreferences = {
  enabled: false,
  reminderMinutes: 120,
  unpaidEnabled: false,
  unpaidIntervalMinutes: 1440,
};
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: "gateway" | "transfer";
  status: "review" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  receiptId?: string;
  receiptName?: string;
}
export interface AppState {
  business: Business;
  services: Service[];
  staff: StaffMember[];
  customers: Customer[];
  bookings: Booking[];
  payments?: Payment[];
  agentActivity: AgentActivity[];
  settings: { reminders: boolean; confirmations: boolean; owner: string; calls?: CallPreferences };
  loaded: boolean;
}
// A fixed demo clock keeps the seeded schedule meaningful on every visit.
export const TODAY = "2026-09-12";
export const NOW = "2026-09-12T10:15:00";
export const money = (value: number) => `₦${value.toLocaleString("en-NG")}`;
export const duration = (mins: number) =>
  mins >= 60
    ? `${Math.floor(mins / 60)} hr${mins >= 120 ? "s" : ""}${mins % 60 ? ` ${mins % 60} min` : ""}`
    : `${mins} min`;
export const time = (value: string) =>
  new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
export const dateLabel = (value: string, year = false) =>
  new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(year ? { year: "numeric" } : {}),
  });
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function addDays(value: string, days: number) {
  const d = new Date(`${value.slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}
export function endTime(start: string, minutes: number) {
  const d = new Date(start);
  d.setMinutes(d.getMinutes() + minutes);
  return `${dateKey(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
}
export const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
export const getReservationByCode = (bookings: Booking[], code: string) =>
  bookings.find((b) => b.code === code.trim().toUpperCase());
export const getReservationsByPhone = (state: AppState, phone: string) => {
  const normalized = phone.replace(/\D/g, "");
  const ids = state.customers
    .filter((c) => c.phone.replace(/\D/g, "") === normalized)
    .map((c) => c.id);
  return state.bookings.filter((b) => ids.includes(b.customerId));
};
export function generateCode(bookings: Booking[]) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code: string;
  do {
    code = Array.from(
      crypto.getRandomValues(new Uint8Array(6)),
      (n) => alphabet[n % alphabet.length],
    ).join("");
  } while (bookings.some((b) => b.code === code));
  return code;
}
export function availableSlots(
  state: AppState,
  serviceId: string,
  staffId: string,
  date: string,
  excludeId?: string,
) {
  const service = state.services.find((s) => s.id === serviceId);
  const hours =
    state.business.hours[(new Date(`${date}T12:00:00`).getDay() + 6) % 7];
  if (
    !service ||
    !service.staffIds.includes(staffId) ||
    !hours ||
    hours.closed ||
    date < TODAY ||
    date > addDays(TODAY, state.business.rules.maxAdvanceDays)
  )
    return [];
  const toMins = (v: string) =>
    Number(v.split(":")[0]) * 60 + Number(v.split(":")[1]);
  const slots: string[] = [];
  for (
    let m = toMins(hours.open);
    m + service.duration <= toMins(hours.close);
    m += state.business.rules.slotMinutes
  ) {
    const start = `${date}T${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`;
    const end = endTime(start, service.duration);
    if (
      new Date(start).getTime() <
      new Date(NOW).getTime() + state.business.rules.minNoticeMinutes * 60000
    )
      continue;
    if (
      !state.bookings.some(
        (b) =>
          b.id !== excludeId &&
          b.staffId === staffId &&
          b.status !== "Cancelled" &&
          b.startTime < end &&
          b.endTime > start,
      )
    )
      slots.push(start);
  }
  return slots;
}
