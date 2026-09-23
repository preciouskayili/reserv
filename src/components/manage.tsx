"use client";

import { useBusinessClock } from "@/hooks/use-business-clock";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  IconArrowUpRight,
  IconCheck,
  IconChevronRight,
  IconEdit,
  IconEye,
  IconFlower,
  IconLoader2,
  IconPhone,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useWorkspaceSave } from "@/hooks/use-workspace-save";
import { DataTable, TableSummary } from "./ui/data-table";
import { LocationPicker } from "./location-picker";
import {
  type Booking,
  type Customer,
  type Service,
  dateLabel,
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
  const { state, update, isSaving, canDismiss } = useWorkspaceSave();
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [filter, setFilter] = useState("All services");
  const [savingServiceId, setSavingServiceId] = useState<string | null>(null);
  return (
    <>
      <PageHeader
        eyebrow="SERVICE MANAGEMENT"
        title="Services"
        description="Manage services, prices, durations, and assigned staff."
        action={
          <Button
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            disabled={isSaving}
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
                  disabled={isSaving}
                  onClick={() => setEditing(s)}
                >
                  <IconEdit size={17} />
                </Button>
              }
              footer={
                <div className="flex min-h-8 items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2.5 text-[12px] font-medium text-muted-foreground">
                    <Switch
                      disabled={isSaving}
                      checked={s.active}
                      aria-label={`Show ${s.name} on booking page`}
                      onCheckedChange={async (active) => {
                        if (!canDismiss()) return;
                        setSavingServiceId(s.id);
                        const saved = await update((st) => ({
                          ...st,
                          services: st.services.map((x) =>
                            x.id === s.id ? { ...x, active } : x,
                          ),
                        }));
                        setSavingServiceId(null);
                        if (saved) toast.success(
                          active
                            ? "Service is available to book"
                            : "Service hidden from the public page",
                        );
                      }}
                    />
                    {isSaving && savingServiceId === s.id ? <span role="status" className="inline-flex items-center gap-2"><IconLoader2 size={13} aria-hidden="true" className="animate-spin" />Saving…</span> : s.active ? "Visible online" : "Hidden online"}
                  </label>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-lg text-muted-foreground hover:bg-danger-surface hover:text-destructive"
                    aria-label={`Delete ${s.name}`}
                    disabled={isSaving}
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
          busy={isSaving}
          onClose={() => { if (canDismiss()) setDeleting(null); }}
        >
          {state.bookings.some((b) => b.serviceId === deleting.id) ? (
            <>
              <p className="mb-4 text-[12px] leading-5 text-muted-foreground">
                This service has reservation history. Hide it from the booking
                page to preserve those records.
              </p>
              <Button
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                loading={isSaving}
                loadingText="Saving…"
                onClick={async () => {
                  const saved = await update((s) => ({
                    ...s,
                    services: s.services.map((x) =>
                      x.id === deleting.id ? { ...x, active: false } : x,
                    ),
                  }));
                  if (!saved) return;
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
                loading={isSaving}
                loadingText="Saving…"
                onClick={async () => {
                  const saved = await update((s) => ({
                    ...s,
                    services: s.services.filter((x) => x.id !== deleting.id),
                  }));
                  if (!saved) return;
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
  const { state, update, isSaving, canDismiss } = useWorkspaceSave();
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
      title={service ? "Edit service" : "Add service"}
      description={
        service
          ? "Edit your service details."
          : "Create a service your customers can reserve."
      }
      busy={isSaving}
      onClose={() => { if (canDismiss()) onClose(); }}
    >
      <form
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
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
          const saved = await update((s) => ({
            ...s,
            services: service
              ? s.services.map((x) => (x.id === service.id ? next : x))
              : [...s.services, next],
          }));
          if (!saved) return;
          toast.success(service ? "Service updated" : "Service created");
          onClose();
        }}
      >
        <fieldset disabled={isSaving} className="contents space-y-4">
          <label className="block text-[12px] font-semibold text-foreground">
            Service name
            <Input
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Silk press"
              className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[12px] text-foreground transition hover:border-border"
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
                <Avatar name={s.name} src={s.avatarUrl} />
                {s.name}
              </label>
            ))}
          </div>
          {error && (
            <p
              className="mt-3 text-[12px] font-medium text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}
          <Button
            loading={isSaving}
            loadingText="Saving…"
            type="submit"
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {service ? "Save changes" : "Create service"}
            <IconCheck size={17} />
          </Button>
        </fieldset>
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
  const { NOW } = useBusinessClock();
  const { state, update, isSaving, canDismiss } = useWorkspaceSave();
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
        eyebrow="CUSTOMER MANAGEMENT"
        title="Customers"
        description="View customer details and booking history."
        action={
          <Button
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            onClick={() => setAdding(true)}
          >
            <IconPlus size={18} />
            Add customer
          </Button>
        }
      />
      <section className="table-panel">
        <div className="table-toolbar">
          <h2 className="text-[16px] font-semibold text-foreground">
            {state.customers.length} customers
          </h2>
          <div className="table-search">
            <IconSearch
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search customers"
              placeholder="Search by name or phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-transparent bg-muted pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground shadow-none transition focus-visible:border-border focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
        <DataTable label="Customers">
          <thead>
            <tr>
              <th scope="col">Customer</th>
              <th scope="col">Phone number</th>
              <th scope="col" className="table-number">
                Reservations
              </th>
              <th scope="col">Visit</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const bookings = state.bookings.filter(
                (b) => b.customerId === c.id,
              );
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
                <tr key={c.id}>
                  <td>
                    <span className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <span className="table-primary">{c.name}</span>
                    </span>
                  </td>
                  <td>
                    <a
                      href={`tel:${c.phone.replaceAll(" ", "")}`}
                      className="whitespace-nowrap text-muted-foreground hover:text-primary"
                    >
                      {c.phone}
                    </a>
                  </td>
                  <td className="table-number font-medium">
                    {bookings.length}
                  </td>
                  <td>
                    {next || last ? (
                      <>
                        <span className="table-primary">
                          {new Date(
                            (next ?? last).startTime,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="table-secondary">
                          {next ? "Next visit" : "Last completed visit"}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        No visits yet
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      className="table-action"
                      onClick={() => setSelected(c.id)}
                      aria-label={`View ${c.name}`}
                    >
                      View <IconChevronRight size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
        {!customers.length && (
          <EmptyState
            title="No customers found"
            description="Try another name or phone number."
            action={
              query ? (
                <Button variant="outline" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              ) : (
                <Button onClick={() => setAdding(true)}>Add customer</Button>
              )
            }
          />
        )}
        <TableSummary count={customers.length} noun="customer" />
      </section>
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
          title="Add customer"
          description="Keep their details for a future visit."
          busy={isSaving}
          onClose={() => { if (canDismiss()) setAdding(false); }}
        >
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
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
              const saved = await update((s) => ({
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
              if (!saved) return;
              setAdding(false);
              toast.success("Customer added");
            }}
          >
            <fieldset disabled={isSaving} className="contents space-y-4">
              <label className="block text-[12px] font-semibold text-foreground">
                Full name
                <Input
                  name="name"
                  required
                  minLength={2}
                  className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <Button
                loading={isSaving}
                loadingText="Saving…"
                type="submit"
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                Add customer
              </Button>
            </fieldset>
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
  const { state, update, isSaving, canDismiss } = useWorkspaceSave();
  const [notes, setNotes] = useState(customer.notes);
  const bookings = state.bookings
    .filter((b) => b.customerId === customer.id)
    .sort((a, b) => b.startTime.localeCompare(a.startTime));
  return (
    <Modal
      wide
      title={customer.name}
      description={customer.phone}
      busy={isSaving}
      onClose={() => { if (canDismiss()) onClose(); }}
    >
      <div className="my-6 flex gap-2">
        <a
          className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-border bg-card px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background"
          href={`tel:${customer.phone.replaceAll(" ", "")}`}
        >
          <IconPhone size={16} />
          Call customer
        </a>
        <Button
          className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          disabled={isSaving}
          onClick={onNew}
        >
          <IconPlus size={16} />
          New booking
        </Button>
      </div>
      <label className="mb-4 block text-[12px] font-semibold text-foreground">
        Customer notes
        <Textarea
          rows={3}
          disabled={isSaving}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <Button
        variant="secondary"
        size="sm"
        className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-card px-3 text-[12px] font-semibold text-foreground transition hover:border-border"
        loading={isSaving}
        loadingText="Saving…"
        onClick={async () => {
          const saved = await update((s) => ({
            ...s,
            customers: s.customers.map((c) =>
              c.id === customer.id ? { ...c, notes } : c,
            ),
          }));
          if (saved) toast.success("Customer note saved");
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
          title="No bookings yet"
          description="Their first reservation will appear here."
        />
      )}
    </Modal>
  );
}

export function BusinessProfilePage() {
  const { state, update, isSaving } = useWorkspaceSave();
  const [draft, setDraft] = useState(state.business);
  const [tab, setTab] = useState("The essentials");
  async function save(e: FormEvent) {
    e.preventDefault();
    if (draft.hours.some((h) => !h.closed && h.open >= h.close)) {
      toast.error("Closing time must be after opening time");
      return;
    }
    const saved = await update((s) => ({ ...s, business: draft }));
    if (saved) toast.success("Your studio page is updated");
  }
  return (
    <>
      <PageHeader
        eyebrow="BUSINESS SETTINGS"
        title="Business profile"
        description="Manage your public profile, opening hours, and booking policies."
        action={
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-card px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background"
            href={`/b/${state.business.slug}`}
          >
            <IconEye size={17} />
            Preview public page <IconArrowUpRight size={16} />
          </Link>
        }
      />
      <div className="flex flex-col gap-6 [&>form]:w-full [&>aside]:w-full max-w-4xl">
        <aside className="static">
          <div className="mb-4 rounded-[20px] bg-card p-5 shadow-none">
            <h3 className="mt-5 text-[19px] font-semibold text-foreground">
              {draft.name}
            </h3>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {draft.category}
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
              Your public studio page
            </span>
          </div>
          <nav className="flex flex-wrap gap-1 rounded-xl bg-card p-2">
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
          className="rounded-[21px] bg-card p-8 shadow-none"
          onSubmit={save}
        >
          <fieldset disabled={isSaving} className="contents">
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
                    className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
                <label className="mb-4 block text-[12px] font-semibold text-foreground">
                  Business description
                  <Textarea
                    required
                    rows={5}
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                    className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
                  <label className="mb-4 block text-[12px] font-semibold text-foreground">
                    Category
                    <Select
                      value={draft.category}
                      onValueChange={(value) =>
                        value && setDraft({ ...draft, category: value })
                      }
                    >
                      <SelectTrigger
                        aria-label="Business category"
                        className="mt-2 h-10 w-full border-0 bg-muted"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent alignItemWithTrigger={false}>
                        {[
                          "Hair & beauty",
                          "Barber",
                          "Nail studio",
                          "Spa & wellness",
                          "Photography",
                          "Tutoring",
                          "Consulting",
                          "Cleaning",
                          "Repairs",
                        ].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
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
                      className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                </div>
                <div className="mb-4">
                  <label className="mb-2 block text-[12px] font-semibold text-foreground">
                    Your location & map pin
                  </label>
                  <LocationPicker
                    value={draft.address}
                    onChange={(address) =>
                      setDraft({ ...draft, address })
                    }
                    placeholder="Search address or click on the map"
                  />
                </div>
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
                <div className="mt-5 divide-y divide-border">
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
                        <span className="col-span-3 text-[12px] text-muted-foreground">
                          Closed
                        </span>
                      ) : (
                        <>
                          <Input
                            aria-label={`${h.day} opening time`}
                            type="time"
                            required
                            value={h.open}
                            className="min-w-0 rounded-lg border border-border bg-card px-2 py-1 text-[12px] text-foreground shadow-none outline-none max-[560px]:px-1 max-[560px]:text-[12px]"
                            onChange={(e) =>
                              setDraft({
                                ...draft,
                                hours: draft.hours.map((x, j) =>
                                  i === j ? { ...x, open: e.target.value } : x,
                                ),
                              })
                            }
                          />
                          <span className="text-center text-[12px] text-muted-foreground">
                            to
                          </span>
                          <Input
                            aria-label={`${h.day} closing time`}
                            type="time"
                            required
                            value={h.close}
                            className="min-w-0 rounded-lg border border-border bg-card px-2 py-1 text-[12px] text-foreground shadow-none outline-none max-[560px]:px-1 max-[560px]:text-[12px]"
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
                    className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:border-border hover:bg-card hover:text-foreground"
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
                        className="mt-2 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                        className="mt-2 min-h-16 w-full resize-y rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </label>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-border bg-card px-4 text-[12px] font-semibold text-foreground transition hover:border-border hover:bg-background"
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
                className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                loading={isSaving}
                loadingText="Saving…"
                type="submit"
              >
                Save changes <IconCheck size={16} />
              </Button>
            </div>
          </fieldset>
        </form>
      </div>
    </>
  );
}

export { SettingsPage } from "./settings-page";
