import OpenAI from "openai";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  capableChatModel,
  fastChatModel,
  imageEditModel,
  imageModel,
  openaiApiKey,
  videoGenerationApiKey,
  videoProvider,
} from "@/lib/jarcode-ai/config";
import { getAiUsageSummary } from "@/lib/jarcode-ai/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskSecret(value: string) {
  const v = value.trim();
  if (!v) return { configured: false, hint: "Not set" };
  if (v.length < 10) return { configured: true, hint: "Set (short)" };
  return { configured: true, hint: `${v.slice(0, 4)}…${v.slice(-4)}` };
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const openaiKey = openaiApiKey();
  const videoKey = videoGenerationApiKey();
  const summary = await getAiUsageSummary();

  let openaiChat: {
    status: "ok" | "error" | "missing";
    detail: string;
    models: { fast: string; capable: string };
  } = {
    status: openaiKey ? "ok" : "missing",
    detail: openaiKey ? "API key present" : "OPENAI_API_KEY is not configured",
    models: { fast: fastChatModel(), capable: capableChatModel() },
  };

  let openaiImage: {
    status: "ok" | "error" | "missing";
    detail: string;
    models: { generate: string; edit: string };
  } = {
    status: openaiKey ? "ok" : "missing",
    detail: openaiKey ? "Not probed yet" : "OPENAI_API_KEY is not configured",
    models: { generate: imageModel(), edit: imageEditModel() },
  };

  if (openaiKey) {
    try {
      const client = new OpenAI({ apiKey: openaiKey });
      // Lightweight account check — list models (no image spend)
      const listed = await client.models.list();
      const ids = new Set((listed.data || []).map((m) => m.id));
      openaiChat = {
        status: "ok",
        detail: "OpenAI account reachable",
        models: { fast: fastChatModel(), capable: capableChatModel() },
      };
      const gen = imageModel();
      const edit = imageEditModel();
      const genOk = ids.has(gen) || gen.includes("gpt-image");
      openaiImage = {
        status: genOk ? "ok" : "error",
        detail: genOk
          ? `Image models configured: ${gen} / ${edit}`
          : `Configured image model "${gen}" was not listed on this account. Update OPENAI_IMAGE_MODEL (recommended: gpt-image-2.6-flare).`,
        models: { generate: gen, edit },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OpenAI probe failed";
      openaiChat = {
        status: "error",
        detail: msg.slice(0, 200),
        models: { fast: fastChatModel(), capable: capableChatModel() },
      };
      openaiImage = {
        status: "error",
        detail: msg.slice(0, 200),
        models: { generate: imageModel(), edit: imageEditModel() },
      };
    }
  }

  const video = {
    status: videoKey ? ("ok" as const) : ("missing" as const),
    provider: videoProvider(),
    detail: videoKey
      ? "VIDEO_GENERATION_API_KEY present (Luma Dream Machine)"
      : "VIDEO_GENERATION_API_KEY is not set. Create a key at https://platform.lumalabs.ai/ and restart the server.",
    setup: videoKey
      ? null
      : [
          "Create a Luma account at https://platform.lumalabs.ai/",
          "Generate an API key",
          "Add VIDEO_GENERATION_API_KEY=… to .env.local (server only)",
          "Optional: VIDEO_PROVIDER=luma VIDEO_MODEL=ray-2",
          "Restart production server",
        ],
  };

  const events = summary.recentEvents || [];
  const lastOk = events.find((e) => !e.failed);
  const lastFail = events.find((e) => e.failed);
  const lastImage = events.find((e) => e.kind === "image");
  const lastVideo = events.find((e) => e.kind === "video");

  return Response.json({
    ok: true,
    providers: {
      openaiChat,
      openaiImage,
      video,
    },
    secrets: {
      openaiApiKey: maskSecret(openaiKey),
      videoGenerationApiKey: maskSecret(videoKey),
    },
    usage: {
      chatRequests: summary.totalChatRequests,
      imageGenerations: summary.totalImageGenerations || 0,
      videoGenerations: summary.totalVideoGenerations || 0,
      failedRequests: summary.failedRequests || 0,
      estimatedApiCostUsd: summary.estimatedApiCostUsd,
      estimatedVideoSpendUsd: summary.estimatedVideoSpendUsd || 0,
      avgFirstTokenMs: summary.avgFirstTokenMs || 0,
      avgCompletedResponseMs: summary.avgCompletedResponseMs || 0,
    },
    last: {
      successfulAt: lastOk?.at || null,
      failedAt: lastFail?.at || null,
      imageAt: lastImage?.at || null,
      videoAt: lastVideo?.at || null,
    },
  });
}
