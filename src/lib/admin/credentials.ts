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

async function ensureMigrated(): Promise<AdminCredentials> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as AdminCredentials;
    if (parsed.email && parsed.passwordHash) return parsed;
  } catch {
    // migrate from env / defaults once
  }

  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || "").trim();
  if (!email || !password) {
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
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(creds, null, 2), "utf8");
  } catch {
    // Vercel/serverless filesystem may be read-only — env-based auth still works in-memory.
  }
  return creds;
}

export async function getAdminCredentials() {
  return ensureMigrated();
}

export async function validateAdminLogin(email: string, password: string) {
  const creds = await ensureMigrated();
  if (email.trim().toLowerCase() !== creds.email) return false;
  return verifyPassword(password, creds.passwordHash);
}

export async function updateAdminCredentials(input: {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
}) {
  const creds = await ensureMigrated();
  if (!verifyPassword(input.currentPassword, creds.passwordHash)) {
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
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8");
  return { email: next.email, updatedAt: next.updatedAt };
}
