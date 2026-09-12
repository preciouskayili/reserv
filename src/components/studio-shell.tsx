"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconAdjustmentsHorizontal,
  IconArrowUpRight,
  IconBuildingStore,
  IconCalendarEvent,
  IconCalendarWeek,
  IconCreditCard,
  IconHeadphones,
  IconPlus,
  IconScissors,
  IconUsers,
} from "@tabler/icons-react";
import { useStore } from "@/lib/store";
import { Avatar, Brand } from "./shared";
import { BookingFlow, type BookingPreset } from "./booking-flow";

type BookingModalContextType = {
  openNewBooking: (preset?: BookingPreset) => void;
  closeBooking: () => void;
};

const BookingModalContext = createContext<BookingModalContextType>({
  openNewBooking: () => {},
  closeBooking: () => {},
});

export function useBookingModal() {
  return useContext(BookingModalContext);
}

const navigation = [
  { name: "Calendar", path: "/", icon: IconCalendarEvent },
  { name: "Bookings", path: "/bookings", icon: IconCalendarWeek },
  { name: "Payments", path: "/payments", icon: IconCreditCard },
  { name: "Customers", path: "/customers", icon: IconUsers },
  { name: "Services", path: "/services", icon: IconScissors },
  {
    name: "Business profile",
    path: "/business-profile",
    icon: IconBuildingStore,
  },
  { name: "Agent", path: "/agent", icon: IconHeadphones },
  { name: "Settings", path: "/settings", icon: IconAdjustmentsHorizontal },
];

export function StudioShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state } = useStore();
  const [newBooking, setNewBooking] = useState<BookingPreset | null>(null);

  const current = navigation.find(
    (n) =>
      n.path === pathname ||
      (n.path !== "/" && pathname.startsWith(`${n.path}/`)),
  );

  return (
    <BookingModalContext.Provider
      value={{
        openNewBooking: (preset = {}) => setNewBooking(preset),
        closeBooking: () => setNewBooking(null),
      }}
    >
      <div className="min-h-screen bg-background text-foreground lg:pl-[304px]">
        <aside className="fixed left-6 top-8 z-40 hidden max-h-[calc(100dvh-4rem)] w-[264px] flex-col overflow-y-auto px-3 py-2 lg:flex">
          <div className="px-3"><Brand /></div>
          <button onClick={() => setNewBooking({})} className="mt-9 flex h-10 items-center justify-center gap-2 rounded-full bg-primary text-[13px] font-medium text-white transition hover:bg-primary/90">
            <IconPlus size={17} /> New booking
          </button>
          <nav aria-label="Main navigation" className="mt-7 space-y-1">
            {navigation.map(({ name, path, icon: Icon }) => (
              <Link key={path} href={path} aria-current={current?.path === path ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] transition ${current?.path === path ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Icon size={19} stroke={1.6} />{name}
              </Link>
            ))}
          </nav>
          <Link href={`/b/${state.business.slug}`} className="mt-7 flex items-center gap-3 rounded-xl bg-transparent p-3 text-[12px] text-muted-foreground hover:bg-muted">
            <span className="min-w-0 flex-1"><strong className="block truncate font-medium text-foreground">{state.business.name}</strong><span className="mt-1 block">View studio page</span></span>
            <IconArrowUpRight size={15} />
          </Link>
        </aside>
        <header className="flex h-20 items-center justify-between px-8 max-lg:h-16 max-lg:px-5">
          <div className="lg:hidden"><Brand small /></div>
          <span className="hidden text-[12px] text-muted-foreground lg:block">Workspace <span className="mx-2 text-muted-foreground/40">/</span> <span className="text-foreground">{current?.name || "Booking details"}</span></span>
          <Link href="/settings" aria-label="Account settings" className="flex items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-3 text-[12px] text-muted-foreground">
            <Avatar name={state.settings.owner} size="h-7 w-7 text-[12px]" /> <span>{state.settings.owner.split(" ")[0]}</span>
          </Link>
        </header>
        <nav aria-label="Mobile navigation" className="flex gap-1 overflow-x-auto px-4 pb-4 lg:hidden">
          {navigation.map(({ name, path, icon: Icon }) => <Link key={path} href={path} aria-current={current?.path === path ? "page" : undefined} className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-[12px] ${current?.path === path ? "bg-accent text-primary" : "text-muted-foreground"}`}><Icon size={16} />{name}</Link>)}
          <button aria-label="New booking" onClick={() => setNewBooking({})} className="shrink-0 rounded-full bg-primary px-3 text-white"><IconPlus size={17} /></button>
        </nav>
        <main className={`mx-auto px-8 pb-16 pt-5 max-lg:px-5 max-lg:pt-3 ${pathname === "/business-profile" ? "max-w-[860px]" : "max-w-[1280px]"}`}>
          {children}
        </main>
        {newBooking && (
          <BookingFlow
            preset={newBooking}
            onClose={() => setNewBooking(null)}
          />
        )}
      </div>
    </BookingModalContext.Provider>
  );
}
