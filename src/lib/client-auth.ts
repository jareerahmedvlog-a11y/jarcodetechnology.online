import { cookies } from "next/headers";
import { createSignedToken, verifySignedToken } from "@/lib/auth/session";
import { getClientById } from "@/lib/clients/store";
import type { ClientPublic } from "@/lib/clients/types";
import { cookieSecureSync } from "@/lib/cookie-secure";

const COOKIE_NAME = "jarcode_client_session";
const SESSION_DAYS = 14;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export function createClientSessionToken(client: ClientPublic) {
  return createSignedToken(
    [client.id, client.tenantId, client.erp, "client"],
    SESSION_MS,
  );
}

export async function getClientSession(): Promise<ClientPublic | null> {
  const jar = await cookies();
  const parts = verifySignedToken(jar.get(COOKIE_NAME)?.value, 4);
  if (!parts) return null;
  const [clientId, tenantId, erp, role] = parts;
  if (role !== "client") return null;
  const client = await getClientById(clientId);
  if (!client) return null;
  if (client.status !== "active") return null;
  if (client.tenantId !== tenantId || client.erp !== erp) return null;
  return client;
}

function cookieSecure() {
  return cookieSecureSync();
}

export function clientSessionCookieOptions(token: string) {
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

export function clearClientSessionCookieOptions() {
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

export { COOKIE_NAME as CLIENT_COOKIE_NAME };
