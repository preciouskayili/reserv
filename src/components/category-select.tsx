"use client";

import { useEffect, useRef, useState, useId } from "react";
import { IconCheck, IconChevronDown, IconSparkles } from "@tabler/icons-react";

export const PRESET_CATEGORIES = [
  "Studio & Wellness",
  "Hair & Styling",
  "Barber & Grooming",
  "Nail Studio & Lash",
  "Skin & Aesthetics",
  "Massage & Bodywork",
  "Spa & Sauna",
  "Makeup & Beauty",
  "Fitness & Pilates",
  "Tattoo & Piercing",
  "Photography & Creative",
  "Consulting & Coaching",
  "Dental & Health",
] as const;

interface CategorySelectProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
}

export function CategorySelect({
  value,
  onChange,
  placeholder = "Select or type a category...",
  className = "",
  required = false,
  autoFocus = false,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const trimmed = value.trim();
  const lowerTrimmed = trimmed.toLowerCase();

  // Filter preset categories based on what the user types
  const filtered = PRESET_CATEGORIES.filter((cat) =>
    cat.toLowerCase().includes(lowerTrimmed)
  );

  const hasExactMatch = PRESET_CATEGORIES.some(
    (cat) => cat.toLowerCase() === lowerTrimmed
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter") {
      // If user pressed Enter, close dropdown and keep current typed value
      setIsOpen(false);
    } else if (e.key === "ArrowDown" && !isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          required={required}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listId}
          className="mt-1.5 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 pr-9 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-[calc(50%+3px)] -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle category list"
        >
          <IconChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-2xl border-0 bg-card p-1.5 shadow-none ring-1 ring-black/5"
        >
          {filtered.length > 0 ? (
            <>
              {filtered.map((cat) => {
                const isSelected = cat.toLowerCase() === lowerTrimmed;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(cat)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[12px] transition ${
                      isSelected
                        ? "bg-muted font-semibold text-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    {isSelected && (
                      <IconCheck
                        size={14}
                        className="shrink-0 text-primary ml-2"
                      />
                    )}
                  </button>
                );
              })}

              {/* If user typed something custom that doesn't match any preset exactly */}
              {trimmed.length > 0 && !hasExactMatch && (
                <div className="mt-1 border-t border-black/5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSelect(trimmed)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  >
                    <IconSparkles size={14} className="shrink-0 text-primary" />
                    <span className="truncate">
                      Use custom: &ldquo;{trimmed}&rdquo;
                    </span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* When nothing in the preset list matches the user's typed query */
            <div className="p-1">
              <div className="px-2.5 py-1.5 text-[11px] text-muted-foreground">
                No preset category found
              </div>
              {trimmed.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSelect(trimmed)}
                  className="flex w-full items-center gap-2 rounded-xl bg-muted px-3 py-2 text-left text-[12px] font-medium text-foreground hover:bg-muted/80 transition"
                >
                  <IconCheck size={14} className="shrink-0 text-primary" />
                  <span className="truncate">
                    Use &ldquo;{trimmed}&rdquo;
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
