import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  generateTempPassword,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/passwords";
import type { DemoProduct } from "@/lib/demos/types";
import { createEmptyTenantDatabase } from "@/lib/tenants/store";
import type { ClientAccount, ClientPublic, ClientStatus } from "@/lib/clients/types";

const FILE = path.join(process.cwd(), "data", "clients", "clients.json");

function toPublic(client: ClientAccount): ClientPublic {
  const { passwordHash: _p, ...rest } = client;
  return rest;
}

async function readAll(): Promise<ClientAccount[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as ClientAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(clients: ClientAccount[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(clients, null, 2), "utf8");
}

export async function listClients() {
  const clients = await readAll();
  return clients
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toPublic);
}

export async function getClientById(id: string) {
  const clients = await readAll();
  return clients.find((c) => c.id === id) || null;
}

export async function getClientByEmail(email: string) {
  const clients = await readAll();
  const key = email.trim().toLowerCase();
  return clients.find((c) => c.email === key) || null;
}

export async function createClient(input: {
  name: string;
  email: string;
  phone: string;
  erp: DemoProduct;
  password?: string;
}) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  if (!name || !email || !phone) throw new Error("Name, email, and phone are required.");
  if (!email.includes("@")) throw new Error("Enter a valid client email.");
  if (input.erp !== "hospital" && input.erp !== "society") {
    throw new Error("Select Hospital or Society ERP.");
  }

  const existing = await getClientByEmail(email);
  if (existing) throw new Error("A client with this email already exists.");

  const tempPassword = input.password?.trim() || generateTempPassword(12);
  if (tempPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  const now = new Date().toISOString();
  const tenantId = randomUUID();
  const client: ClientAccount = {
    id: randomUUID(),
    tenantId,
    name,
    email,
    phone,
    erp: input.erp,
    passwordHash: hashPassword(tempPassword),
    status: "active",
    mustChangePassword: !input.password?.trim(),
    createdAt: now,
    updatedAt: now,
  };

  await createEmptyTenantDatabase(tenantId, input.erp);

  const clients = await readAll();
  clients.push(client);
  await writeAll(clients);

  return {
    client: toPublic(client),
    temporaryPassword: tempPassword,
  };
}

export async function updateClient(
  id: string,
  patch: Partial<
    Pick<ClientAccount, "name" | "email" | "phone" | "erp" | "status" | "mustChangePassword">
  >,
) {
  const clients = await readAll();
  const index = clients.findIndex((c) => c.id === id);
  if (index < 0) return null;

  if (patch.email) {
    const email = patch.email.trim().toLowerCase();
    const clash = clients.find((c) => c.email === email && c.id !== id);
    if (clash) throw new Error("Another client already uses this email.");
    patch.email = email;
  }

  clients[index] = {
    ...clients[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeAll(clients);
  return toPublic(clients[index]);
}

export async function resetClientPassword(id: string, password?: string) {
  const clients = await readAll();
  const index = clients.findIndex((c) => c.id === id);
  if (index < 0) return null;
  const tempPassword = password?.trim() || generateTempPassword(12);
  clients[index] = {
    ...clients[index],
    passwordHash: hashPassword(tempPassword),
    mustChangePassword: true,
    updatedAt: new Date().toISOString(),
  };
  await writeAll(clients);
  return { client: toPublic(clients[index]), temporaryPassword: tempPassword };
}

export async function deleteClient(id: string) {
  const clients = await readAll();
  const target = clients.find((c) => c.id === id);
  if (!target) return false;
  await writeAll(clients.filter((c) => c.id !== id));
  // Keep tenant data folder as backup; admin can purge later if needed
  return true;
}

export async function authenticateClient(email: string, password: string) {
  const client = await getClientByEmail(email);
  if (!client) return null;
  if (client.status !== "active") return null;
  if (!verifyPassword(password, client.passwordHash)) return null;

  const clients = await readAll();
  const index = clients.findIndex((c) => c.id === client.id);
  if (index >= 0) {
    clients[index] = {
      ...clients[index],
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await writeAll(clients);
  }

  return toPublic(client);
}

export async function changeClientPassword(
  clientId: string,
  currentPassword: string,
  newPassword: string,
) {
  const clients = await readAll();
  const index = clients.findIndex((c) => c.id === clientId);
  if (index < 0) throw new Error("Client not found.");
  if (!verifyPassword(currentPassword, clients[index].passwordHash)) {
    throw new Error("Current password is incorrect.");
  }
  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters.");
  }
  clients[index] = {
    ...clients[index],
    passwordHash: hashPassword(newPassword),
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  };
  await writeAll(clients);
  return toPublic(clients[index]);
}

export async function setClientStatus(id: string, status: ClientStatus) {
  return updateClient(id, { status });
}
