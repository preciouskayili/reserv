"use client";
import { ui } from "./tw";
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
import { useStore } from "@/lib/reserv/store";
import { getReservationByCode, time, TODAY } from "@/lib/reserv/model";
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
    <div
      className={
        "public-shell min-h-screen [&_.brand-dot]:bg-[#1d1d1e] bg-[#f4f4f5]"
      }
    >
      <header
        className={
          "public-nav mx-auto flex h-[80px] items-center justify-between px-10 [&_>_div]:flex [&_>_div]:items-center [&_>_div]:gap-6 [&_>_div_>_a]:text-[11px] [&_>_div_>_a]:font-medium [&_>_div_>_a]:text-[#707070] [&_>_div_>_a]:hover:text-[#333333] [&_.owner-preview-link]:inline-flex [&_.owner-preview-link]:items-center [&_.owner-preview-link]:gap-1 max-[760px]:px-5 max-[760px]:[&_.owner-preview-link]:hidden max-[560px]:[&_>_div_>_a]:text-[10px] max-w-none border-0 bg-[#f2f2f4]"
        }
      >
        <Link
          className={
            "public-studio-name inline-flex items-center gap-2.5 text-[14px] font-semibold tracking-[-0.04em] [&_.studio-mark]:h-8 [&_.studio-mark]:w-8 [&_.studio-mark]:rounded-[10px] [&_.studio-mark_svg]:h-[19px] [&_.studio-mark_svg]:w-[19px] [&_.studio-mark]:bg-[#e5e5e7] [&_.studio-mark]:text-[#4b4b4e]"
          }
          href={`/b/${state.business.slug}`}
        >
          <StudioMark />
          {state.business.name}
        </Link>
        <div>
          <Link href="/reservation">Find my reservation</Link>
          <Link className={"owner-preview-link"} href="/">
            Studio workspace <IconArrowUpRight size={14} />
          </Link>
        </div>
      </header>
      {children}
      <footer
        className={
          "public-footer mx-auto flex max-w-[1320px] items-center justify-between gap-4 border-t px-10 py-8 text-[10px] text-[#aaaaaa] [&_>_a]:flex [&_>_a]:items-center [&_>_a]:gap-1.5 [&_.brand]:text-[16px] max-[760px]:px-5 max-[760px]:[&_>_span:last-child]:hidden max-[560px]:flex-wrap border-[#e2e2e4]"
        }
      >
        <span>A little time, well spent.</span>
        <Link href="/">
          Made possible with <Brand small />
        </Link>
        <span>Abuja, Nigeria · WAT</span>
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
      <main
        className={
          "public-main mx-auto max-w-[1320px] px-10 pb-16 max-[760px]:px-5"
        }
      >
        <div
          className={
            "public-profile-heading flex flex-wrap items-end justify-between gap-6 border-[#e7e7e7] py-11 [&_h1]:mt-2 [&_h1]:flex [&_h1]:items-center [&_h1]:gap-3 [&_h1]:text-[clamp(42px,4.5vw,64px)] [&_h1]:font-medium [&_h1]:tracking-[-0.07em] [&_.button]:min-h-11 max-[760px]:py-8 max-[560px]:[&_.header-actions]:w-full max-[560px]:[&_.button]:flex-1 [&_h1]:text-[#252527] mt-5 rounded-t-[48px] bg-white px-12 pb-8 pt-11 max-[760px]:rounded-t-[34px] max-[760px]:px-6 border-0"
          }
        >
          <div>
            <p
              className={
                "eyebrow text-[10px] font-semibold tracking-[0.17em] text-[#a0a0a0] uppercase"
              }
            >
              {state.business.category} · ABUJA
            </p>
            <h1>{state.business.name}</h1>
            <div
              className={
                "public-meta mt-3 flex flex-wrap items-center gap-4 text-[12px] text-[#8f8f8f] [&_span]:flex [&_span]:items-center [&_span]:gap-1.5 [&_.live-dot]:bg-[#767679]"
              }
            >
              <span>
                <IconMapPin size={16} />
                Wuse 2, Abuja
              </span>
              <span>
                <i
                  className={
                    "live-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#959595]"
                  }
                />
                {hours.closed
                  ? "Closed today"
                  : `Open until ${time(`${TODAY}T${hours.close}:00`)}`}
              </span>
            </div>
          </div>
          <div
            className={"header-actions flex flex-wrap items-center gap-2 pb-1"}
          >
            <a
              className={
                "button inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"
              }
              href={`tel:${state.business.phone.replaceAll(" ", "")}`}
            >
              <IconPhone size={17} />
              Call studio
            </a>
            <Button
              className={
                "button primary inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"
              }
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
            <div
              className={
                "public-about mb-12 max-w-[640px] [&_h2]:mt-4 [&_h2]:text-[clamp(30px,3vw,43px)] [&_h2]:leading-[1.15] [&_h2]:font-medium [&_h2]:tracking-[-0.06em] [&_>_p:last-child]:mt-5 [&_>_p:last-child]:max-w-[550px] [&_>_p:last-child]:text-[14px] [&_>_p:last-child]:leading-7 [&_>_p:last-child]:text-[#8f8f8f]"
              }
            >
              <p
                className={
                  "eyebrow text-[10px] font-semibold tracking-[0.17em] text-[#a0a0a0] uppercase"
                }
              >
                ABOUT
              </p>
              <p>{state.business.description}</p>
            </div>
            <div
              className={
                "row-between public-section-heading flex items-center justify-between gap-4 mb-5 [&_h2]:text-[27px] [&_h2]:font-medium [&_h2]:tracking-[-0.055em] [&_.muted]:text-[11px]"
              }
            >
              <h2>Make time for yourself.</h2>
              <span className={"muted text-[#8e8e8e]"}>Our services</span>
            </div>
            <div
              className={
                "public-services grid grid-cols-2 gap-4 [&_.service-card]:min-h-[250px] [&_.service-card]:p-6 max-[560px]:grid-cols-1 [&_.service-card]:rounded-[28px] [&_.service-card]:border-0 [&_.service-book]:bg-white [&_.service-card]:bg-[#f4f4f6] [&_.service-card]:shadow-none"
              }
            >
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
                        className={
                          "icon-button service-book inline-flex h-9 w-9 shrink-0 items-center justify-center border border-transparent text-[#7c7c7c] transition hover:border-[#eaeaea] hover:bg-white hover:text-[#303030] ml-auto rounded-full bg-[#f5f5f5]"
                        }
                        aria-label={`Book ${s.name}`}
                        onClick={() => setService(s.id)}
                      >
                        <IconArrowUpRight size={20} />
                      </Button>
                    }
                  />
                ))}
            </div>
            <section
              className={
                "public-team [&_h2]:text-[27px] [&_h2]:font-medium [&_h2]:tracking-[-0.055em] mt-14 border-t border-[#eaeaea] pt-11 [&_h2]:mt-2"
              }
            >
              <p
                className={
                  "eyebrow text-[10px] font-semibold tracking-[0.17em] text-[#a0a0a0] uppercase"
                }
              >
                IN GOOD HANDS
              </p>
              <h2>Meet your people.</h2>
              <div
                className={
                  "team-cards mt-6 grid grid-cols-3 gap-4 [&_>_div]:rounded-[17px] [&_>_div]:p-5 [&_strong]:mt-4 [&_strong]:block [&_strong]:text-[13px] [&_p]:mt-1 [&_p]:text-[10px] [&_p]:text-[#9c9c9c] max-[560px]:grid-cols-1 [&_>_div]:bg-[#ebebed]"
                }
              >
                {state.staff.map((s) => (
                  <div key={s.id}>
                    <Avatar name={s.name} size="large" />
                    <strong>{s.name}</strong>
                    <p>{s.role}</p>
                  </div>
                ))}
              </div>
            </section>
            <section
              className={
                "public-faqs [&_h2]:text-[27px] [&_h2]:font-medium [&_h2]:tracking-[-0.055em] mt-14 [&_details]:border-b [&_details]:border-[#eaeaea] [&_details]:py-5 [&_summary]:cursor-pointer [&_summary]:text-[12px] [&_summary]:font-semibold [&_details_p]:mt-3 [&_details_p]:text-[11px] [&_details_p]:leading-6 [&_details_p]:text-[#8f8f8f]"
              }
            >
              <h2>A few things to know.</h2>
              {state.business.faqs.map((faq, i) => (
                <details key={i}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </section>
          </section>
          <aside
            className={
              "public-info sticky top-5 space-y-7 [&_h3]:mb-5 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:tracking-[-0.04em] [&_.location-card]:h-[155px] [&_>_section_>_p.muted]:mt-2 [&_>_section_>_p.muted]:text-[10px] [&_>_section_>_p.muted]:leading-5 max-[760px]:static max-[760px]:grid max-[760px]:grid-cols-2 max-[760px]:gap-5 max-[760px]:[&_>_section]:min-w-0 max-[760px]:[&_.call-note]:col-span-2 max-[560px]:grid-cols-1 max-[560px]:[&_.call-note]:col-span-1 [&_.panel]:border-[#e8e8ea] [&_.panel]:bg-[#fafafa]"
            }
          >
            <Card
              className={
                "panel rounded-[21px] border-[#ededed] p-6 border-0 bg-[#f8f8fa] shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]"
              }
            >
              <h3>Our door is open.</h3>
              <BusinessHours />
            </Card>
            <section>
              <div className={"flex items-center gap-4"}>
                <IconMapPin size={16} />
                <h3>Find your way to us.</h3>
              </div>
              <LocationCard />
              <p className={"muted text-[#8e8e8e]"}>{state.business.address}</p>
            </section>
            <Card
              className={
                "policy-card rounded-[20px] p-6 [&_h4]:mt-5 [&_h4]:text-[11px] [&_h4]:font-semibold [&_p]:mt-2 [&_p]:text-[10px] [&_p]:leading-5 [&_p]:text-[#9a9a9a] border-[#e8e8ea] border-0 bg-[#f8f8fa] shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]"
              }
            >
              <h3>Before your visit</h3>
              <h4>Booking policy</h4>
              <p>{state.business.bookingPolicy}</p>
              <h4>Change of plans?</h4>
              <p>{state.business.cancellationPolicy}</p>
              <h4>Deposits</h4>
              <p>{state.business.depositPolicy}</p>
            </Card>
            <div
              className={
                "call-note rounded-[20px] p-6 [&_>_svg]:text-[#757575] [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:text-[11px] [&_p]:leading-5 [&_p]:text-[#8b8b8b] [&_.text-link]:mt-5 bg-[#ebebed]"
              }
            >
              <IconPhone size={20} />
              <h3>More of a phone person?</h3>
              <p>
                We’re happy to help you find the right service and a time that
                works.
              </p>
              <a
                className={
                  "inline-flex items-center gap-2 text-[11px] font-semibold text-[#6f6f6f] transition hover:text-[#292929]"
                }
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
        className={ui(
          booking ? "public-reservation-main" : "reservation-lookup",
        )}
      >
        {booking ? (
          <BookingDetails key={booking.id} booking={booking} publicView />
        ) : code && state.loaded ? (
          <EmptyState
            title="We couldn’t find that reservation."
            description="Check your six-character booking code and try again."
            action={
              <Link
                className={
                  "button primary inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"
                }
                href="/reservation"
              >
                Find my reservation
              </Link>
            }
          />
        ) : (
          <div
            className={
              "lookup-card w-full max-w-[470px] border-[#ebebeb] p-9 text-center [&_.studio-mark]:mb-7 [&_h1]:mt-3 [&_h1]:text-[45px] [&_h1]:leading-[1.05] [&_h1]:font-medium [&_h1]:tracking-[-0.07em] [&_>_.muted]:mt-4 [&_>_.muted]:text-[12px] [&_>_.muted]:leading-6 [&_form]:mt-8 [&_form]:text-left [&_.code-input]:text-[18px] [&_.code-input]:font-semibold [&_.code-input]:tracking-[0.22em] [&_.code-input]:uppercase [&_>_.fine-print]:mt-6 [&_>_.fine-print_a]:inline-flex [&_>_.fine-print_a]:items-center [&_>_.fine-print_a]:gap-1 [&_>_.fine-print_a]:font-semibold [&_>_.fine-print_a]:text-[#797979] rounded-[50px] px-12 py-14 max-[560px]:rounded-[36px] max-[560px]:px-6 max-[560px]:py-10 border-0 bg-[#f8f8fa] shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]"
            }
          >
            <StudioMark large />
            <p
              className={
                "eyebrow text-[10px] font-semibold tracking-[0.17em] text-[#a0a0a0] uppercase"
              }
            >
              A LITTLE SOMETHING TO LOOK FORWARD TO
            </p>
            <h1>
              Your time.
              <br />
              Your reservation.
            </h1>
            <p className={"muted text-[#8e8e8e]"}>
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
            >
              <label
                className={
                  "field mb-4 block text-[11px] font-semibold text-[#636363] [&_input]:mt-2 [&_input]:block [&_input]:min-h-10 [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border-[#e8e8e8] [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-[11px] [&_input]:font-normal [&_input]:text-[#2f2f2f] [&_input]:outline-none [&_input]:transition [&_input]:placeholder:text-[#b5b5b5] [&_input]:focus:border-[#a0a0a0] [&_input]:focus:ring-2 [&_input]:focus:ring-[#a2a2a228] [&_textarea]:mt-2 [&_textarea]:block [&_textarea]:min-h-10 [&_textarea]:w-full [&_textarea]:rounded-[10px] [&_textarea]:border-[#e8e8e8] [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:text-[11px] [&_textarea]:font-normal [&_textarea]:text-[#2f2f2f] [&_textarea]:outline-none [&_textarea]:transition [&_textarea]:placeholder:text-[#b5b5b5] [&_textarea]:focus:border-[#a0a0a0] [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-[#a2a2a228] [&_select]:mt-2 [&_select]:block [&_select]:min-h-10 [&_select]:w-full [&_select]:rounded-[10px] [&_select]:border-[#e8e8e8] [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-[11px] [&_select]:font-normal [&_select]:text-[#2f2f2f] [&_select]:outline-none [&_select]:transition [&_select]:placeholder:text-[#b5b5b5] [&_select]:focus:border-[#a0a0a0] [&_select]:focus:ring-2 [&_select]:focus:ring-[#a2a2a228] [&_textarea]:resize-y [&_input[readonly]]:bg-[#f8f8f8] [&_input[readonly]]:text-[#8b8b8b] [&_input]:border-0 [&_input]:bg-[#f1f1f4] [&_input]:shadow-none [&_textarea]:border-0 [&_textarea]:bg-[#f1f1f4] [&_textarea]:shadow-none [&_select]:border-0 [&_select]:bg-[#f1f1f4] [&_select]:shadow-none [&_input:focus]:border-0 [&_input:focus]:ring-2 [&_input:focus]:ring-[#d8d8da] [&_textarea:focus]:border-0 [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-[#d8d8da] [&_select:focus]:border-0 [&_select:focus]:ring-2 [&_select:focus]:ring-[#d8d8da]"
                }
              >
                Booking code
                <Input
                  className={"code-input"}
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
                  className={
                    "form-error mt-3 text-[11px] font-medium text-[#af625b]"
                  }
                  role="alert"
                >
                  {error}
                </p>
              )}
              <Button
                className={
                  "button primary full inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[11px] font-semibold transition disabled:opacity-50 [&.ghost]:border-transparent [&.ghost]:bg-transparent [&.full]:w-full [&.danger-button]:border-[#a8514b] [&.danger-button]:bg-[#a8514b] [&.danger-button]:text-white [&.danger-button]:hover:bg-[#91453f] [&.primary]:border-[#1e1e20] [&.primary]:bg-[#1e1e20] [&.primary]:text-white [&.primary]:hover:border-[#424246] [&.primary]:hover:bg-[#424246] border-[#e5e5e7] bg-white text-[#303033] hover:border-[#c8c8ca] hover:bg-[#f7f7f8]"
                }
              >
                <IconSearch size={17} />
                Find my reservation
              </Button>
            </form>
            <p className={"fine-print text-[11px] leading-6 text-[#9d9d9d]"}>
              Can’t find your code?{" "}
              <a href={`tel:${state.business.phone.replaceAll(" ", "")}`}>
                Call the studio <IconArrowRight size={12} />
              </a>
            </p>
          </div>
        )}
      </main>
    </PublicLayout>
  );
}
