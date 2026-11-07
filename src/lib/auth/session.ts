import { createHmac, timingSafeEqual } from "crypto";

function secret() {
  const fromEnv =
    process.env.AUTH_SESSION_SECRET?.trim() ||
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    "";
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SESSION_SECRET (or ADMIN_SESSION_SECRET) must be set in production.",
    );
  }
  // Local-only fallback — never used on Vercel/production
  return "jarcode-dev-session-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createSignedToken(parts: string[], ttlMs: number) {
  const exp = String(Date.now() + ttlMs);
  const payload = [...parts, exp].join("|");
  return `${payload}|${sign(payload)}`;
}

export function verifySignedToken(token: string | undefined | null, expectedParts: number) {
  if (!token) return null;
  const chunks = token.split("|");
  // parts + exp + signature
  if (chunks.length !== expectedParts + 2) return null;
  const signature = chunks[chunks.length - 1];
  const payload = chunks.slice(0, -1).join("|");
  if (!safeEqual(sign(payload), signature)) return null;
  const exp = Number(chunks[chunks.length - 2]);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  return chunks.slice(0, expectedParts);
}
