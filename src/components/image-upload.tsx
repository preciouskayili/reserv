"use client";
import { useId, useRef, useState } from "react";
import { IconCamera, IconLoader2, IconX } from "@tabler/icons-react";
import { request } from "@/lib/api";
import { Avatar } from "./shared";

export function ImageUpload({
  label,
  value,
  onChange,
  name,
  disabled = false,
  onBusyChange,
}: {
  label: string;
  value?: string;
  onChange: (url: string | undefined) => void | Promise<void>;
  name: string;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const id = useId();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file || busyRef.current) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP image up to 5 MB.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await request<{ url: string }>("/api/upload/image", {
        method: "POST",
        body,
        signal: AbortSignal.timeout(60000),
      });
      await onChange(result.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  }
  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar name={name || "Your photo"} src={value} size="large" />
        <div className="min-w-0">
          <label htmlFor={id} className="block text-[13px] font-medium">
            {label}
          </label>
          <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
            JPG, PNG or WebP · up to 5 MB
          </p>
          <div className="mt-2 flex items-center gap-3">
            <label
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-muted px-3 text-xs font-medium ${busy || disabled ? "opacity-60" : "cursor-pointer hover:bg-accent"}`}
            >
              {busy ? (
                <IconLoader2 size={14} className="animate-spin" />
              ) : (
                <IconCamera size={14} />
              )}
              {busy ? "Uploading…" : value ? "Change image" : "Upload image"}
              <input
                id={id}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-describedby={`${id}-hint`}
                disabled={busy || disabled}
                className="sr-only"
                onChange={(e) => {
                  void upload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {value && (
              <button
                type="button"
                disabled={busy || disabled}
                onClick={() => void onChange(undefined)}
                className="inline-flex min-h-8 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <IconX size={13} /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
