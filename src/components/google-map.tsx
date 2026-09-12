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
    <Card className="relative block h-[300px] overflow-hidden rounded-[30px] border-0 bg-muted p-0 max-[560px]:h-[210px] max-[560px]:rounded-[20px]">
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
          className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted px-8 pb-10 text-center text-[13px] font-medium text-foreground"
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
        >
          <IconMapPin size={26} />
          View this location in Google Maps
        </a>
      )}
      <a
        className="absolute left-5 top-5 z-10 flex max-w-[calc(100%-40px)] items-center gap-2 rounded-[18px] bg-white px-5 py-4 text-[15px] font-medium text-foreground max-[760px]:text-[12px] max-[560px]:left-2 max-[560px]:right-2 max-[560px]:top-2 max-[560px]:max-w-none max-[560px]:px-3 max-[560px]:py-2.5 max-[560px]:text-[12px]"
        href={directionsUrl}
        target="_blank"
        rel="noreferrer"
      >
        <IconMapPin size={17} className="shrink-0 text-foreground" />
        <span className="flex-1 truncate">{address}</span>
        <IconArrowUpRight size={18} className="shrink-0 text-foreground" />
      </a>
    </Card>
  );
}
