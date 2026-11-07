import { createHmac, randomBytes, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { videoPublicBaseUrl, videoRetentionHours } from "@/lib/jarcode-ai/config";
import { dataRoot } from "@/lib/data-root";

export type VideoJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type VideoJob = {
  id: string;
  ownerKey: string;
  usageSubject: string;
  actorRole: string;
  conversationId?: string;
  provider: "luma";
  providerJobId?: string;
  status: VideoJobStatus;
  mode: "text" | "image";
  prompt: string;
  enhancedPrompt: string;
  aspectRatio: string;
  durationSec: number;
  quality: string;
  model: string;
  resolution?: string;
  sourceImageId?: string;
  mediaToken?: string;
  accessToken: string;
  localPath?: string;
  fileSize?: number;
  estimatedUsd: number;
  usageRecorded?: boolean;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expiresAt: string;
};

const DIR = dataRoot("ai", "videos");
const MEDIA_DIR = dataRoot("ai", "media-tokens");

function jobFile(id: string) {
  return path.join(DIR, `${id}.json`);
}

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
  return "jarcode-video-dev-secret";
}

export function signMediaToken(payload: string, ttlSec = 3600) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const body = Buffer.from(JSON.stringify({ p: payload, exp }), "utf8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyMediaToken(token: string): { p: string; exp: number } | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expect = createHmac("sha256", secret()).update(body).digest("base64url");
  if (expect !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      p: string;
      exp: number;
    };
    if (!data.p || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createVideoJob(opts: Omit<
  VideoJob,
  "id" | "status" | "createdAt" | "updatedAt" | "expiresAt" | "accessToken"
> & { accessToken?: string }) {
  await fs.mkdir(DIR, { recursive: true });
  const id = randomUUID();
  const now = new Date().toISOString();
  const hours = videoRetentionHours();
  const job: VideoJob = {
    ...opts,
    id,
    status: "queued",
    accessToken: opts.accessToken || randomBytes(24).toString("hex"),
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(Date.now() + hours * 3600_000).toISOString(),
  };
  await fs.writeFile(jobFile(id), JSON.stringify(job, null, 2), "utf8");
  return job;
}

export async function loadVideoJob(id: string) {
  try {
    const raw = await fs.readFile(jobFile(id), "utf8");
    return JSON.parse(raw) as VideoJob;
  } catch {
    return null;
  }
}

export async function saveVideoJob(job: VideoJob) {
  job.updatedAt = new Date().toISOString();
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(jobFile(job.id), JSON.stringify(job, null, 2), "utf8");
  return job;
}

export async function listVideoJobsForOwner(ownerKey: string, limit = 40) {
  await fs.mkdir(DIR, { recursive: true });
  const names = await fs.readdir(DIR).catch(() => [] as string[]);
  const jobs: VideoJob[] = [];
  for (const name of names) {
    if (!name.endsWith(".json") || name.endsWith(".mp4.json")) continue;
    try {
      const job = JSON.parse(await fs.readFile(path.join(DIR, name), "utf8")) as VideoJob;
      if (job.ownerKey === ownerKey) jobs.push(job);
    } catch {
      /* skip */
    }
  }
  jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return jobs.slice(0, limit);
}

export async function saveVideoBuffer(jobId: string, buf: Buffer) {
  await fs.mkdir(DIR, { recursive: true });
  const full = path.join(DIR, `${jobId}.mp4`);
  await fs.writeFile(full, buf);
  return full;
}

export async function readVideoBuffer(job: VideoJob) {
  if (!job.localPath) return null;
  try {
    return await fs.readFile(job.localPath);
  } catch {
    return null;
  }
}

export function videoPlaybackPath(job: VideoJob) {
  return `/api/ai/workspace/video/file/${job.id}?token=${encodeURIComponent(job.accessToken)}`;
}

export function publicImageUrlForUpload(uploadId: string) {
  const token = signMediaToken(`upload:${uploadId}`, 45 * 60);
  return `${videoPublicBaseUrl()}/api/ai/workspace/media/${token}`;
}

/** Register opaque media token mapping (optional extra store). */
export async function rememberMediaMapping(token: string, target: string) {
  await fs.mkdir(MEDIA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(MEDIA_DIR, `${token.slice(0, 32)}.json`),
    JSON.stringify({ target, at: new Date().toISOString() }),
    "utf8",
  );
}

export async function cleanupExpiredVideos() {
  await fs.mkdir(DIR, { recursive: true });
  const names = await fs.readdir(DIR).catch(() => [] as string[]);
  const now = Date.now();
  let removed = 0;
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    try {
      const job = JSON.parse(await fs.readFile(path.join(DIR, name), "utf8")) as VideoJob;
      if (new Date(job.expiresAt).getTime() > now) continue;
      if (job.localPath) await fs.unlink(job.localPath).catch(() => undefined);
      await fs.unlink(path.join(DIR, name)).catch(() => undefined);
      removed += 1;
    } catch {
      /* skip */
    }
  }
  return removed;
}

export async function videoStorageStats() {
  await fs.mkdir(DIR, { recursive: true });
  const names = await fs.readdir(DIR).catch(() => [] as string[]);
  let bytes = 0;
  let files = 0;
  let completed = 0;
  let failed = 0;
  let processing = 0;
  for (const name of names) {
    if (name.endsWith(".mp4")) {
      const st = await fs.stat(path.join(DIR, name)).catch(() => null);
      if (st) {
        bytes += st.size;
        files += 1;
      }
    }
    if (name.endsWith(".json")) {
      try {
        const job = JSON.parse(await fs.readFile(path.join(DIR, name), "utf8")) as VideoJob;
        if (job.status === "completed") completed += 1;
        else if (job.status === "failed") failed += 1;
        else if (job.status === "processing" || job.status === "queued") processing += 1;
      } catch {
        /* skip */
      }
    }
  }
  return { bytes, files, completed, failed, processing };
}
