import { promises as fs } from "fs";
import path from "path";
import { dataRoot } from "@/lib/data-root";
import type { CustomDemoBundle } from "@/lib/custom-demos/types";

type IndexEntry = {
  id: string;
  slug: string;
  businessName: string;
  niche: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  moduleCount: number;
};

type MemoryStore = {
  index: IndexEntry[];
  bundles: Map<string, CustomDemoBundle>;
};

declare global {
  // eslint-disable-next-line no-var
  var __jarcodeCustomDemos: MemoryStore | undefined;
}

function memory(): MemoryStore {
  if (!globalThis.__jarcodeCustomDemos) {
    globalThis.__jarcodeCustomDemos = {
      index: [],
      bundles: new Map(),
    };
  }
  return globalThis.__jarcodeCustomDemos;
}

const DIR = dataRoot("custom-demos");
const INDEX = path.join(DIR, "index.json");

function bundlePath(id: string) {
  return path.join(DIR, `${id}.json`);
}

function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function indexFromBundle(bundle: CustomDemoBundle): IndexEntry {
  const c = bundle.config;
  return {
    id: c.id,
    slug: c.slug,
    businessName: c.businessName,
    niche: c.niche,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    moduleCount: c.modules.length,
  };
}

async function readFsIndex(): Promise<IndexEntry[]> {
  try {
    const raw = await fs.readFile(INDEX, "utf8");
    const parsed = JSON.parse(raw) as IndexEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFsIndex(entries: IndexEntry[]) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(INDEX, JSON.stringify(entries, null, 2), "utf8");
}

async function readFsBundle(id: string): Promise<CustomDemoBundle | null> {
  try {
    const raw = await fs.readFile(bundlePath(id), "utf8");
    return JSON.parse(raw) as CustomDemoBundle;
  } catch {
    return null;
  }
}

async function writeFsBundle(bundle: CustomDemoBundle) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(
    bundlePath(bundle.config.id),
    JSON.stringify(bundle, null, 2),
    "utf8",
  );
}

async function readBlobIndex(): Promise<IndexEntry[]> {
  if (!blobEnabled()) return [];
  try {
    const { list } = await import("@vercel/blob");
    const listed = await list({ prefix: "custom-demos/index.json", limit: 1 });
    const hit = listed.blobs.find((b) => b.pathname === "custom-demos/index.json");
    if (!hit) return [];
    const res = await fetch(hit.url, { cache: "no-store" });
    if (!res.ok) return [];
    const parsed = (await res.json()) as IndexEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeBlobIndex(entries: IndexEntry[]) {
  if (!blobEnabled()) return;
  const { put } = await import("@vercel/blob");
  await put("custom-demos/index.json", JSON.stringify(entries), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function readBlobBundle(id: string): Promise<CustomDemoBundle | null> {
  if (!blobEnabled()) return null;
  try {
    const { list } = await import("@vercel/blob");
    const pathname = `custom-demos/${id}.json`;
    const listed = await list({ prefix: pathname, limit: 5 });
    const hit = listed.blobs.find((b) => b.pathname === pathname);
    if (!hit) return null;
    const res = await fetch(hit.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as CustomDemoBundle;
  } catch {
    return null;
  }
}

async function writeBlobBundle(bundle: CustomDemoBundle) {
  if (!blobEnabled()) return;
  const { put } = await import("@vercel/blob");
  await put(
    `custom-demos/${bundle.config.id}.json`,
    JSON.stringify(bundle),
    {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    },
  );
}

async function deleteBlobBundle(id: string) {
  if (!blobEnabled()) return;
  try {
    const { list, del } = await import("@vercel/blob");
    const pathname = `custom-demos/${id}.json`;
    const listed = await list({ prefix: pathname, limit: 5 });
    const urls = listed.blobs.filter((b) => b.pathname === pathname).map((b) => b.url);
    if (urls.length) await del(urls);
  } catch {
    /* ignore */
  }
}

export async function persistListIndex(): Promise<IndexEntry[]> {
  const mem = memory();
  const blob = await readBlobIndex();
  const disk = await readFsIndex();
  const byId = new Map<string, IndexEntry>();
  for (const e of [...disk, ...blob, ...mem.index]) byId.set(e.id, e);
  const merged = Array.from(byId.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  mem.index = merged;
  return merged;
}

export async function persistLoadBundle(
  idOrSlug: string,
): Promise<CustomDemoBundle | null> {
  const mem = memory();
  const direct = mem.bundles.get(idOrSlug);
  if (direct) return direct;
  for (const b of mem.bundles.values()) {
    if (b.config.slug === idOrSlug || b.config.id === idOrSlug) return b;
  }

  const fromFsDirect = await readFsBundle(idOrSlug);
  if (fromFsDirect) {
    mem.bundles.set(fromFsDirect.config.id, fromFsDirect);
    return fromFsDirect;
  }

  const index = await persistListIndex();
  const hit = index.find((e) => e.slug === idOrSlug || e.id === idOrSlug);
  if (!hit) {
    const fromBlobGuess = await readBlobBundle(idOrSlug);
    if (fromBlobGuess) {
      mem.bundles.set(fromBlobGuess.config.id, fromBlobGuess);
      return fromBlobGuess;
    }
    return null;
  }

  const fromMem = mem.bundles.get(hit.id);
  if (fromMem) return fromMem;

  const fromFs = await readFsBundle(hit.id);
  if (fromFs) {
    mem.bundles.set(hit.id, fromFs);
    return fromFs;
  }

  const fromBlob = await readBlobBundle(hit.id);
  if (fromBlob) {
    mem.bundles.set(hit.id, fromBlob);
    return fromBlob;
  }
  return null;
}

export async function persistSaveBundle(bundle: CustomDemoBundle) {
  const mem = memory();
  mem.bundles.set(bundle.config.id, bundle);
  const entry = indexFromBundle(bundle);
  mem.index = [entry, ...mem.index.filter((e) => e.id !== bundle.config.id)];

  await writeFsBundle(bundle).catch(() => undefined);
  await writeFsIndex(mem.index).catch(() => undefined);
  await writeBlobBundle(bundle).catch(() => undefined);
  await writeBlobIndex(mem.index).catch(() => undefined);
  return bundle;
}

export async function persistDeleteBundle(id: string) {
  const mem = memory();
  mem.bundles.delete(id);
  mem.index = mem.index.filter((e) => e.id !== id);
  await fs.unlink(bundlePath(id)).catch(() => undefined);
  await writeFsIndex(mem.index).catch(() => undefined);
  await deleteBlobBundle(id);
  await writeBlobIndex(mem.index).catch(() => undefined);
}

export function blobStorageConfigured() {
  return blobEnabled();
}
