import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { cookieSecure } from "@/lib/cookie-secure";

const COOKIE = "jarcode_ai_anon";

export async function getOrCreateAnonId() {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value?.trim();
  if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) return existing;
  const id = randomUUID().replace(/-/g, "").slice(0, 24);
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
    secure: await cookieSecure(),
  });
  return id;
}

export async function getAnonId() {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value?.trim();
  if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) return existing;
  return "";
}
