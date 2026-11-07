import type { NextConfig } from "next";

/** Set STATIC_EXPORT=1 for Namecheap/cPanel `out/` static zip (no Node APIs). */
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport
    ? {
        output: "export" as const,
        trailingSlash: true,
      }
    : {}),
  // Phone / LAN testing: without this, Next.js blocks React hydration on the
  // network IP and every button (including the 3-line menu) appears dead.
  allowedDevOrigins: [
    "192.168.10.24",
    "192.168.111.1",
    "192.168.217.1",
    "190.102.3.86",
    "127.0.0.1",
    "localhost",
  ],
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: staticExport,
  },
};

export default nextConfig;
