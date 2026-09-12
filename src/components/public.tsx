"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconMapPin,
  IconPhone,
  IconSearch,
  IconClock,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useStore } from "@/lib/store";
import { getReservationByCode, time, TODAY } from "@/lib/model";
import {
  Avatar,
  Brand,
  BusinessHours,
  EmptyState,
  LocationCard,
  ServiceCard,
} from "./shared";
import { BookingFlow } from "./booking-flow";
import { BookingDetails } from "./booking-details";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background pt-10 max-[760px]:pt-5">
      {children}
      <footer className="mx-auto flex max-w-[840px] items-center justify-between gap-4 border-t border-border px-10 py-8 text-[12px] text-muted-foreground max-[760px]:px-5 max-[560px]:flex-wrap">
        <span>A little time, well spent.</span>
        <Link
          href="/"
          className="flex items-center gap-1.5 transition hover:text-[#555]"
        >
          Made possible with <Brand small />
        </Link>
        <span className="max-[760px]:hidden">Abuja, Nigeria · WAT</span>
      </footer>
    </div>
  );
}
export function PublicProfile() {
  const { state } = useStore();
  const [service, setService] = useState<string | null | undefined>(undefined);
  const hours = state.business.hours[5];
  return (
    <PublicLayout>
      <main className="mx-auto max-w-[840px] px-10 pb-16 max-[760px]:px-5">
        <div className="flex flex-wrap items-end justify-between gap-6 rounded-t-[48px] border-0 bg-white px-12 pb-8 pt-11 max-[760px]:rounded-t-[34px] max-[760px]:px-6 max-[760px]:py-8">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {state.business.category} · ABUJA
            </p>
            <h1 className="mt-2 flex items-center gap-3 text-[34px] font-medium tracking-tight text-foreground">
              {state.business.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
              <a
                href="#location"
                className="flex items-center gap-1.5 transition hover:text-foreground"
              >
                <IconMapPin size={16} />
                Wuse 2, Abuja
              </a>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {hours.closed
                  ? "Closed today"
                  : `Open until ${time(`${TODAY}T${hours.close}:00`)}`}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 pb-1">
            <Link
              href="/reservation"
              className="mr-auto inline-flex min-h-10 items-center gap-2 rounded-lg bg-muted px-6 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-primary"
            >
              <IconSearch size={14} /> Find my reservation
            </Link>
            <a
              className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-border bg-white px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background max-[560px]:flex-1"
              href={`tel:${state.business.phone.replaceAll(" ", "")}`}
            >
              <IconPhone size={17} />
              Call studio
            </a>
            <Button
              className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-primary/90"
              onClick={() => setService(null)}
            >
              Book an appointment <IconArrowUpRight size={17} />
            </Button>
          </div>
        </div>
        <div
          className={
            "public-columns flex flex-col gap-10 rounded-b-[48px] bg-white px-12 pb-12 pt-4 max-[760px]:rounded-b-[34px] max-[760px]:px-6"
          }
        >
          <section id="location" className="w-full">
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <IconMapPin size={18} className="text-foreground" />
                <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
                  Find your way to us
                </h2>
              </div>
              <p className="text-[12px] text-muted-foreground">
                {state.business.address}
              </p>
            </div>
            <LocationCard />
          </section>
          <section className="w-full">
            <div className="mb-12 max-w-160">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                About
              </p>
              <p className="mt-2 max-w-137.5 text-[14px] leading-6 text-muted-foreground">
                {state.business.description}
              </p>
            </div>
            <h2 className="mb-5 font-medium text-foreground">Services</h2>
            <div className="grid grid-cols-2 gap-3">
              {state.services
                .filter((s) => s.active)
                .map((s) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    publicView
                    action={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-muted-foreground transition hover:bg-background hover:text-foreground"
                        aria-label={`Book ${s.name}`}
                        onClick={() => setService(s.id)}
                      >
                        <IconArrowUpRight size={20} />
                      </Button>
                    }
                  />
                ))}
            </div>
            <section className="mt-14 border-t border-border pt-11">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                IN GOOD HANDS
              </p>
              <h2 className="mt-2 text-[27px] font-medium tracking-tight text-foreground">
                Meet your people.
              </h2>
              <div className="mt-6 flex flex-col gap-3">
                {state.staff.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-[17px] bg-muted p-5 text-left"
                  >
                    <Avatar name={s.name} size="large" />
                    <strong className="mt-4 block text-[13px] font-semibold text-foreground">
                      {s.name}
                    </strong>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {s.role}
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <section className="mt-14">
              <h2 className="text-[27px] font-medium tracking-tight text-foreground">
                A few things to know.
              </h2>
              <div className="mt-4">
                {state.business.faqs.map((faq, i) => (
                  <details key={i} className="border-b border-border py-5">
                    <summary className="cursor-pointer text-[12px] font-semibold text-foreground outline-none">
                      {faq.question}
                    </summary>
                    <p className="mt-3 text-[12px] leading-6 text-muted-foreground">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          </section>
          <aside className="w-full space-y-7">
            <Card className="rounded-[21px] border-0 shadow-none">
              <h3 className="mb-5 flex items-center gap-2 text-[17px] font-semibold text-foreground">
                <IconClock size={18} className="text-muted-foreground" /> Our
                door is open.
              </h3>
              <BusinessHours />
            </Card>
            <Card className="rounded-[20px] border-0 shadow-none">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <IconShieldCheck size={18} className="text-muted-foreground" />{" "}
                Before your visit
              </h3>
              <h4 className="mt-2 text-sm font-semibold text-foreground">
                Booking policy
              </h4>
              <p className="text-sm text-muted-foreground">
                {state.business.bookingPolicy}
              </p>
              <h4 className="mt-2 text-sm font-semibold text-foreground">
                Change of plans?
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.business.cancellationPolicy}
              </p>
              <h4 className="mt-2 text-sm font-semibold text-foreground">
                Deposits
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {state.business.depositPolicy}
              </p>
            </Card>
            <div className="rounded-[20px] bg-muted p-6 max-[760px]:col-span-2 max-[560px]:col-span-1">
              <IconPhone size={20} className="text-muted-foreground" />
              <h3 className="mb-2 mt-5 text-[17px] font-semibold text-foreground">
                More of a phone person?
              </h3>
              <p className="text-[12px] leading-5 text-muted-foreground">
                We’re happy to help you find the right service and a time that
                works.
              </p>
              <a
                className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground"
                href={`tel:${state.business.phone.replaceAll(" ", "")}`}
              >
                Give us a call <IconArrowUpRight size={16} />
              </a>
            </div>
          </aside>
        </div>
      </main>
      {service !== undefined && (
        <BookingFlow
          publicFlow
          preset={service ? { serviceId: service } : {}}
          onClose={() => setService(undefined)}
        />
      )}
    </PublicLayout>
  );
}
export function ReservationLookup({ code }: { code?: string }) {
  const { state } = useStore();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const booking = code ? getReservationByCode(state.bookings, code) : undefined;
  return (
    <PublicLayout>
      <main
        className={
          booking
            ? "py-6"
            : "flex min-h-[calc(100vh-170px)] items-center justify-center py-10"
        }
      >
        {booking ? (
          <BookingDetails key={booking.id} booking={booking} publicView />
        ) : code && state.loaded ? (
          <EmptyState
            title="We couldn’t find that reservation."
            description="Check your six-character booking code and try again."
            action={
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-border bg-primary px-4 text-[12px] font-semibold text-white transition hover:border-border hover:bg-primary/90"
                href="/reservation"
              >
                Find my reservation
              </Link>
            }
          />
        ) : (
          <div className="w-full max-w-[470px] rounded-[50px] border-0 bg-card px-12 py-14 text-center max-[560px]:rounded-[36px] max-[560px]:px-6 max-[560px]:py-10">
            <Link
              href={`/b/${state.business.slug}`}
              className="text-[15px] font-medium text-foreground"
            >
              {state.business.name}
            </Link>
            <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              A LITTLE SOMETHING TO LOOK FORWARD TO
            </p>
            <h1 className="mt-3 text-[30px] font-medium leading-[1.05] tracking-tight text-foreground">
              Your time.
              <br />
              Your reservation.
            </h1>
            <p className="mt-4 text-[12px] leading-6 text-muted-foreground">
              Enter your booking code to see the details,
              <br />
              choose a new time, or change your plans.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const found = getReservationByCode(state.bookings, input);
                if (found) router.push(`/r/${found.code}`);
                else
                  setError(
                    "We couldn’t find that code. Check all six characters and try again.",
                  );
              }}
              className="mt-8 text-left"
            >
              <label className="mb-4 block text-[12px] font-semibold text-foreground">
                Booking code
                <Input
                  className="mt-2 block min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-center font-mono text-[18px] font-semibold tracking-[0.08em] uppercase text-foreground shadow-none outline-none focus:ring-2 focus:ring-[#d8d8da]"
                  placeholder="A82LPR"
                  maxLength={6}
                  minLength={6}
                  required
                  autoCapitalize="characters"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value.toUpperCase());
                    setError("");
                  }}
                />
              </label>
              {error && (
                <p
                  className="mt-3 text-[12px] font-medium text-[#af625b]"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <Button className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-primary px-4 text-[12px] font-semibold text-white transition hover:border-border hover:bg-primary/90">
                <IconSearch size={17} />
                Find my reservation
              </Button>
            </form>
            <p className="mt-6 text-[12px] leading-6 text-muted-foreground">
              Can’t find your code?{" "}
              <a
                href={`tel:${state.business.phone.replaceAll(" ", "")}`}
                className="inline-flex items-center gap-1 font-semibold text-muted-foreground hover:underline"
              >
                Call the studio <IconArrowRight size={12} />
              </a>
            </p>
          </div>
        )}
      </main>
    </PublicLayout>
  );
}
