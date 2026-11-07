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

function cleanEnv(value: string | undefined) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^\uFEFF/, "");
}

function safeEqualString(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function adminEnvEmail() {
  return cleanEnv(process.env.ADMIN_EMAIL).toLowerCase();
}

export function adminEnvPassword() {
  return cleanEnv(process.env.ADMIN_PASSWORD);
}

export function adminCredentialsConfigured() {
  const email = adminEnvEmail();
  const password = adminEnvPassword();
  return {
    emailConfigured: Boolean(email),
    passwordConfigured: Boolean(password),
    passwordLength: password.length,
    emailMasked: email
      ? `${email.slice(0, 3)}***${email.includes("@") ? email.slice(email.indexOf("@")) : ""}`
      : "",
  };
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
    /* ignore on serverless */
  }
}

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

  const creds: AdminCredentials = {
    email,
    passwordHash: hashPassword(password),
    updatedAt: new Date().toISOString(),
  };
  // Keep a local cache copy when possible, but env remains source of truth.
  await writeFileCreds(creds);
  return { email, passwordHash: creds.passwordHash, updatedAt: creds.updatedAt };
}

export async function validateAdminLogin(email: string, password: string) {
  const inputEmail = cleanEnv(email).toLowerCase();
  const inputPassword = cleanEnv(password);
  if (!inputEmail || !inputPassword) return false;

  const envEmail = adminEnvEmail();
  const envPassword = adminEnvPassword();

  // On Vercel/production env vars are required and are the only source of truth.
  if (envEmail && envPassword) {
    return (
      safeEqualString(inputEmail, envEmail) &&
      safeEqualString(inputPassword, envPassword)
    );
  }

  // Local fallback only when env is missing.
  try {
    const file = await readFileCreds();
    if (!file) return false;
    if (inputEmail !== file.email) return false;
    return verifyPassword(inputPassword, file.passwordHash);
  } catch {
    return false;
  }
}

export async function updateAdminCredentials(input: {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
}) {
  const currentEmail = adminEnvEmail();
  if (!currentEmail || !(await validateAdminLogin(currentEmail, input.currentPassword))) {
    throw new Error(
      "Password change on Vercel must be done in Environment Variables (ADMIN_EMAIL / ADMIN_PASSWORD).",
    );
  }

  const nextEmail = cleanEnv(input.newEmail || currentEmail).toLowerCase();
  if (!nextEmail || !nextEmail.includes("@")) {
    throw new Error("Enter a valid admin email.");
  }
  if (input.newPassword && input.newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters.");
  }

  // File cache only — remind that Vercel env must be updated for persistence.
  const password = cleanEnv(input.newPassword || adminEnvPassword());
  await writeFileCreds({
    email: nextEmail,
    passwordHash: hashPassword(password),
    updatedAt: new Date().toISOString(),
  });
  return {
    email: nextEmail,
    updatedAt: new Date().toISOString(),
    notice:
      "For Vercel, also update ADMIN_EMAIL / ADMIN_PASSWORD in Environment Variables and Redeploy.",
  };
}

export function deriveSessionSecretFallback() {
  const pass = adminEnvPassword();
  if (!pass) return "";
  return createHash("sha256").update(`jarcode-admin-session|${pass}`).digest("hex");
}
