"use client";

import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconArrowRight, IconArrowLeft, IconCheck, IconLoader2, IconX, IconLink } from "@tabler/icons-react";
import { LocationPicker } from "./location-picker";
import { CategorySelect } from "./category-select";
import { api } from "@/lib/api";

export interface OnboardingData {
  name: string;
  slug: string;
  owner: string;
  category: string;
  phone: string;
  address: string;
  serviceName: string;
  duration: number;
  price: number;
}

interface OnboardingModalProps {
  open: boolean;
  onClose?: () => void;
  onSubmit: (data: OnboardingData) => Promise<void>;
  initialOwner?: string;
}

export function OnboardingModal({
  open,
  onClose,
  onSubmit,
  initialOwner = "",
}: OnboardingModalProps) {
  const submitting = useRef(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "auto-assigned"
  >("idle");
  const [owner, setOwner] = useState(initialOwner);
  const [category, setCategory] = useState("Studio & Wellness");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [serviceName, setServiceName] = useState("Initial Consultation");
  const [duration, setDuration] = useState(45);
  const [price, setPrice] = useState(0);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    const candidate = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!candidate) {
      setSlug("");
      setSlugStatus("idle");
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
      return;
    }

    setSlug(candidate);
    setSlugStatus("checking");

    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.workspaces.checkSlug(candidate);
        if (res.available) {
          setSlug(candidate);
          setSlugStatus("available");
        } else if (res.suggestedSlug) {
          setSlug(res.suggestedSlug);
          setSlugStatus("auto-assigned");
        } else {
          setSlug(candidate);
          setSlugStatus("available");
        }
      } catch {
        setSlug(candidate);
        setSlugStatus("available");
      }
    }, 350);
  };

  const handleStepOneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || name.trim().length < 2) {
      setError("Please provide a business name (at least 2 characters).");
      return;
    }
    const finalSlug =
      slug.trim() ||
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ||
      "studio";
    setSlug(finalSlug);

    if (!category.trim()) {
      setError("Please select or enter a business category.");
      return;
    }
    if (!owner.trim()) {
      setError("Please enter the studio owner or manager's name.");
      return;
    }
    if (!phone.trim() || phone.replace(/[^\d+]/g, "").length < 10) {
      setError("Please enter a valid business contact phone number.");
      return;
    }
    if (!address.trim() || address.trim().length < 5) {
      setError("Please enter your studio's physical address.");
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!serviceName.trim()) {
      setError("Please enter a service name.");
      return;
    }

    if(submitting.current)return;
    submitting.current=true;
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        slug: slug.trim(),
        owner: owner.trim(),
        category: category.trim() || "Studio",
        phone: phone.trim(),
        address: address.trim(),
        serviceName: serviceName.trim(),
        duration: Number(duration) || 30,
        price: Number(price) || 0,
      });
      if (onClose) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set up workspace. Please try again.");
    } finally {
      submitting.current=false;
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val && onClose && !submitting.current) onClose(); }}>
      <DialogContent showCloseButton={Boolean(onClose) && !isSubmitting} className="max-h-[90vh] overflow-y-auto rounded-[28px] border-0 bg-white p-8 shadow-none max-[560px]:rounded-[22px] max-[560px]:p-5 sm:max-w-[540px]">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            Step {step} of 2
          </span>
          {onClose && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <IconX size={16} />
            </button>
          )}
        </div>

        <DialogTitle className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
          {step === 1 ? "Set up your studio" : "Add your first service"}
        </DialogTitle>
        <DialogDescription className="mt-1 text-[13px] leading-6 text-muted-foreground">
          {step === 1
            ? "Create your business profile to start welcoming appointments."
            : "Set up a signature service for customer reservations."}
        </DialogDescription>

        {error && (
          <div
            role="alert"
            className="mt-3 flex items-start justify-between gap-2 rounded-xl bg-danger-surface p-3 text-[13px] text-destructive"
          >
            <span className="flex-1 leading-snug">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="-mr-1 -mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-destructive/70 transition hover:bg-destructive/10 hover:text-destructive focus:outline-none"
              aria-label="Dismiss error"
            >
              <IconX size={14} />
            </button>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStepOneSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-[12px] font-semibold text-foreground">
                Business name
                <Input
                  required
                  autoFocus
                  placeholder="e.g. Bloom Studio"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="mt-1.5 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              {/* Auto-generated Booking URL preview */}
              <div className="mt-2 flex items-center justify-between rounded-[10px] bg-muted/70 px-3 py-2 text-[12px]">
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <IconLink size={14} className="shrink-0 text-muted-foreground" />
                  <span className="shrink-0 text-[11px] text-muted-foreground">Booking URL:</span>
                  <span className="truncate font-mono text-[11px] font-medium text-foreground">
                    /b/{slug || "your-studio"}
                  </span>
                </div>
                <div className="ml-2 shrink-0">
                  {slugStatus === "checking" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <IconLoader2 size={12} className="animate-spin" />
                      Checking...
                    </span>
                  ) : slug ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                      <IconCheck size={12} />
                      {slugStatus === "auto-assigned" ? "Auto-assigned" : "Available"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Auto-generated</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
              <label className="block text-[12px] font-semibold text-foreground">
                Category
                <CategorySelect
                  value={category}
                  onChange={setCategory}
                  placeholder="Select or type category..."
                  required
                />
              </label>

              <label className="block text-[12px] font-semibold text-foreground">
                Owner name
                <Input
                  required
                  placeholder="e.g. Jessica Miller"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="mt-1.5 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            </div>

            <label className="block text-[12px] font-semibold text-foreground">
              Contact phone
              <Input
                required
                type="tel"
                placeholder="e.g. +234 801 234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>

            <div className="space-y-1.5">
              <span className="block text-[12px] font-semibold text-foreground">
                Studio location & address
              </span>
              <LocationPicker
                value={address}
                onChange={setAddress}
                placeholder="Search studio address or click on the map"
              />
            </div>

            <Button
              type="submit"
              className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-primary/90"
            >
              Continue to first service
              <IconArrowRight size={16} />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleFinalSubmit} className="mt-4 space-y-3.5">
            <label className="block text-[12px] font-semibold text-foreground">
              Service name
              <Input
                required
                autoFocus
                placeholder="e.g. Signature Haircut & Styling"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="mt-1.5 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>

            <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
              <label className="block text-[12px] font-semibold text-foreground">
                Duration (minutes)
                <Input
                  required
                  type="number"
                  min={5}
                  max={720}
                  step={5}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="mt-1.5 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <label className="block text-[12px] font-semibold text-foreground">
                Price (NGN)
                <Input
                  required
                  type="number"
                  min={0}
                  step={1}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="mt-1.5 min-h-10 w-full rounded-[10px] border-0 bg-muted px-3 py-2.5 text-[12px] text-foreground shadow-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            </div>

            <p className="text-xs leading-5 text-muted-foreground">Your workspace starts with Monday–Friday hours, 9am–5pm WAT. You can change hours, services, and booking policies in your business profile.</p>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border-0 bg-muted px-4 text-[12px] font-medium text-foreground hover:bg-muted/80 shadow-none"
              >
                <IconArrowLeft size={16} />
                Back
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <IconLoader2 size={16} className="animate-spin" />
                    Creating workspace...
                  </>
                ) : (
                  <>
                    Create studio workspace
                    <IconCheck size={16} />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
