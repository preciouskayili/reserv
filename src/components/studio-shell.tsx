"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconAdjustmentsHorizontal,
  IconArrowUpRight,
  IconBuildingStore,
  IconCalendarEvent,
  IconCalendarWeek,
  IconCheck,
  IconChevronDown,
  IconCreditCard,
  IconLogin,
  IconLogout,
  IconPlus,
  IconScissors,
  IconUsers,
} from "@tabler/icons-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { InlineError, PageLoading } from "./feedback";
import { Avatar, Brand, StudioMark } from "./shared";
import { BookingFlow, type BookingPreset } from "./booking-flow";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  { name: "Settings", path: "/settings", icon: IconAdjustmentsHorizontal },
];

export function StudioShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    state,
    workspaces,
    activeWorkspaceId,
    switchWorkspace,
    needsOnboarding,
  } = useStore();
  const { user, isAuthenticated, isLoading: authLoading, sessionError, retrySession, logout } = useAuth();
  const [newBooking, setNewBooking] = useState<BookingPreset | null>(null);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !sessionError && !isAuthenticated) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [authLoading, sessionError, isAuthenticated, pathname, router]);

  useEffect(() => { if (isAuthenticated && needsOnboarding) router.replace("/onboarding"); }, [isAuthenticated, needsOnboarding, router]);

  const current = navigation.find(
    (n) =>
      n.path === pathname ||
      (n.path !== "/" && pathname.startsWith(`${n.path}/`)),
  );

  if (sessionError) return <main className="mx-auto max-w-2xl px-5 py-16"><InlineError title="Connection error" message={sessionError} onRetry={retrySession} /><button onClick={logout} className="mt-4 text-sm font-medium text-primary">Sign in again</button></main>;
  if (authLoading || !isAuthenticated) return <PageLoading label="Checking your session…" />;

  if (needsOnboarding) return <PageLoading label="Opening workspace setup…" />;

  return (
    <BookingModalContext.Provider
      value={{
        openNewBooking: (preset = {}) => setNewBooking(preset),
        closeBooking: () => setNewBooking(null),
      }}
    >
      <div className="min-h-screen bg-background text-foreground lg:pl-[250px]">
        <aside className="fixed left-6 top-8 z-40 hidden max-h-[calc(100dvh-4rem)] w-54 flex-col overflow-y-auto px-3 py-2 lg:flex">
          <div className="px-3">
            <Brand />

            {/* Workspace Switcher */}
            <Popover open={workspaceDropdownOpen} onOpenChange={setWorkspaceDropdownOpen}>
              <PopoverTrigger
                className="mt-4 flex w-full items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2 text-left text-[12px] transition hover:bg-accent"
              >
                <StudioMark /><div className="min-w-0 flex-1">
                  <strong className="block truncate font-semibold text-foreground">
                    {state.business.name || "Select workspace"}
                  </strong>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    /b/{state.business.slug || "studio"}
                  </span>
                </div>
                <IconChevronDown size={14} className="shrink-0 text-muted-foreground" />
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={6}
                className="w-56 rounded-2xl border-0 bg-card p-1.5 shadow-none ring-0"
              >
                <div className="px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
                  Workspaces ({workspaces.length})
                </div>
                <div className="max-h-48 space-y-0.5 overflow-y-auto">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => {
                        if (ws.id !== activeWorkspaceId) {
                          void switchWorkspace(ws.id);
                        }
                        setWorkspaceDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[12px] transition ${
                        ws.id === activeWorkspaceId
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.id === activeWorkspaceId && (
                        <IconCheck size={14} className="shrink-0 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-1 border-t border-border/40 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspaceDropdownOpen(false);
                      router.push("/onboarding");
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] font-medium text-primary transition hover:bg-accent"
                  >
                    <IconPlus size={15} />
                    <span>New workspace</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <button
            onClick={() => setNewBooking({})}
            className="mt-6 flex h-10 items-center justify-center gap-2 rounded-full bg-primary text-[13px] font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <IconPlus size={17} /> New booking
          </button>
          <nav aria-label="Main navigation" className="mt-7 space-y-1">
            {navigation.map(({ name, path, icon: Icon }) => (
              <Link
                key={path}
                href={path}
                aria-current={current?.path === path ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] transition ${current?.path === path ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <Icon size={19} stroke={1.6} />
                {name}
              </Link>
            ))}
          </nav>
          <Link
            href={`/b/${state.business.slug}`}
            className="mt-7 flex items-center gap-3 rounded-xl p-3 text-[12px] text-muted-foreground bg-muted hover:bg-accent"
          >
            <span className="min-w-0 flex-1">
              <strong className="block truncate font-medium text-foreground">
                {state.business.name}
              </strong>
              <span className="mt-1 block">View studio page</span>
            </span>
            <IconArrowUpRight size={15} />
          </Link>
        </aside>
        <header
          className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-8 max-lg:h-16 max-lg:px-5"
        >
          <div className="flex items-center gap-2 lg:hidden">
            <Brand small />
            {workspaces.length > 0 && (
              <Popover>
                <PopoverTrigger
                  className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground"
                >
                  <span className="max-w-[110px] truncate">{state.business.name}</span>
                  <IconChevronDown size={12} className="text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={6}
                  className="w-52 rounded-2xl border-0 bg-card p-1.5 shadow-none ring-0"
                >
                  <div className="max-h-48 space-y-0.5 overflow-y-auto">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => void switchWorkspace(ws.id)}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-[12px] transition ${
                          ws.id === activeWorkspaceId
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        }`}
                      >
                        <span className="truncate">{ws.name}</span>
                        {ws.id === activeWorkspaceId && (
                          <IconCheck size={14} className="shrink-0 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 border-t border-border/40 pt-1">
                    <button
                      type="button"
                      onClick={() => router.push("/onboarding")}
                      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] font-medium text-primary transition hover:bg-accent"
                    >
                      <IconPlus size={15} />
                      <span>New workspace</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <span className="hidden text-[12px] text-muted-foreground lg:block">
            Workspace <span className="mx-2 text-muted-foreground/40">/</span>{" "}
            <span className="text-foreground">
              {current?.name || "Booking details"}
            </span>
          </span>
          {authLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/settings"
                aria-label="Account settings"
                className="flex items-center gap-2.5 rounded-full bg-card h-10 py-1.5 pl-1.5 pr-3 text-[12px] text-muted-foreground transition hover:text-foreground"
              >
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                  <Avatar src={state.staff.find(s => s.id === state.settings.ownerStaffId || (!state.settings.ownerStaffId && s.role === "Owner"))?.avatarUrl} name={state.settings.owner || user.name} size="h-7 w-7 text-[12px]" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card" />
                </div>
                <span className="max-w-[110px] truncate font-medium text-foreground">
                  {(state.settings.owner || user.name).split(" ")[0]}
                </span>
              </Link>
              <button
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground transition hover:bg-danger-surface hover:text-destructive"
              >
                <IconLogout size={15} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <IconLogin size={15} />
              <span>Sign in</span>
            </Link>
          )}
        </header>
        <nav
          aria-label="Mobile navigation"
          className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 pb-4 lg:hidden"
        >
          {navigation.map(({ name, path, icon: Icon }) => (
            <Link
              key={path}
              href={path}
              aria-current={current?.path === path ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-[12px] ${current?.path === path ? "bg-accent text-primary" : "text-muted-foreground"}`}
            >
              <Icon size={16} />
              {name}
            </Link>
          ))}
          <button
            aria-label="New booking"
            onClick={() => setNewBooking({})}
            className="shrink-0 rounded-full bg-primary px-3 text-primary-foreground"
          >
            <IconPlus size={17} />
          </button>
        </nav>
        <main
          className="mx-auto max-w-[1400px] px-8 pb-16 pt-5 max-lg:px-5 max-lg:pt-3"
        >
          <div key={activeWorkspaceId}>{children}</div>
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
