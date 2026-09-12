import type { Metadata } from "next";
import { ReservApp } from "@/components/app";
import { seed } from "@/lib/seed";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug[0] === "b" && slug[1] === seed.business.slug)
    return {
      title: `${seed.business.name} — Hair & beauty in Abuja`,
      description:
        "Good care. Great company. A moment that’s yours. Explore services and book your next appointment at Bloom Studio in Wuse 2, Abuja.",
      openGraph: {
        title: `${seed.business.name} — Hair & beauty in Abuja`,
        description:
          "Explore services and make time for yourself at Bloom Studio, Wuse 2.",
        type: "website",
      },
    };
  if (slug[0] === "r" || slug[0] === "reservation")
    return {
      title: `Your reservation — ${seed.business.name}`,
      description: `Find and manage your reservation at ${seed.business.name}.`,
      robots: { index: false, follow: false },
    };
  return { title: `${slug[0]?.replaceAll("-", " ") || "Studio"} — Reserv` };
}
export default function Page() {
  return <ReservApp />;
}
