import { createHash, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";
import { dataRoot } from "@/lib/data-root";

export type AdminCredentials = {
  email: string;
  passwordHash: string;
  updatedAt: string;
};

const FILE = dataRoot("admin", "credentials.json");

function safeEqualString(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function adminEnvEmail() {
  return (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
}

export function adminEnvPassword() {
  return (process.env.ADMIN_PASSWORD || "").trim();
}

async function readFileCreds(): Promise<AdminCredentials | null> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as AdminCredentials;
    if (parsed.email && parsed.passwordHash) return parsed;
  } catch {
    /* missing */
  }
  return null;
}

async function writeFileCreds(creds: AdminCredentials) {
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(creds, null, 2), "utf8");
  } catch {
    /* Vercel /tmp may still fail intermittently — env auth remains valid */
  }
}

/** Prefer live env credentials (works on Vercel). File hash is optional override after admin change. */
export async function getAdminCredentials() {
  const email = adminEnvEmail();
  const password = adminEnvPassword();
  if (!email || !password) {
    const file = await readFileCreds();
    if (file) return file;
    throw new Error(
      "Admin credentials are not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in server environment variables.",
    );
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  const file = await readFileCreds();
  // If file email matches env email, keep file hash (supports password change via admin UI).
  if (file && file.email === email) {
    return file;
  }

  const creds: AdminCredentials = {
    email,
    passwordHash: hashPassword(password),
    updatedAt: new Date().toISOString(),
  };
  await writeFileCreds(creds);
  return creds;
}

export async function validateAdminLogin(email: string, password: string) {
  const inputEmail = email.trim().toLowerCase();
  const inputPassword = password;
  if (!inputEmail || !inputPassword) return false;

  const envEmail = adminEnvEmail();
  const envPassword = adminEnvPassword();

  // Always accept current env credentials first (fixes Vercel + password updates).
  if (envEmail && envPassword) {
    if (
      safeEqualString(inputEmail, envEmail) &&
      safeEqualString(inputPassword, envPassword)
    ) {
      return true;
    }
  }

  try {
    const creds = await getAdminCredentials();
    if (inputEmail !== creds.email) return false;
    return verifyPassword(inputPassword, creds.passwordHash);
  } catch {
    return false;
  }
}

export async function updateAdminCredentials(input: {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
}) {
  const creds = await getAdminCredentials();
  const okEnv =
    Boolean(adminEnvEmail()) &&
    (await validateAdminLogin(creds.email, input.currentPassword));
  const okFile = verifyPassword(input.currentPassword, creds.passwordHash);
  if (!okEnv && !okFile) {
    throw new Error("Current password is incorrect.");
  }

  const nextEmail = (input.newEmail || creds.email).trim().toLowerCase();
  if (!nextEmail || !nextEmail.includes("@")) {
    throw new Error("Enter a valid admin email.");
  }

  let passwordHash = creds.passwordHash;
  if (input.newPassword) {
    if (input.newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters.");
    }
    passwordHash = hashPassword(input.newPassword);
  }

  const next: AdminCredentials = {
    email: nextEmail,
    passwordHash,
    updatedAt: new Date().toISOString(),
  };
  await writeFileCreds(next);
  return { email: next.email, updatedAt: next.updatedAt };
}

/** Stable session secret fallback so Vercel works with only ADMIN_PASSWORD set. */
export function deriveSessionSecretFallback() {
  const pass = adminEnvPassword();
  if (!pass) return "";
  return createHash("sha256").update(`jarcode-admin-session|${pass}`).digest("hex");
}
