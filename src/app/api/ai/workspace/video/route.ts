import { resolveAiActor, usageSubject } from "@/lib/jarcode-ai/actor";
import { getOrCreateAnonId } from "@/lib/jarcode-ai/anon";
import {
  estimateVideoCostUsd,
  videoGenerationApiKey,
  videoProvider,
} from "@/lib/jarcode-ai/config";
import { ownerKey } from "@/lib/jarcode-ai/conversations";
import { loadUpload } from "@/lib/jarcode-ai/uploads";
import { checkAiBudget, recordVideoUsage } from "@/lib/jarcode-ai/usage";
import { enhanceVideoPrompt } from "@/lib/jarcode-ai/video/enhance";
import {
  cleanupExpiredVideos,
  createVideoJob,
  loadVideoJob,
  publicImageUrlForUpload,
  saveVideoBuffer,
  saveVideoJob,
  videoPlaybackPath,
} from "@/lib/jarcode-ai/video/jobs";
import {
  downloadRemoteVideo,
  lumaCreateGeneration,
  lumaGetGeneration,
  mapDurationSec,
  mapQualityToLuma,
  supportedVideoSettings,
} from "@/lib/jarcode-ai/video/luma";
import { rateLimit } from "@/lib/demos/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon"
  );
}

function setupHelp() {
  return {
    provider: "luma",
    message:
      "Video generation requires a Luma Dream Machine API key. OpenAI chat/image keys are not used for video.",
    steps: [
      "Create an account at https://platform.lumalabs.ai/",
      "Generate an API key from the Luma API Platform.",
      "Add to server .env.local (never NEXT_PUBLIC_):",
      "VIDEO_GENERATION_API_KEY=luma-xxxxxxxx",
      "VIDEO_PROVIDER=luma",
      "Restart the production server after saving.",
      "Optional: VIDEO_DAILY_LIMIT=8 VIDEO_MONTHLY_LIMIT=40 VIDEO_PER_USER_DAILY_LIMIT=3",
    ],
  };
}

function publicJob(job: Awaited<ReturnType<typeof loadVideoJob>>) {
  if (!job) return null;
  return {
    id: job.id,
    status: job.status,
    mode: job.mode,
    prompt: job.prompt,
    enhancedPrompt: job.enhancedPrompt,
    aspectRatio: job.aspectRatio,
    durationSec: job.durationSec,
    quality: job.quality,
    model: job.model,
    resolution: job.resolution,
    provider: job.provider,
    estimatedUsd: job.estimatedUsd,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
    videoUrl: job.status === "completed" ? videoPlaybackPath(job) : undefined,
  };
}

async function refreshJob(jobId: string, owner: string) {
  const job = await loadVideoJob(jobId);
  if (!job || job.ownerKey !== owner) return null;
  if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
    return job;
  }

  const apiKey = videoGenerationApiKey();
  if (!apiKey || !job.providerJobId) return job;

  try {
    const gen = await lumaGetGeneration(apiKey, job.providerJobId);
    const state = (gen.state || "").toLowerCase();
    if (state === "completed" || state === "succeeded" || state === "success") {
      const remote = gen.assets?.video;
      if (!remote) {
        job.status = "failed";
        job.error = "Provider finished without a video URL.";
        if (!job.usageRecorded) {
          await recordVideoUsage({
            subject: job.usageSubject || job.ownerKey,
            ownerKey: job.ownerKey,
            role: job.actorRole || "public",
            model: job.model,
            provider: job.provider,
            durationSec: job.durationSec,
            quality: job.quality,
            success: false,
            estimatedUsd: 0,
          });
          job.usageRecorded = true;
        }
        return saveVideoJob(job);
      }
      const buf = await downloadRemoteVideo(remote);
      const localPath = await saveVideoBuffer(job.id, buf);
      job.localPath = localPath;
      job.fileSize = buf.length;
      job.status = "completed";
      job.completedAt = new Date().toISOString();
      if (!job.usageRecorded) {
        await recordVideoUsage({
          subject: job.usageSubject || job.ownerKey,
          ownerKey: job.ownerKey,
          role: job.actorRole || "public",
          model: job.model,
          provider: job.provider,
          durationSec: job.durationSec,
          quality: job.quality,
          success: true,
          estimatedUsd: job.estimatedUsd,
        });
        job.usageRecorded = true;
      }
      return saveVideoJob(job);
    }
    if (state === "failed" || state === "error" || state === "canceled" || state === "cancelled") {
      job.status = state.includes("cancel") ? "cancelled" : "failed";
      job.error = gen.failure_reason || `Provider state: ${gen.state}`;
      if (!job.usageRecorded) {
        await recordVideoUsage({
          subject: job.usageSubject || job.ownerKey,
          ownerKey: job.ownerKey,
          role: job.actorRole || "public",
          model: job.model,
          provider: job.provider,
          durationSec: job.durationSec,
          quality: job.quality,
          success: false,
          estimatedUsd: job.estimatedUsd * 0.25,
        });
        job.usageRecorded = true;
      }
      return saveVideoJob(job);
    }
    job.status = "processing";
    return saveVideoJob(job);
  } catch (err) {
    job.error = err instanceof Error ? err.message : "Status check failed.";
    return saveVideoJob(job);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("settings") === "1") {
    return Response.json({
      ok: true,
      configured: Boolean(videoGenerationApiKey()),
      provider: videoProvider(),
      settings: supportedVideoSettings(),
      setup: videoGenerationApiKey() ? undefined : setupHelp(),
    });
  }

  const id = url.searchParams.get("id") || "";
  if (!id) {
    return Response.json({ ok: false, error: "Missing job id." }, { status: 400 });
  }

  const actor = await resolveAiActor();
  const anonId = await getOrCreateAnonId();
  const key = ownerKey(actor, anonId);
  void cleanupExpiredVideos();
  const job = await refreshJob(id, key);
  if (!job) {
    return Response.json({ ok: false, error: "Video job not found." }, { status: 404 });
  }
  return Response.json({ ok: true, job: publicJob(job) });
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`ai-video:${ip}`, 4, 60_000);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: `Too many video requests. Retry in ${limited.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const apiKey = videoGenerationApiKey();
  if (!apiKey) {
    return Response.json(
      {
        ok: false,
        error: "Video generation is not configured yet.",
        setup: setupHelp(),
      },
      { status: 503 },
    );
  }

  let body: {
    prompt?: string;
    conversationId?: string;
    aspectRatio?: string;
    durationSec?: number;
    quality?: string;
    imageFileId?: string;
    mode?: "text" | "image";
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const prompt = String(body.prompt || "").trim();
  if (!prompt) {
    return Response.json({ ok: false, error: "Describe the video you want." }, { status: 400 });
  }
  if (prompt.length > 3000) {
    return Response.json({ ok: false, error: "Prompt too long." }, { status: 400 });
  }

  const actor = await resolveAiActor();
  const anonId = await getOrCreateAnonId();
  const subject = usageSubject(actor);
  const owner = ownerKey(actor, anonId);

  const budget = await checkAiBudget("video", owner);
  if (!budget.ok) {
    return Response.json({ ok: false, error: budget.reason }, { status: 429 });
  }

  const aspectRaw = String(body.aspectRatio || "16:9");
  const aspectRatio =
    aspectRaw === "9:16" || aspectRaw === "1:1" || aspectRaw === "16:9"
      ? aspectRaw
      : "16:9";
  const durationSec = body.durationSec && body.durationSec >= 8 ? 9 : 5;
  const quality =
    body.quality === "highest" || body.quality === "high" ? body.quality : "standard";
  const mode: "text" | "image" =
    body.mode === "image" || body.imageFileId ? "image" : "text";

  let imageUrl: string | undefined;
  let sourceImageId: string | undefined;
  if (mode === "image") {
    const fileId = String(body.imageFileId || "");
    const meta = fileId ? await loadUpload(fileId) : null;
    if (!meta?.isImage) {
      return Response.json(
        { ok: false, error: "Upload an image first for image-to-video." },
        { status: 400 },
      );
    }
    sourceImageId = meta.id;
    imageUrl = publicImageUrlForUpload(meta.id);
  }

  const enhanced = await enhanceVideoPrompt({
    prompt,
    mode,
    aspectRatio,
    durationSec,
  });

  const mapped = mapQualityToLuma(quality);
  const estimatedUsd = estimateVideoCostUsd(durationSec, quality);

  const job = await createVideoJob({
    ownerKey: owner,
    usageSubject: subject,
    actorRole: actor.role,
    conversationId: body.conversationId ? String(body.conversationId) : undefined,
    provider: "luma",
    mode,
    prompt,
    enhancedPrompt: enhanced,
    aspectRatio,
    durationSec,
    quality,
    model: mapped.model,
    resolution: mapped.resolution,
    sourceImageId,
    estimatedUsd,
  });

  try {
    const gen = await lumaCreateGeneration({
      apiKey,
      prompt: enhanced,
      model: mapped.model,
      aspectRatio: aspectRatio as "16:9" | "9:16" | "1:1",
      duration: mapDurationSec(durationSec),
      resolution: mapped.resolution,
      imageUrl,
    });
    job.providerJobId = gen.id;
    job.status = "processing";
    await saveVideoJob(job);
  } catch (err) {
    job.status = "failed";
    job.error = err instanceof Error ? err.message : "Could not start video generation.";
    job.usageRecorded = true;
    await saveVideoJob(job);
    await recordVideoUsage({
      subject,
      ownerKey: owner,
      role: actor.role,
      model: mapped.model,
      provider: "luma",
      durationSec,
      quality,
      success: false,
      estimatedUsd: 0,
    });
    return Response.json(
      { ok: false, error: job.error, job: publicJob(job) },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    job: publicJob(job),
    notice: "Video generation started. You can keep chatting while it processes.",
  });
}
