import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { maxUploadBytes } from "@/lib/jarcode-ai/config";
import { dataRoot } from "@/lib/data-root";

const UPLOAD_DIR = dataRoot("ai", "uploads");

const ALLOWED_EXT = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".rtf",
  ".md",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".csv",
  ".tsv",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".mp4",
  ".webm",
  ".mov",
  ".json",
  ".html",
  ".css",
  ".js",
  ".ts",
  ".tsx",
  ".py",
]);

export type StoredUpload = {
  id: string;
  originalName: string;
  mime: string;
  size: number;
  path: string;
  ext: string;
  isImage: boolean;
  isVideo: boolean;
  createdAt: string;
};

export function isAllowedUpload(name: string, mime: string) {
  const ext = path.extname(name || "").toLowerCase();
  if (!ALLOWED_EXT.has(ext)) return false;
  if (mime && /php|exe|octet-stream/i.test(mime) && !ALLOWED_EXT.has(ext)) return false;
  return true;
}

export async function saveUploadBuffer(opts: {
  originalName: string;
  mime: string;
  buffer: Buffer;
}) {
  const ext = path.extname(opts.originalName || "").toLowerCase() || ".bin";
  if (ext === ".heic" || ext === ".heif" || /image\/hei[cf]/i.test(opts.mime)) {
    throw new Error(
      "iPhone HEIC photos are not supported for AI edit. In Photos, export as JPEG, or in iPhone Settings → Camera → Formats choose Most Compatible, then upload again.",
    );
  }
  if (!isAllowedUpload(opts.originalName, opts.mime)) {
    throw new Error("File type not allowed. Use JPEG, PNG, WEBP, PDF, or Office documents.");
  }
  if (opts.buffer.length > maxUploadBytes()) {
    throw new Error(`File too large. Max ${Math.floor(maxUploadBytes() / (1024 * 1024))} MB.`);
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const id = randomUUID();
  const filename = `${id}${ext}`;
  const full = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(full, opts.buffer);
  const meta: StoredUpload = {
    id,
    originalName: opts.originalName.slice(0, 180),
    mime: opts.mime || "application/octet-stream",
    size: opts.buffer.length,
    path: full,
    ext,
    isImage: [".jpg", ".jpeg", ".png", ".webp"].includes(ext),
    isVideo: [".mp4", ".webm", ".mov"].includes(ext),
    createdAt: new Date().toISOString(),
  };
  await fs.writeFile(path.join(UPLOAD_DIR, `${id}.json`), JSON.stringify(meta, null, 2), "utf8");
  return meta;
}

export async function loadUpload(id: string) {
  try {
    const raw = await fs.readFile(path.join(UPLOAD_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as StoredUpload;
  } catch {
    return null;
  }
}

export async function readUploadBytes(id: string) {
  const meta = await loadUpload(id);
  if (!meta) return null;
  const buf = await fs.readFile(meta.path);
  return { meta, buf };
}

export async function deleteUpload(id: string) {
  const meta = await loadUpload(id);
  if (!meta) return;
  await fs.unlink(meta.path).catch(() => undefined);
  await fs.unlink(path.join(UPLOAD_DIR, `${id}.json`)).catch(() => undefined);
}

/** Persist a generated PNG so the chat can show a stable URL (not only base64). */
export async function saveGeneratedImagePng(buffer: Buffer, label = "jarcode-ai") {
  const safe = String(label || "jarcode-ai")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  return saveUploadBuffer({
    originalName: `${safe || "jarcode-ai"}-${Date.now()}.png`,
    mime: "image/png",
    buffer,
  });
}

export function generatedImagePath(id: string) {
  return `/api/ai/workspace/generated/${encodeURIComponent(id)}`;
}
