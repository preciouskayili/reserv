import type { NextConfig } from "next";

if (process.env.RAILWAY_ENVIRONMENT_ID) {
  const value = process.env.NEXT_PUBLIC_API_URL;
  let valid = false;
  try {
    const url = new URL(value ?? "");
    valid = url.protocol === "https:" && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash && !["localhost", "127.0.0.1"].includes(url.hostname);
  } catch { /* Report a configuration error before publishing a broken client. */ }
  if (!valid) throw new Error("Set NEXT_PUBLIC_API_URL to the public HTTPS backend origin before building on Railway.");
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
