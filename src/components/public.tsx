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
  IconCheck,
  IconFlower,
  IconMapPin,
  IconPhone,
  IconSearch,
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
  StudioMark,
} from "./shared";
import { BookingFlow } from "./booking-flow";
import { BookingDetails } from "./booking-details";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  return (
    <div className="min-h-screen bg-[#f4f4f5]">
      <header className="mx-auto flex h-[80px] max-w-none items-center justify-between border-0 bg-[#f2f2f4] px-10 max-[760px]:px-5">
        <Link
          className="inline-flex items-center gap-2.5 text-[14px] font-semibold tracking-[-0.04em] text-[#202022]"
          href={`/b/${state.business.slug}`}
        >
          <StudioMark />
          {state.business.name}
        </Link>
        <div className="flex items-center gap-6 max-[560px]:gap-3">
          <Link
            href="/reservation"
            className="text-[11px] font-medium text-[#707070] transition hover:text-[#333333] max-[560px]:text-[10px]"
          >
            Find my reservation
          </Link>
          <Link
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#707070] transition hover:text-[#333333] max-[760px]:hidden"
            href="/"
          >
            Studio workspace <IconArrowUpRight size={14} />
          </Link>
        </div>
      </header>
      {children}
      <footer className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 border-t border-[#e2e2e4] px-10 py-8 text-[10px] text-[#aaaaaa] max-[760px]:px-5 max-[560px]:flex-wrap">
        <span>A little time, well spent.</span>
        <Link href="/" className="flex items-center gap-1.5 transition hover:text-[#555]">
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
      <main className="mx-auto max-w-[1320px] px-10 pb-16 max-[760px]:px-5">
        <div className="mt-5 flex flex-wrap items-end justify-between gap-6 rounded-t-[48px] border-0 bg-white px-12 pb-8 pt-11 max-[760px]:rounded-t-[34px] max-[760px]:px-6 max-[760px]:py-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a0a0a0]">
              {state.business.category} · ABUJA
            </p>
            <h1 className="mt-2 flex items-center gap-3 text-[clamp(42px,4.5vw,64px)] font-medium tracking-[-0.07em] text-[#252527]">
              {state.business.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-[#8f8f8f]">
              <span className="flex items-center gap-1.5">
                <IconMapPin size={16} />
                Wuse 2, Abuja
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#767679]" />
                {hours.closed
                  ? "Closed today"
                  : `Open until ${time(`${TODAY}T${hours.close}:00`)}`}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-1 max-[560px]:w-full">
            <a
              className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[#e5e5e7] bg-white px-4 text-[11px] font-semibold text-[#303033] transition hover:border-[#c8c8ca] hover:bg-[#f7f7f8] max-[560px]:flex-1"
              href={`tel:${state.business.phone.replaceAll(" ", "")}`}
            >
              <IconPhone size={17} />
              Call studio
            </a>
            <Button
              className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#1e1e20] px-4 text-[11px] font-semibold text-white transition hover:bg-[#424246]"
              onClick={() => setService(null)}
            >
              Book an appointment <IconArrowUpRight size={17} />
            </Button>
          </div>
        </div>
        <div
          className={
            "public-columns grid grid-cols-[minmax(0,1fr)_320px] items-start gap-10 max-[1180px]:grid-cols-[minmax(0,1fr)_270px] max-[1180px]:gap-5 max-[760px]:grid-cols-1 rounded-b-[48px] bg-white px-12 pb-12 pt-4 max-[760px]:rounded-b-[34px] max-[760px]:px-6"
          }
        >
          <section>
            <div className="mb-12 max-w-160">
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a0a0a0]">
                About
              </p>
              <p className="mt-5 max-w-[550px] text-[14px] leading-7 text-[#8f8f8f]">
                {state.business.description}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
              {state.services
                .filter((s) => s.active)
                .map((s) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    action={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#7c7c7c] transition hover:bg-[#fafafa] hover:text-[#303030]"
                        aria-label={`Book ${s.name}`}
                        onClick={() => setService(s.id)}
                      >
                        <IconArrowUpRight size={20} />
                      </Button>
                    }
                  />
                ))}
            </div>
            <section className="mt-14 border-t border-[#eaeaea] pt-11">
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a0a0a0]">
                IN GOOD HANDS
              </p>
              <h2 className="mt-2 text-[27px] font-medium tracking-[-0.055em] text-[#252527]">
                Meet your people.
              </h2>
              <div className="mt-6 grid grid-cols-3 gap-4 max-[560px]:grid-cols-1">
                {state.staff.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-[17px] bg-[#ebebed] p-5 text-left"
                  >
                    <Avatar name={s.name} size="large" />
                    <strong className="mt-4 block text-[13px] font-semibold text-[#252528]">
                      {s.name}
                    </strong>
                    <p className="mt-1 text-[10px] text-[#9c9c9c]">{s.role}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="mt-14">
              <h2 className="text-[27px] font-medium tracking-[-0.055em] text-[#252527]">
                A few things to know.
              </h2>
              <div className="mt-4">
                {state.business.faqs.map((faq, i) => (
                  <details key={i} className="border-b border-[#eaeaea] py-5">
                    <summary className="cursor-pointer text-[12px] font-semibold text-[#252528] outline-none">
                      {faq.question}
                    </summary>
                    <p className="mt-3 text-[11px] leading-6 text-[#8f8f8f]">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          </section>
          <aside className="sticky top-5 space-y-7 max-[760px]:static max-[760px]:grid max-[760px]:grid-cols-2 max-[760px]:gap-5 max-[560px]:grid-cols-1">
            <Card className="rounded-[21px] border-0 bg-[#f8f8fa] p-6 shadow-none">
              <h3 className="mb-5 text-[17px] font-semibold tracking-[-0.04em] text-[#252528]">
                Our door is open.
              </h3>
              <BusinessHours />
            </Card>
            <section>
              <div className="flex items-center gap-4">
                <IconMapPin size={16} />
                <h3 className="text-[17px] font-semibold tracking-[-0.04em] text-[#252528]">
                  Find your way to us.
                </h3>
              </div>
              <div className="mt-3">
                <LocationCard />
              </div>
              <p className="mt-2 text-[10px] leading-5 text-[#8e8e8e]">
                {state.business.address}
              </p>
            </section>
            <Card className="rounded-[20px] border-0 bg-[#f8f8fa] p-6 shadow-none">
              <h3 className="text-[17px] font-semibold tracking-[-0.04em] text-[#252528]">
                Before your visit
              </h3>
              <h4 className="mt-4 text-[11px] font-semibold text-[#525256]">
                Booking policy
              </h4>
              <p className="mt-1 text-[10px] leading-5 text-[#9a9a9a]">
                {state.business.bookingPolicy}
              </p>
              <h4 className="mt-4 text-[11px] font-semibold text-[#525256]">
                Change of plans?
              </h4>
              <p className="mt-1 text-[10px] leading-5 text-[#9a9a9a]">
                {state.business.cancellationPolicy}
              </p>
              <h4 className="mt-4 text-[11px] font-semibold text-[#525256]">
                Deposits
              </h4>
              <p className="mt-1 text-[10px] leading-5 text-[#9a9a9a]">
                {state.business.depositPolicy}
              </p>
            </Card>
            <div className="rounded-[20px] bg-[#ebebed] p-6 max-[760px]:col-span-2 max-[560px]:col-span-1">
              <IconPhone size={20} className="text-[#757575]" />
              <h3 className="mb-2 mt-5 text-[17px] font-semibold tracking-[-0.04em] text-[#252528]">
                More of a phone person?
              </h3>
              <p className="text-[11px] leading-5 text-[#8b8b8b]">
                We’re happy to help you find the right service and a time that
                works.
              </p>
              <a
                className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold text-[#6f6f6f] transition hover:text-[#292929]"
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
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#1e1e20] bg-[#1e1e20] px-4 text-[11px] font-semibold text-white transition hover:border-[#424246] hover:bg-[#424246]"
                href="/reservation"
              >
                Find my reservation
              </Link>
            }
          />
        ) : (
          <div className="w-full max-w-[470px] rounded-[50px] border-0 bg-[#f8f8fa] px-12 py-14 text-center max-[560px]:rounded-[36px] max-[560px]:px-6 max-[560px]:py-10">
            <StudioMark large />
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a0a0a0]">
              A LITTLE SOMETHING TO LOOK FORWARD TO
            </p>
            <h1 className="mt-3 text-[45px] font-medium leading-[1.05] tracking-[-0.07em] text-[#252527]">
              Your time.
              <br />
              Your reservation.
            </h1>
            <p className="mt-4 text-[12px] leading-6 text-[#8e8e8e]">
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
              <label className="mb-4 block text-[11px] font-semibold text-[#636363]">
                Booking code
                <Input
                  className="mt-2 block min-h-10 w-full rounded-[10px] border-0 bg-[#f1f1f4] px-3 py-2.5 text-center font-mono text-[18px] font-semibold tracking-[0.22em] uppercase text-[#2f2f2f] shadow-none outline-none focus:ring-2 focus:ring-[#d8d8da]"
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
                  className="mt-3 text-[11px] font-medium text-[#af625b]"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <Button
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-[#1e1e20] bg-[#1e1e20] px-4 text-[11px] font-semibold text-white transition hover:border-[#424246] hover:bg-[#424246]"
              >
                <IconSearch size={17} />
                Find my reservation
              </Button>
            </form>
            <p className="mt-6 text-[11px] leading-6 text-[#9d9d9d]">
              Can’t find your code?{" "}
              <a
                href={`tel:${state.business.phone.replaceAll(" ", "")}`}
                className="inline-flex items-center gap-1 font-semibold text-[#797979] hover:underline"
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
