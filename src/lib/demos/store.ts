import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { getCollections } from "@/config/demos";
import { createSeedData } from "@/lib/demos/seed";
import type {
  DemoDatabase,
  DemoProduct,
  DemoRecord,
} from "@/lib/demos/types";
import { dataRoot } from "@/lib/data-root";

const DEMO_DIR = dataRoot("demos");
const memory = new Map<DemoProduct, DemoDatabase>();

function fileFor(product: DemoProduct) {
  return path.join(DEMO_DIR, `${product}.json`);
}

function normalizeDb(product: DemoProduct, db: DemoDatabase): DemoDatabase {
  const next: DemoDatabase = {};
  for (const collection of getCollections(product)) {
    const rows = Array.isArray(db[collection.id]) ? db[collection.id] : [];
    next[collection.id] = rows;
  }
  return next;
}

function cloneDb(db: DemoDatabase): DemoDatabase {
  return JSON.parse(JSON.stringify(db)) as DemoDatabase;
}

async function ensureLoaded(product: DemoProduct): Promise<DemoDatabase> {
  const cached = memory.get(product);
  if (cached) return cloneDb(cached);

  await fs.mkdir(DEMO_DIR, { recursive: true });
  const file = fileFor(product);

  try {
    const raw = await Promise.race([
      fs.readFile(file, "utf8"),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("demo-read-timeout")), 3000),
      ),
    ]);
    const parsed = JSON.parse(raw) as DemoDatabase;
    const normalized = normalizeDb(product, parsed);
    memory.set(product, normalized);
    return cloneDb(normalized);
  } catch {
    const seed = createSeedData(product);
    memory.set(product, seed);
    try {
      await fs.writeFile(file, JSON.stringify(seed, null, 2), "utf8");
    } catch {
      // Memory still works even if disk write fails (OneDrive lock, etc.)
    }
    return cloneDb(seed);
  }
}

async function writeDb(product: DemoProduct, db: DemoDatabase) {
  memory.set(product, db);
  await fs.mkdir(DEMO_DIR, { recursive: true });
  try {
    await Promise.race([
      fs.writeFile(fileFor(product), JSON.stringify(db, null, 2), "utf8"),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("demo-write-timeout")), 3000),
      ),
    ]);
  } catch {
    // Keep serving from memory if disk is slow/locked
  }
}

export async function getDemoDatabase(product: DemoProduct) {
  return ensureLoaded(product);
}

export async function createDemoRecord(
  product: DemoProduct,
  collection: string,
  data: Record<string, string>,
) {
  const db = await ensureLoaded(product);
  if (!db[collection]) throw new Error("Invalid collection");
  const now = new Date().toISOString();
  const record: DemoRecord = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  db[collection].unshift(record);
  await writeDb(product, db);
  return record;
}

export async function updateDemoRecord(
  product: DemoProduct,
  collection: string,
  id: string,
  data: Record<string, string>,
) {
  const db = await ensureLoaded(product);
  const rows = db[collection];
  if (!rows) throw new Error("Invalid collection");
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return null;
  const updated: DemoRecord = {
    ...rows[index],
    ...data,
    id: rows[index].id,
    createdAt: rows[index].createdAt,
    updatedAt: new Date().toISOString(),
  };
  rows[index] = updated;
  await writeDb(product, db);
  return updated;
}

export async function deleteDemoRecord(
  product: DemoProduct,
  collection: string,
  id: string,
) {
  const db = await ensureLoaded(product);
  const rows = db[collection];
  if (!rows) throw new Error("Invalid collection");
  const next = rows.filter((row) => row.id !== id);
  if (next.length === rows.length) return false;
  db[collection] = next;
  await writeDb(product, db);
  return true;
}

export async function resetDemoDatabase(product: DemoProduct) {
  const seed = createSeedData(product);
  await writeDb(product, seed);
  return cloneDb(seed);
}

export async function resetAllDemos() {
  return {
    society: await resetDemoDatabase("society"),
    hospital: await resetDemoDatabase("hospital"),
  };
}
