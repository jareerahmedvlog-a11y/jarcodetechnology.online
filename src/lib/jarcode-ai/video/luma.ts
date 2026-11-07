/**
 * Luma Dream Machine video API client.
 * Docs: https://docs.lumalabs.ai/docs/video-generation
 * OpenAI /v1/videos (Sora) is discontinued — do not use it here.
 */

export type LumaAspect = "16:9" | "9:16" | "1:1";
export type LumaDuration = "5s" | "9s";
export type LumaResolution = "540p" | "720p" | "1080p";

export type LumaGeneration = {
  id: string;
  state?: string;
  failure_reason?: string | null;
  assets?: { video?: string; image?: string };
  request?: unknown;
};

const BASE = "https://api.lumalabs.ai/dream-machine/v1";

export function mapDurationSec(sec: number): LumaDuration {
  return sec >= 8 ? "9s" : "5s";
}

export function mapQualityToLuma(quality: string): {
  model: string;
  resolution: LumaResolution;
} {
  if (quality === "highest") {
    return {
      model: process.env.VIDEO_MODEL?.trim() || "ray-2",
      resolution: "1080p",
    };
  }
  if (quality === "high") {
    return {
      model: process.env.VIDEO_MODEL?.trim() || "ray-2",
      resolution: "720p",
    };
  }
  return {
    model: process.env.VIDEO_FLASH_MODEL?.trim() || "ray-flash-2",
    resolution: "720p",
  };
}

export function supportedVideoSettings() {
  return {
    provider: "luma" as const,
    aspectRatios: [
      { id: "16:9", label: "16:9 Landscape" },
      { id: "9:16", label: "9:16 Portrait" },
      { id: "1:1", label: "1:1 Square" },
    ],
    durations: [
      { id: 5, label: "5 seconds" },
      { id: 9, label: "9 seconds" },
    ],
    qualities: [
      { id: "standard", label: "Standard (Ray Flash)" },
      { id: "high", label: "High (Ray 2 720p)" },
      { id: "highest", label: "Highest (Ray 2 1080p)" },
    ],
  };
}

export async function lumaCreateGeneration(opts: {
  apiKey: string;
  prompt: string;
  model: string;
  aspectRatio: LumaAspect;
  duration: LumaDuration;
  resolution: LumaResolution;
  imageUrl?: string;
}) {
  const body: Record<string, unknown> = {
    prompt: opts.prompt.slice(0, 4000),
    model: opts.model,
    aspect_ratio: opts.aspectRatio,
    duration: opts.duration,
    resolution: opts.resolution,
  };
  if (opts.imageUrl) {
    body.keyframes = {
      frame0: { type: "image", url: opts.imageUrl },
    };
  }

  const res = await fetch(`${BASE}/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as LumaGeneration & {
    detail?: string;
    failure_reason?: string;
  };
  if (!res.ok) {
    const msg =
      json.failure_reason ||
      json.detail ||
      (typeof json === "object" ? JSON.stringify(json).slice(0, 240) : "Luma error");
    throw new Error(msg || `Luma HTTP ${res.status}`);
  }
  if (!json.id) throw new Error("Luma did not return a generation id.");
  return json;
}

export async function lumaGetGeneration(apiKey: string, id: string) {
  const res = await fetch(`${BASE}/generations/${encodeURIComponent(id)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as LumaGeneration & {
    detail?: string;
  };
  if (!res.ok) {
    throw new Error(json.detail || `Luma status HTTP ${res.status}`);
  }
  return json;
}

export async function downloadRemoteVideo(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not download provider video (${res.status}).`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error("Provider returned an empty video.");
  return buf;
}
