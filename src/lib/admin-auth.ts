import { cookies } from "next/headers";
import {
  getAdminCredentials,
  validateAdminLogin,
} from "@/lib/admin/credentials";
import { createSignedToken, verifySignedToken } from "@/lib/auth/session";
import { cookieSecureSync } from "@/lib/cookie-secure";

const COOKIE_NAME = "jarcode_admin_session";
const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export async function validateAdminCredentials(email: string, password: string) {
  return validateAdminLogin(email, password);
}

export function createSessionToken(email: string) {
  return createSignedToken([email.trim().toLowerCase(), "admin"], SESSION_MS);
}

export async function verifySessionToken(token: string | undefined | null) {
  const parts = verifySignedToken(token, 2);
  if (!parts) return false;
  const [email, role] = parts;
  if (role !== "admin") return false;
  const creds = await getAdminCredentials();
  return email === creds.email;
}

export async function isAdminAuthenticated() {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE_NAME)?.value);
}

export async function getAdminSessionEmail() {
  const jar = await cookies();
  const parts = verifySignedToken(jar.get(COOKIE_NAME)?.value, 2);
  if (!parts || parts[1] !== "admin") return null;
  const creds = await getAdminCredentials();
  return parts[0] === creds.email ? parts[0] : null;
}

function cookieSecure() {
  return cookieSecureSync();
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure(),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure(),
    path: "/",
    maxAge: 0,
  };
}

export { COOKIE_NAME };
