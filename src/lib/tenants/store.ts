import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { getCollections } from "@/config/demos";
import type {
  DemoDatabase,
  DemoProduct,
  DemoRecord,
} from "@/lib/demos/types";

const TENANT_ROOT = path.join(process.cwd(), "data", "tenants");

function fileFor(tenantId: string) {
  return path.join(TENANT_ROOT, tenantId, "erp.json");
}

function emptyDb(product: DemoProduct): DemoDatabase {
  const db: DemoDatabase = {};
  for (const collection of getCollections(product)) {
    db[collection.id] = [];
  }
  return db;
}

function cloneDb(db: DemoDatabase): DemoDatabase {
  return JSON.parse(JSON.stringify(db)) as DemoDatabase;
}

type TenantFile = {
  tenantId: string;
  product: DemoProduct;
  updatedAt: string;
  data: DemoDatabase;
};

async function readTenant(tenantId: string): Promise<TenantFile | null> {
  try {
    const raw = await fs.readFile(fileFor(tenantId), "utf8");
    return JSON.parse(raw) as TenantFile;
  } catch {
    return null;
  }
}

async function writeTenant(file: TenantFile) {
  const dir = path.dirname(fileFor(file.tenantId));
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(fileFor(file.tenantId), JSON.stringify(file, null, 2), "utf8");
}

export async function createEmptyTenantDatabase(
  tenantId: string,
  product: DemoProduct,
) {
  const file: TenantFile = {
    tenantId,
    product,
    updatedAt: new Date().toISOString(),
    data: emptyDb(product),
  };
  await writeTenant(file);
  return cloneDb(file.data);
}

export async function getTenantDatabase(tenantId: string, product: DemoProduct) {
  const file = await readTenant(tenantId);
  if (!file) {
    return createEmptyTenantDatabase(tenantId, product);
  }
  if (file.product !== product) {
    throw new Error("Tenant ERP product mismatch.");
  }
  // Ensure all collections exist (safe schema evolve)
  const next = emptyDb(product);
  for (const key of Object.keys(next)) {
    next[key] = Array.isArray(file.data[key]) ? file.data[key] : [];
  }
  return cloneDb(next);
}

async function save(tenantId: string, product: DemoProduct, data: DemoDatabase) {
  await writeTenant({
    tenantId,
    product,
    updatedAt: new Date().toISOString(),
    data,
  });
}

export async function createTenantRecord(
  tenantId: string,
  product: DemoProduct,
  collection: string,
  data: Record<string, string>,
) {
  const db = await getTenantDatabase(tenantId, product);
  if (!db[collection]) throw new Error("Invalid collection");
  const now = new Date().toISOString();
  const record: DemoRecord = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  db[collection].unshift(record);
  await save(tenantId, product, db);
  return record;
}

export async function updateTenantRecord(
  tenantId: string,
  product: DemoProduct,
  collection: string,
  id: string,
  data: Record<string, string>,
) {
  const db = await getTenantDatabase(tenantId, product);
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
  await save(tenantId, product, db);
  return updated;
}

export async function deleteTenantRecord(
  tenantId: string,
  product: DemoProduct,
  collection: string,
  id: string,
) {
  const db = await getTenantDatabase(tenantId, product);
  const rows = db[collection];
  if (!rows) throw new Error("Invalid collection");
  const next = rows.filter((row) => row.id !== id);
  if (next.length === rows.length) return false;
  db[collection] = next;
  await save(tenantId, product, db);
  return true;
}
