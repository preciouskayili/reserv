"use client";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconCalendarEvent,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconEdit,
  IconEye,
  IconFlower,
  IconHeadphones,
  IconMessageCircle,
  IconPhone,
  IconPlus,
  IconSearch,
  IconShieldCheck,
  IconSparkles,
  IconTrash,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  type Booking,
  type Customer,
  type Service,
  dateLabel,
  NOW,
} from "@/lib/model";
import {
  Avatar,
  BookingCard,
  EmptyState,
  Modal,
  PageHeader,
  ServiceCard,
} from "./shared";
import type { BookingPreset } from "./booking-flow";

export function ServicesPage() {
  const { state, update } = useStore();
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [filter, setFilter] = useState("All services");
  return (
    <>
      <PageHeader
        eyebrow="WHAT YOU DO BEST"
        title="A little of your expertise."
        description="Thoughtful services. Ready to reserve."
        action={
          <Button
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            onClick={() => setEditing("new")}
          >
            <IconPlus size={18} />
            Add service
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 max-[560px]:overflow-x-auto">
          {["All services", "Available", "Hidden"].map((f) => (
            <button
              key={f}
              className={`rounded-lg px-3 py-2 text-[12px] transition max-[560px]:whitespace-nowrap ${
                filter === f
                  ? "bg-muted font-semibold text-foreground"
                  : "font-medium text-muted-foreground hover:bg-background"
              }`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-muted-foreground">
          {state.services.length} services · {state.staff.length} specialists
        </span>
      </div>
      <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,290px),1fr))] gap-4">
        {state.services
          .filter(
            (s) =>
              filter === "All services" ||
              (filter === "Available" ? s.active : !s.active),
          )
          .map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              action={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Edit ${s.name}`}
                  onClick={() => setEditing(s)}
                >
                  <IconEdit size={17} />
                </Button>
              }
              footer={
                <div className="flex min-h-8 items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2.5 text-[12px] font-medium text-muted-foreground">
                    <Switch
                      checked={s.active}
                      aria-label={`Show ${s.name} on booking page`}
                      onCheckedChange={(active) => {
                        update((st) => ({
                          ...st,
                          services: st.services.map((x) =>
                            x.id === s.id ? { ...x, active } : x,
                          ),
                        }));
                        toast.success(active ? "Service is available to book" : "Service hidden from the public page");
                      }}
                    />
                    {s.active ? "Visible online" : "Hidden online"}
                  </label>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-lg text-muted-foreground hover:bg-danger-surface hover:text-destructive"
                    aria-label={`Delete ${s.name}`}
                    onClick={() => setDeleting(s)}
                  >
                    <IconTrash size={16} />
                  </Button>
                </div>
              }
            />
          ))}
      </div>
      {editing && (
        <ServiceEditor
          key={typeof editing === "string" ? editing : editing.id}
          service={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <Modal
          title="Remove this service?"
          description={deleting.name}
          onClose={() => setDeleting(null)}
        >
          {state.bookings.some((b) => b.serviceId === deleting.id) ? (
            <>
              <p className="mb-4 text-[12px] leading-5 text-muted-foreground">
                This service has reservation history. Hide it from the booking
                page to preserve those records.
              </p>
              <Button
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                onClick={() => {
                  update((s) => ({
                    ...s,
                    services: s.services.map((x) =>
                      x.id === deleting.id ? { ...x, active: false } : x,
                    ),
                  }));
                  setDeleting(null);
                  toast.success(
                    "Service hidden; reservation history preserved",
                  );
                }}
              >
                Hide service
              </Button>
            </>
          ) : (
            <>
              <p className="mb-4 text-[12px] leading-5 text-muted-foreground">
                This service will be removed from your studio and public page.
              </p>
              <Button
                variant="destructive"
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#a8514b] px-4 text-[12px] font-semibold text-white transition hover:bg-[#91453f] disabled:opacity-50"
                onClick={() => {
                  update((s) => ({
                    ...s,
                    services: s.services.filter((x) => x.id !== deleting.id),
                  }));
                  setDeleting(null);
                  toast.success("Service deleted");
                }}
              >
                <IconTrash size={16} /> Delete service
              </Button>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

function ServiceEditor({
  service,
  onClose,
}: {
  service?: Service;
  onClose: () => void;
}) {
  const { state, update } = useStore();
  const [draft, setDraft] = useState<Service>(
    service || {
      id: "",
      name: "",
      description: "",
      duration: 60,
      price: 0,
      deposit: 0,
      staffIds: [],
      active: true,
    },
  );
  const [error, setError] = useState("");
  return (
    <Modal
      wide
      title={service ? "A little fine-tuning." : "Something new to offer."}
      description={
        service
          ? "Edit your service details."
          : "Create a service your customers can reserve."
      }
      onClose={onClose}
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.staffIds.length) {
            setError("Choose at least one specialist for this service.");
            return;
          }
          if (draft.deposit > draft.price) {
            setError("The deposit cannot be greater than the service price.");
            return;
          }
          const next = {
            ...draft,
            name: draft.name.trim(),
            id: service?.id || crypto.randomUUID(),
          };
          update((s) => ({
            ...s,
            services: service
              ? s.services.map((x) => (x.id === service.id ? next : x))
              : [...s.services, next],
          }));
          toast.success(service ? "Service updated" : "Service created");
          onClose();
        }}
      >
        <label className="block text-[12px] font-semibold text-foreground">
          Service name
          <Input
            required
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. Silk press"
            className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
          />
        </label>
        <label className="block text-[12px] font-semibold text-foreground">
          Description
          <Textarea
            required
            rows={3}
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
            placeholder="Tell customers what makes this service special…"
            className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
          />
        </label>
        <div className="grid grid-cols-3 gap-3 max-[560px]:grid-cols-1">
          <label className="block text-[12px] font-semibold text-foreground">
            Duration (minutes)
            <Input
              type="number"
              min={15}
              max={600}
              step={15}
              required
              value={draft.duration}
              onChange={(e) =>
                setDraft({ ...draft, duration: Number(e.target.value) })
              }
              className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
            />
          </label>
          <label className="block text-[12px] font-semibold text-foreground">
            Price (₦)
            <Input
              type="number"
              min={0}
              required
              value={draft.price}
              onChange={(e) =>
                setDraft({ ...draft, price: Number(e.target.value) })
              }
              className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
            />
          </label>
          <label className="block text-[12px] font-semibold text-foreground">
            Deposit (₦)
            <Input
              type="number"
              min={0}
              max={draft.price}
              required
              value={draft.deposit}
              onChange={(e) =>
                setDraft({ ...draft, deposit: Number(e.target.value) })
              }
              className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
            />
          </label>
        </div>
        <p className="mb-2 block text-[12px] font-semibold text-foreground">
          Who offers this service?
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {state.staff.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-[12px] text-foreground transition hover:border-border"
            >
              <input
                type="checkbox"
                className="accent-[#666666]"
                checked={draft.staffIds.includes(s.id)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    staffIds: e.target.checked
                      ? [...draft.staffIds, s.id]
                      : draft.staffIds.filter((id) => id !== s.id),
                  })
                }
              />
              <Avatar name={s.name} />
              {s.name}
            </label>
          ))}
        </div>
        {error && (
          <p className="mt-3 text-[12px] font-medium text-[#af625b]" role="alert">
            {error}
          </p>
        )}
        <Button className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50">
          <IconCheck size={16} /> {service ? "Save changes" : "Create service"}
          <IconCheck size={17} />
        </Button>
      </form>
    </Modal>
  );
}

export function CustomersPage({
  onBooking,
  onNew,
}: {
  onBooking: (b: Booking) => void;
  onNew: (p?: BookingPreset) => void;
}) {
  const { state, update } = useStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const customers = state.customers.filter((c) =>
    `${c.name} ${c.phone}`.toLowerCase().includes(query.toLowerCase()),
  );
  const customer = state.customers.find((c) => c.id === selected);
  return (
    <>
      <PageHeader
        eyebrow="FAMILIAR FACES. NEW CONNECTIONS."
        title="Your people."
        description="A little care goes a long way."
        action={
          <Button
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
            onClick={() => setAdding(true)}
          >
            <IconPlus size={18} />
            Add customer
          </Button>
        }
      />
      <Card className="overflow-hidden rounded-[22px] border-0 bg-card !gap-0 !py-0 shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 max-[560px]:px-4">
          <h2 className="text-[16px] font-semibold text-foreground">
            {state.customers.length} lovely people
          </h2>
          <label className="flex h-10 min-w-[230px] items-center gap-2 rounded-xl bg-muted px-3 text-muted-foreground">
            <IconSearch size={17} />
            <Input
              aria-label="Search customers"
              placeholder="Search by name or phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-full w-full border-0 bg-transparent p-0 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-0"
            />
          </label>
        </div>
        {customers.map((c) => {
          const bookings = state.bookings.filter((b) => b.customerId === c.id);
          const next = bookings
            .filter(
              (b) =>
                b.startTime >= NOW &&
                !["Cancelled", "Completed"].includes(b.status),
            )
            .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
          const last = bookings
            .filter((b) => b.status === "Completed")
            .sort((a, b) => b.startTime.localeCompare(a.startTime))[0];
          return (
            <button
              key={c.id}
              className="flex w-full items-center gap-4 border-b border-border px-5 py-2.5 text-left transition hover:bg-white last:border-b-0 max-[560px]:gap-2 max-[560px]:px-4"
              onClick={() => setSelected(c.id)}
            >
              <Avatar name={c.name} />
              <span className="min-w-[170px] flex-1 max-[560px]:min-w-0">
                <strong className="block text-[12px] font-semibold text-foreground">{c.name}</strong>
                <small className="mt-1 block text-[12px] text-muted-foreground">{c.phone}</small>
              </span>
              <span className="w-[145px] text-[12px] text-muted-foreground max-[560px]:w-auto">
                {bookings.length} reservations
              </span>
              <span className="w-[210px] text-[12px] text-muted-foreground max-[760px]:hidden">
                {next
                  ? `Next visit: ${new Date(next.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                  : last
                    ? `Last visit: ${new Date(last.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : "Let’s plan a first visit"}
              </span>
              <IconChevronRight size={18} className="text-muted-foreground" />
            </button>
          );
        })}
        {!customers.length && (
          <EmptyState
            title="No familiar faces here."
            description="Try another name or phone number."
          />
        )}
      </Card>
      {customer && (
        <CustomerDetails
          key={customer.id}
          customer={customer}
          onClose={() => setSelected(null)}
          onBooking={(b) => {
            setSelected(null);
            onBooking(b);
          }}
          onNew={() => {
            setSelected(null);
            onNew({ customerId: customer.id });
          }}
        />
      )}
      {adding && (
        <Modal
          title="A new face at the studio."
          description="Keep their details for a future visit."
          onClose={() => setAdding(false)}
        >
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const phone = String(data.get("phone"));
              if (
                state.customers.some(
                  (c) =>
                    c.phone.replace(/\D/g, "") === phone.replace(/\D/g, ""),
                )
              ) {
                toast.error("A customer with this phone number already exists");
                return;
              }
              update((s) => ({
                ...s,
                customers: [
                  ...s.customers,
                  {
                    id: crypto.randomUUID(),
                    name: String(data.get("name")).trim(),
                    phone,
                    notes: "",
                  },
                ],
              }));
              setAdding(false);
              toast.success("Customer added");
            }}
          >
            <label className="block text-[12px] font-semibold text-foreground">
              Full name
              <Input
                name="name"
                required
                minLength={2}
                className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
              />
            </label>
            <label className="block text-[12px] font-semibold text-foreground">
              Phone number
              <Input
                name="phone"
                type="tel"
                required
                pattern="[+0-9 ()-]{10,20}"
                placeholder="+234 800 000 0000"
                className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
              />
            </label>
            <Button className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50">
              Add customer
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}

function CustomerDetails({
  customer,
  onClose,
  onBooking,
  onNew,
}: {
  customer: Customer;
  onClose: () => void;
  onBooking: (b: Booking) => void;
  onNew: () => void;
}) {
  const { state, update } = useStore();
  const [notes, setNotes] = useState(customer.notes);
  const bookings = state.bookings
    .filter((b) => b.customerId === customer.id)
    .sort((a, b) => b.startTime.localeCompare(a.startTime));
  return (
    <Modal
      wide
      title={customer.name}
      description={customer.phone}
      onClose={onClose}
    >
      <div className="my-6 flex gap-2">
        <a
          className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-border bg-white px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background"
          href={`tel:${customer.phone.replaceAll(" ", "")}`}
        >
          <IconPhone size={16} />
          Call customer
        </a>
        <Button
          className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          onClick={onNew}
        >
          <IconPlus size={16} />
          New booking
        </Button>
      </div>
      <label className="mb-4 block text-[12px] font-semibold text-foreground">
        A little something to remember
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
        />
      </label>
      <Button
        variant="secondary"
        size="sm"
        className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-white px-3 text-[12px] font-semibold text-foreground transition hover:border-border"
        onClick={() => {
          update((s) => ({
            ...s,
            customers: s.customers.map((c) =>
              c.id === customer.id ? { ...c, notes } : c,
            ),
          }));
          toast.success("Customer note saved");
        }}
      >
        <IconCheck size={16} /> Save note
      </Button>
      <h3 className="mt-7 border-t border-border pt-6 text-[15px] font-semibold text-foreground">
        Reservation history
      </h3>
      {bookings.map((b) => (
        <div className="mt-3" key={b.id}>
          <small className="mb-2 block text-[12px] text-muted-foreground">
            {dateLabel(b.startTime)}
          </small>
          <BookingCard compact booking={b} onClick={() => onBooking(b)} />
        </div>
      ))}
      {!bookings.length && (
        <EmptyState
          title="The beginning of a good thing."
          description="Their first reservation will appear here."
        />
      )}
    </Modal>
  );
}

export function BusinessProfilePage() {
  const { state, update } = useStore();
  const [draft, setDraft] = useState(state.business);
  const [tab, setTab] = useState("The essentials");
  function save(e: FormEvent) {
    e.preventDefault();
    if (draft.hours.some((h) => !h.closed && h.open >= h.close)) {
      toast.error("Closing time must be after opening time");
      return;
    }
    update((s) => ({ ...s, business: draft }));
    toast.success("Your studio page is updated");
  }
  return (
    <>
      <PageHeader
        eyebrow="YOUR STUDIO, YOUR STORY"
        title="Let’s make it feel like you."
        description="Everything your customers — and receptionist — should know."
        action={
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-border bg-white px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background"
            href={`/b/${state.business.slug}`}
          >
            <IconEye size={17} />
            Preview public page <IconArrowUpRight size={16} />
          </Link>
        }
      />
      <div className="flex flex-col gap-6 [&>form]:w-full [&>aside]:w-full">
        <aside className="static">
          <div className="mb-4 rounded-[20px] bg-card p-5 shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]">
            <h3 className="mt-5 text-[19px] font-semibold text-foreground">
              {draft.name}
            </h3>
            <p className="mt-1 text-[12px] text-muted-foreground">{draft.category}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
              Your public studio page
            </span>
          </div>
          <nav className="flex flex-wrap gap-1 rounded-xl bg-white p-2">
            {[
              "The essentials",
              "Opening hours",
              "Booking & policies",
              "Questions & answers",
            ].map((t) => (
              <button
                key={t}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-3 text-left text-[12px] transition ${
                  t === tab
                    ? "bg-muted font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-background"
                }`}
                onClick={() => setTab(t)}
              >
                {t}
                <IconChevronRight size={15} />
              </button>
            ))}
          </nav>
          <Link
            className="mt-5 inline-flex items-center gap-2 pl-3 text-[12px] font-semibold text-muted-foreground transition hover:text-foreground"
            href="/services"
          >
            Manage your services <IconArrowUpRight size={15} />
          </Link>
        </aside>
        <form
          className="rounded-[21px] bg-card p-8 shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]"
          onSubmit={save}
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            MAKE A GOOD FIRST IMPRESSION
          </p>
          <h2 className="mb-6 mt-2 text-[27px] font-semibold tracking-tight text-foreground">
            {tab}
          </h2>
          {tab === "The essentials" && (
            <>
              <label className="mb-4 block text-[12px] font-semibold text-foreground">
                Business name
                <Input
                  required
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                />
              </label>
              <label className="mb-4 block text-[12px] font-semibold text-foreground">
                A little about your studio
                <Textarea
                  required
                  rows={5}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                />
              </label>
              <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
                <label className="mb-4 block text-[12px] font-semibold text-foreground">
                  Category
                  <Select value={draft.category} onValueChange={(value) => value && setDraft({...draft, category: value})}>
                    <SelectTrigger aria-label="Business category" className="mt-2 h-10 w-full border-0 bg-muted"><SelectValue /></SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>{["Hair & beauty", "Barber", "Nail studio", "Spa & wellness", "Photography", "Tutoring", "Consulting", "Cleaning", "Repairs"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </label>
                <label className="mb-4 block text-[12px] font-semibold text-foreground">
                  Business phone
                  <Input
                    required
                    type="tel"
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft({ ...draft, phone: e.target.value })
                    }
                    className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                  />
                </label>
              </div>
              <label className="mb-4 block text-[12px] font-semibold text-foreground">
                Your location
                <Input
                  required
                  value={draft.address}
                  onChange={(e) =>
                    setDraft({ ...draft, address: e.target.value })
                  }
                  className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                />
              </label>
              <div className="flex items-start gap-2 rounded-[11px] bg-background p-3 text-[12px] leading-5 text-muted-foreground">
                <IconFlower size={18} />
                Your public page: /b/{state.business.slug}
              </div>
            </>
          )}
          {tab === "Opening hours" && (
            <>
              <p className="text-[12px] text-muted-foreground">
                A time for work, and a time for yourself. All times are in WAT.
              </p>
              <div className="mt-5 divide-y divide-[#f0f0f0]">
                {draft.hours.map((h, i) => (
                  <div
                    key={h.day}
                    className="grid grid-cols-[1fr_110px_24px_110px] items-center gap-2 py-3 max-[560px]:grid-cols-[1fr_90px_15px_90px]"
                  >
                    <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
                      <input
                        type="checkbox"
                        className="accent-[#646464]"
                        checked={!h.closed}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            hours: draft.hours.map((x, j) =>
                              i === j ? { ...x, closed: !e.target.checked } : x,
                            ),
                          })
                        }
                      />
                      {h.day}
                    </label>
                    {h.closed ? (
                      <span className="col-span-3 text-[12px] text-muted-foreground">Closed</span>
                    ) : (
                      <>
                        <Input
                          aria-label={`${h.day} opening time`}
                          type="time"
                          required
                          value={h.open}
                          className="min-w-0 rounded-lg border border-border bg-white px-2 py-1 text-[12px] text-foreground shadow-none outline-none max-[560px]:px-1 max-[560px]:text-[12px]"
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              hours: draft.hours.map((x, j) =>
                                i === j ? { ...x, open: e.target.value } : x,
                              ),
                            })
                          }
                        />
                        <span className="text-center text-[12px] text-muted-foreground">to</span>
                        <Input
                          aria-label={`${h.day} closing time`}
                          type="time"
                          required
                          value={h.close}
                          className="min-w-0 rounded-lg border border-border bg-white px-2 py-1 text-[12px] text-foreground shadow-none outline-none max-[560px]:px-1 max-[560px]:text-[12px]"
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              hours: draft.hours.map((x, j) =>
                                i === j ? { ...x, close: e.target.value } : x,
                              ),
                            })
                          }
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "Booking & policies" && (
            <>
              <label className="mb-4 block text-[12px] font-semibold text-foreground">
                Booking policy
                <Textarea
                  required
                  rows={3}
                  value={draft.bookingPolicy}
                  onChange={(e) =>
                    setDraft({ ...draft, bookingPolicy: e.target.value })
                  }
                  className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                />
              </label>
              <label className="mb-4 block text-[12px] font-semibold text-foreground">
                Cancellation policy
                <Textarea
                  required
                  rows={3}
                  value={draft.cancellationPolicy}
                  onChange={(e) =>
                    setDraft({ ...draft, cancellationPolicy: e.target.value })
                  }
                  className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                />
              </label>
              <label className="mb-4 block text-[12px] font-semibold text-foreground">
                Deposit policy
                <Textarea
                  rows={3}
                  value={draft.depositPolicy}
                  onChange={(e) =>
                    setDraft({ ...draft, depositPolicy: e.target.value })
                  }
                  className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                />
              </label>
              <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
                <label className="mb-4 block text-[12px] font-semibold text-foreground">
                  Minimum notice (minutes)
                  <Input
                    type="number"
                    min={0}
                    max={10080}
                    value={draft.rules.minNoticeMinutes}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        rules: {
                          ...draft.rules,
                          minNoticeMinutes: Number(e.target.value),
                        },
                      })
                    }
                    className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                  />
                </label>
                <label className="mb-4 block text-[12px] font-semibold text-foreground">
                  Book ahead (days)
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={draft.rules.maxAdvanceDays}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        rules: {
                          ...draft.rules,
                          maxAdvanceDays: Number(e.target.value),
                        },
                      })
                    }
                    className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                  />
                </label>
              </div>
            </>
          )}
          {tab === "Questions & answers" && (
            <>
              {draft.faqs.map((faq, i) => (
                <div
                  className="mb-4 rounded-xl border border-border p-4"
                  key={i}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      QUESTION {i + 1}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:border-border hover:bg-white hover:text-foreground"
                      aria-label={`Remove question ${i + 1}`}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          faqs: draft.faqs.filter((_, j) => i !== j),
                        })
                      }
                    >
                      <IconX size={16} />
                    </Button>
                  </div>
                  <label className="mb-4 block text-[12px] font-semibold text-foreground">
                    Question
                    <Input
                      required
                      value={faq.question}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          faqs: draft.faqs.map((f, j) =>
                            i === j ? { ...f, question: e.target.value } : f,
                          ),
                        })
                      }
                      className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                    />
                  </label>
                  <label className="mb-4 block text-[12px] font-semibold text-foreground">
                    Answer
                    <Textarea
                      required
                      rows={3}
                      value={faq.answer}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          faqs: draft.faqs.map((f, j) =>
                            i === j ? { ...f, answer: e.target.value } : f,
                          ),
                        })
                      }
                      className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
                    />
                  </label>
                </div>
              ))}
              <Button
                variant="secondary"
                className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-border bg-white px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background"
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    faqs: [...draft.faqs, { question: "", answer: "" }],
                  })
                }
              >
                <IconPlus size={16} />
                Add a question
              </Button>
            </>
          )}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-[12px]">
            <span className="text-muted-foreground">
              Changes update your public profile.
            </span>
            <Button
              className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
              type="submit"
            >
              Save changes <IconCheck size={16} />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

export function AgentPage() {
  const { state } = useStore();
  const [tab, setTab] = useState("All activity");
  const activities = state.agentActivity.filter(
    (a) =>
      tab === "All activity" ||
      (tab === "Reservations"
        ? a.kind !== "confirmed"
        : a.kind === "confirmed"),
  );
  return (
    <>
      <PageHeader
        eyebrow="A NEW MEMBER OF YOUR TEAM"
        title="Meet your helping hand."
        description="More time with your customers. Less time on the phone."
      />
      <div className="grid grid-cols-2 items-start gap-6 max-[760px]:grid-cols-1">
        <Card className="rounded-[21px] bg-card p-6 shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]">
          <span className="mb-7 flex h-20 w-20 items-center justify-center rounded-[25px] bg-muted text-muted-foreground">
            <IconHeadphones size={46} stroke={1.2} />
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
            <i className="h-1.5 w-1.5 rounded-full bg-primary" />
            Not connected yet
          </span>
          <h2 className="mt-4 text-[32px] font-medium tracking-tight text-foreground">
            AI Receptionist
          </h2>
          <p className="mt-2 max-w-[400px] text-[13px] leading-6 text-muted-foreground">
            A thoughtful first hello. Here to answer calls, look after your
            reservations, and make every customer feel welcome.
          </p>
          <div className="my-7 divide-y divide-[#efefef] border-y border-border">
            <div className="flex items-center gap-3 py-4 text-[12px]">
              <IconPhone size={18} className="text-muted-foreground" />
              <span className="flex-1 text-muted-foreground">Agent phone number</span>
              <strong className="text-[12px] font-semibold text-foreground">Not assigned</strong>
            </div>
            <div className="flex items-center gap-3 py-4 text-[12px]">
              <IconClock size={18} className="text-muted-foreground" />
              <span className="flex-1 text-muted-foreground">Calling hours</span>
              <strong className="text-[12px] font-semibold text-foreground">Studio opening hours</strong>
            </div>
            <div className="flex items-center gap-3 py-4 text-[12px]">
              <IconShieldCheck size={18} className="text-muted-foreground" />
              <span className="flex-1 text-muted-foreground">Connection status</span>
              <strong className="text-[12px] font-semibold text-foreground">Coming soon</strong>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-[11px] bg-background p-3 text-[12px] leading-5 text-muted-foreground">
            The receptionist is not connected yet. These are previews of how
            they’ll help your studio.
          </div>
          <Link
            href="/business-profile"
            className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-border bg-white px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background"
          >
            Prepare your studio details <IconArrowRight size={17} />
          </Link>
        </Card>
        <section className="px-4 py-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            A LITTLE LESS ON YOUR PLATE
          </p>
          <h2 className="mb-6 mt-4 text-[32px] font-medium tracking-tight text-foreground">
            Good with people.
            <br />
            Great with the details.
          </h2>
          {[
            {
              icon: IconMessageCircle,
              title: "Knows your studio",
              text: "Answers questions about your services, pricing, hours, and policies.",
            },
            {
              icon: IconCalendarEvent,
              title: "Keeps your calendar in order",
              text: "Checks availability, makes reservations, and helps with rescheduling or cancellations.",
            },
            {
              icon: IconPhone,
              title: "Gives a thoughtful nudge",
              text: "Confirms upcoming visits and calls customers with timely reminders.",
            },
            {
              icon: IconUsers,
              title: "Remembers familiar faces",
              text: "Finds returning customers by phone number and reservations by booking code.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              className="flex gap-4 border-t border-border py-5"
              key={title}
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-muted text-foreground">
                <Icon size={21} />
              </span>
              <div>
                <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
      <Card className="mt-6 rounded-[21px] bg-card p-8 shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              A GLIMPSE OF WHAT’S TO COME
            </p>
            <h2 className="mt-2 text-[23px] font-semibold tracking-tight text-foreground">
              A day at the front desk.
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
            Sample activity
          </span>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-1 max-[560px]:overflow-x-auto">
          {["All activity", "Reservations", "Confirmations"].map((t) => (
            <button
              key={t}
              className={`rounded-lg px-3 py-2 text-[12px] transition max-[560px]:whitespace-nowrap ${
                tab === t
                  ? "bg-muted font-semibold text-foreground"
                  : "font-medium text-muted-foreground hover:bg-background"
              }`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {activities.map((a) => (
          <div
            className="flex items-center gap-4 border-t border-border py-5"
            key={a.id}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              {a.kind === "confirmed" ? (
                <IconCheck size={19} />
              ) : a.kind === "created" ? (
                <IconPlus size={19} />
              ) : (
                <IconCalendarEvent size={19} />
              )}
            </span>
            <div className="flex-1">
              <strong className="block text-[12px] font-semibold text-foreground">{a.title}</strong>
              <p className="mt-1 text-[12px] text-muted-foreground">{a.detail}</p>
            </div>
            <small className="text-[12px] text-muted-foreground">{a.time}</small>
          </div>
        ))}
      </Card>
    </>
  );
}

export function SettingsPage() {
  const { state, update, reset } = useStore();
  const [owner, setOwner] = useState(state.settings.owner);
  const [resetOpen, setResetOpen] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="MAKE YOURSELF AT HOME"
        title="The little preferences."
        description="Set things up for the way you work."
      />
      <div className="grid grid-cols-2 items-start gap-5 max-[760px]:grid-cols-1">
        <Card className="rounded-[21px] bg-card p-7 shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            YOUR WORKSPACE
          </p>
          <h2 className="mb-5 mt-2 text-[23px] font-semibold tracking-tight text-foreground">
            A personal touch.
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update((s) => ({
                ...s,
                settings: { ...s.settings, owner: owner.trim() },
              }));
              toast.success("Preferences saved");
            }}
          >
            <label className="mb-4 block text-[12px] font-semibold text-foreground">
              What should we call you?
              <Input
                required
                minLength={2}
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[#d8d8da]"
              />
            </label>
            <div className="flex justify-between gap-3 border-b border-border py-4 text-[12px]">
              <span className="text-muted-foreground">Time zone</span>
              <strong className="text-right font-semibold text-foreground">Africa/Lagos · WAT (UTC+1)</strong>
            </div>
            <div className="flex justify-between gap-3 border-b border-border py-4 text-[12px]">
              <span className="text-muted-foreground">Currency</span>
              <strong className="text-right font-semibold text-foreground">Nigerian naira (₦)</strong>
            </div>
            <div className="flex justify-between gap-3 border-b border-border py-4 text-[12px]">
              <span className="text-muted-foreground">Appearance</span>
              <strong className="text-right font-semibold text-foreground">Light & calm</strong>
            </div>
            <Button className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50">
              Save preferences <IconCheck size={16} />
            </Button>
          </form>
        </Card>
        <div className="space-y-5">
          <Card className="rounded-[21px] bg-card p-7 shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              THOUGHTFUL FOLLOW-UPS
            </p>
            <h2 className="mb-2 mt-2 text-[23px] font-semibold tracking-tight text-foreground">
              Reminders & confirmations.
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Save your preferences for when your receptionist is connected.
            </p>
            {[
              {
                key: "reminders" as const,
                title: "Appointment reminders",
                text: "A friendly call before an upcoming visit.",
              },
              {
                key: "confirmations" as const,
                title: "Ask for confirmation",
                text: "Check in with customers before their appointment.",
              },
            ].map((item) => (
              <div
                className="flex items-center gap-3 border-b border-border py-4"
                key={item.key}
              >
                <span className="flex-1">
                  <strong className="block text-[12px] font-semibold text-foreground">{item.title}</strong>
                  <small className="mt-1 block text-[12px] text-muted-foreground">{item.text}</small>
                </span>
                <Switch
                  aria-label={item.title}
                  checked={state.settings[item.key]}
                  onCheckedChange={(checked) => {
                    update((s) => ({
                      ...s,
                      settings: { ...s.settings, [item.key]: checked },
                    }));
                    toast.success("Preference saved");
                  }}
                />
              </div>
            ))}
          </Card>
          <Card className="rounded-[21px] bg-card p-7 shadow-[0_20px_50px_-38px_#0000002e,0_4px_18px_-15px_#0000001a]">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-[15px] font-semibold text-foreground">A space to experiment.</h3>
              <IconSparkles size={19} className="text-muted-foreground" />
            </div>
            <p className="my-3 text-[12px] leading-5 text-muted-foreground">
              This is a mock workspace. Your changes are saved in this browser.
              The demo day is September 12, 2026, at 10:15 AM.
            </p>
            <Button
              variant="secondary"
              className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-border bg-white px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background"
              onClick={() => setResetOpen(true)}
            >
              Reset demo workspace
            </Button>
          </Card>
        </div>
      </div>
      {resetOpen && (
        <Modal
          title="Start fresh?"
          description="Reset this browser’s demo workspace."
          onClose={() => setResetOpen(false)}
        >
          <p className="text-[12px] leading-5 text-muted-foreground">
            This removes the reservations, services, and edits you added in this
            demo and restores the original sample studio.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <Button
              variant="secondary"
              className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-border bg-white px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background"
              onClick={() => setResetOpen(false)}
            >
              Keep my changes
            </Button>
            <Button
              variant="destructive"
              className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#a8514b] px-4 text-[12px] font-semibold text-white transition hover:bg-[#91453f]"
              onClick={() => {
                reset();
                setOwner("Jessica");
                setResetOpen(false);
                toast.success("Your demo workspace is fresh again");
              }}
            >
              Reset demo
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
