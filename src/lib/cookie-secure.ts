import { headers } from "next/headers";

/**
 * Secure cookies on HTTPS (production + tunnels). Keep off for plain LAN HTTP.
 * Honors COOKIE_SECURE=true|false override; otherwise uses x-forwarded-proto / site URL.
 */
export async function cookieSecure() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  try {
    const h = await headers();
    const proto = (h.get("x-forwarded-proto") || "").split(",")[0]?.trim();
    if (proto === "https") return true;
    if (proto === "http") return false;
  } catch {
    /* headers() unavailable outside request */
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  return site.startsWith("https://");
}

/** Sync fallback for non-async cookie helpers (env / site URL only). */
export function cookieSecureSync() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  return site.startsWith("https://");
}
