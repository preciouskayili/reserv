import type { Metadata } from "next";
import { PublicProfile } from "@/components/public";
import { seed } from "@/lib/seed";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string }>;
}): Promise<Metadata> {
  const { slug = "" } = (await params) || {};
  if (slug === seed.business.slug) {
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
  }
  return {
    title: `${slug ? slug.replaceAll("-", " ") : "Studio"} — Reserv`,
  };
}

export default function PublicBusinessRoute() {
  return <PublicProfile />;
}
