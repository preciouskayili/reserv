"use client";

import { IconArrowUpRight, IconMapPin } from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { useStore } from "@/lib/store";

export function GoogleLocationCard() {
  const { state } = useStore();
  const address = state.business.address;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const embedUrl = key
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(address)}&zoom=14`
    : "";

  return (
    <Card className="block overflow-hidden rounded-[30px] border-0 bg-muted p-0 max-[560px]:rounded-[20px]">
      <div className="relative h-[300px] max-[560px]:h-[210px]">
        {key ? (
          <iframe
            title={`Google Map of ${state.business.name}`}
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            src={embedUrl}
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <a
            className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted px-8 py-8 text-center text-[13px] font-medium text-foreground"
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
          >
            <IconMapPin size={26} />
            View this location in Google Maps
          </a>
        )}
      </div>
      <a
        className="flex min-w-0 items-center gap-3 px-5 py-4 text-[13px] font-medium text-foreground transition hover:bg-accent focus-visible:-outline-offset-4 max-[560px]:px-4 max-[560px]:text-[12px]"
        href={directionsUrl}
        target="_blank"
        rel="noreferrer"
      >
        <IconMapPin size={17} className="shrink-0 text-foreground" />
        <span className="min-w-0 flex-1 break-words">{address}</span>
        <IconArrowUpRight size={18} className="shrink-0 text-foreground" />
      </a>
    </Card>
  );
}
