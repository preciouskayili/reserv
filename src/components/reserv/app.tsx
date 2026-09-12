"use client";
import { ui } from "./tw";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  IconAdjustmentsHorizontal,
  IconArrowUpRight,
  IconBuildingStore,
  IconCalendarEvent,
  IconCalendarWeek,
  IconHeadphones,
  IconPlus,
  IconScissors,
  IconUsers,
} from "@tabler/icons-react";
import { useStore } from "@/lib/reserv/store";
import type { Booking } from "@/lib/reserv/model";
import { Avatar, Brand, EmptyState } from "./shared";
import { BookingFlow, type BookingPreset } from "./booking-flow";
import { CalendarPage, BookingsPage } from "./schedule";
import { BookingDetails } from "./booking-details";
import { AgentPage, BusinessProfilePage, CustomersPage, ServicesPage, SettingsPage } from "./manage";
import { PublicProfile, ReservationLookup } from "./public";
const navigation = [{ name: "Calendar", path: "/", icon: IconCalendarEvent }, { name: "Bookings", path: "/bookings", icon: IconCalendarWeek }, { name: "Customers", path: "/customers", icon: IconUsers }, { name: "Services", path: "/services", icon: IconScissors }, { name: "Business profile", path: "/business-profile", icon: IconBuildingStore }, { name: "Agent", path: "/agent", icon: IconHeadphones }, { name: "Settings", path: "/settings", icon: IconAdjustmentsHorizontal }];
export function ReservApp() {
  const pathname = usePathname(); const router = useRouter(); const { state } = useStore(); const [newBooking, setNewBooking] = useState<BookingPreset | null>(null);
  const onBooking = (booking: Booking) => router.push(`/bookings/${booking.id}`); const onNew = (preset: BookingPreset = {}) => setNewBooking(preset);
  if (pathname === `/b/${state.business.slug}`) return <PublicProfile />;
  if (pathname === "/reservation" || pathname.startsWith("/r/")) return <ReservationLookup key={pathname} code={pathname.startsWith("/r/") ? pathname.split("/")[2] : undefined} />;
  const current = navigation.find(n => n.path === pathname || n.path !== "/" && pathname.startsWith(`${n.path}/`));
  let page;
  if (pathname === "/") page = <CalendarPage onNew={onNew} onBooking={onBooking} />;
  else if (pathname === "/bookings") page = <BookingsPage onNew={onNew} onBooking={onBooking} />;
  else if (pathname.startsWith("/bookings/")) { const booking = state.bookings.find(b => b.id === pathname.split("/")[2]); page = booking ? <BookingDetails key={booking.id} booking={booking} /> : <EmptyState title={state.loaded ? "Reservation not found." : "Finding your reservation…"} description="Your reservations are saved in this browser’s demo workspace." action={<Link className={"button inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"} href="/bookings">All reservations</Link>} />; }
  else if (pathname === "/customers") page = <CustomersPage onNew={onNew} onBooking={onBooking} />;
  else if (pathname === "/services") page = <ServicesPage />;
  else if (pathname === "/business-profile") page = <BusinessProfilePage key={String(state.loaded)} />;
  else if (pathname === "/agent") page = <AgentPage />;
  else if (pathname === "/settings") page = <SettingsPage key={String(state.loaded)} />;
  else page = <EmptyState title="A little off the beaten path." description="Let’s get you back to your studio." action={<Link className={"button primary inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"} href="/">Back to calendar</Link>} />;
  return <div className={"owner-shell min-h-screen bg-[#f4f4f5] text-[#202022] [&_.brand-dot]:bg-[#1d1d1e]"}><header className={"owner-topbar relative flex h-[72px] items-center justify-between border-[#e5e5e7] px-9 max-[760px]:h-16 max-[760px]:px-4 border-0 bg-[#f2f2f4]"}><div className={"owner-brand flex items-center gap-4 [&_.brand]:text-[26px] [&_.brand]:text-[#151516] [&_.brand-dot]:bg-[#151516]"}><Brand /><span className={"owner-divider h-5 w-px bg-[#d5d5d7] max-[760px]:hidden"} /><Link href={`/b/${state.business.slug}`} className={"owner-studio flex items-center gap-1.5 text-[11px] font-medium text-[#6d6d70] hover:text-[#171719] max-[760px]:hidden"}>{state.business.name}<IconArrowUpRight size={13} /></Link></div><div className={"owner-top-actions flex items-center gap-4"}><span className={"owner-timezone text-[10px] text-[#9b9b9e] max-[760px]:hidden"}>WAT · 10:15 AM</span><button aria-label="New booking" className={"owner-plus flex h-8 w-8 items-center justify-center rounded-full bg-[#1e1e20] text-white transition hover:bg-[#444447]"} onClick={() => onNew()}><IconPlus size={19} /></button><Link href="/settings" aria-label="Settings"><Avatar name={state.settings.owner} size="tiny" /></Link></div></header><nav className={"owner-nav mx-auto flex h-[56px] max-w-[1440px] items-center justify-center gap-1 overflow-x-auto border-[#e7e7e9] px-5 max-[1023px]:justify-start max-[760px]:h-12 max-[760px]:px-3 border-0 bg-[#f2f2f4]"} aria-label="Main navigation">{navigation.map(({ name, path, icon: Icon }) => <Link key={path} href={path} aria-current={current?.path === path ? "page" : undefined} className={ui(`owner-nav-link ${current?.path === path ? "active" : ""}`)}><Icon size={15} stroke={1.8} />{name}</Link>)}</nav><main className={"owner-main mx-auto max-w-[1440px] px-10 pb-16 pt-10 max-[1023px]:px-6 max-[760px]:px-4 max-[760px]:pt-6"} key={pathname}>{page}</main>{newBooking && <BookingFlow preset={newBooking} onClose={() => setNewBooking(null)} />}</div>;
}
