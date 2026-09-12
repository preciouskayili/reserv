"use client";

import { useState, type ReactNode } from "react";
import { IconCalendarEvent, IconChevronDown } from "@tabler/icons-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TODAY } from "@/lib/model";

const months = Array.from({ length: 12 }, (_, value) => ({ value: String(value), label: new Date(2026, value, 1).toLocaleDateString("en-US", { month: "long" }) }));
const toDate = (value: string) => new Date(`${value}T12:00:00`);

export function DatePicker({ value, onChange, children }: { value: string; onChange: (value: string) => void; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(toDate(value));
  const year = month.getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => String(toDate(value).getFullYear() - 50 + i));
  function choose(date: Date) {
    onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`);
    setOpen(false);
  }
  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) setMonth(toDate(value)); }}>
      <PopoverTrigger aria-label="Choose calendar date" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-medium text-foreground transition hover:bg-muted">
        <IconCalendarEvent size={17} className="shrink-0 text-muted-foreground" />
        {children || toDate(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        <IconChevronDown size={14} className="shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-2xl p-3">
        <div className="mb-2 flex gap-2">
          <Select value={String(month.getMonth())} items={months} onValueChange={(next) => next !== null && setMonth(new Date(year, Number(next), 1))}>
            <SelectTrigger aria-label="Calendar month" className="flex-1 border-0 bg-muted"><SelectValue /></SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>{months.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(next) => next && setMonth(new Date(Number(next), month.getMonth(), 1))}>
            <SelectTrigger aria-label="Calendar year" className="border-0 bg-muted"><SelectValue /></SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>{years.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Calendar mode="single" month={month} onMonthChange={setMonth} selected={toDate(value)} onSelect={(date) => date && choose(date)} className="bg-white [--cell-size:2.25rem]" />
        <Button variant="secondary" className="mt-2 w-full" onClick={() => choose(toDate(TODAY))}>Today</Button>
      </PopoverContent>
    </Popover>
  );
}
