import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export type Inquiry = {
  id: string;
  fullName: string;
  businessName: string | null;
  email: string;
  phone: string;
  service: string;
  budget: string | null;
  details: string;
  submittedAt: string;
  source: "website" | "admin";
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "inquiries.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

export async function listInquiries(): Promise<Inquiry[]> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as Inquiry[];
    return Array.isArray(parsed)
      ? parsed.sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
        )
      : [];
  } catch {
    return [];
  }
}

async function writeAll(items: Inquiry[]) {
  await ensureStore();
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}

export async function createInquiry(
  input: Omit<Inquiry, "id" | "submittedAt"> & { submittedAt?: string },
): Promise<Inquiry> {
  const items = await listInquiries();
  const inquiry: Inquiry = {
    id: randomUUID(),
    fullName: input.fullName,
    businessName: input.businessName,
    email: input.email,
    phone: input.phone,
    service: input.service,
    budget: input.budget,
    details: input.details,
    submittedAt: input.submittedAt || new Date().toISOString(),
    source: input.source,
  };
  items.unshift(inquiry);
  await writeAll(items);
  return inquiry;
}

export async function deleteInquiry(id: string): Promise<boolean> {
  const items = await listInquiries();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) return false;
  await writeAll(next);
  return true;
}
