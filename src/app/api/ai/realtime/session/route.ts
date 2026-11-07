import { createHash } from "crypto";
import { resolveAiActor, usageSubject } from "@/lib/jarcode-ai/actor";
import {
  openaiApiKey,
  realtimeModel,
  realtimeVoice,
  voiceMaxMinutes,
} from "@/lib/jarcode-ai/config";
import { buildActorSystemPrompt } from "@/lib/jarcode-ai/context";
import { getOrCreateAnonId } from "@/lib/jarcode-ai/anon";
import {
  appendMessages,
  createConversation,
  historyForModel,
  loadConversation,
} from "@/lib/jarcode-ai/conversations";
import { checkAiBudget, recordVoiceUsage } from "@/lib/jarcode-ai/usage";
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

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`jarcode-ai-voice:${ip}`, 12, 60_000);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: `Too many voice requests. Retry in ${limited.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const apiKey = openaiApiKey();
  if (!apiKey) {
    return Response.json(
      { ok: false, error: "OpenAI API key is not configured on the server." },
      { status: 503 },
    );
  }

  const budget = await checkAiBudget("voice");
  if (!budget.ok) {
    return Response.json({ ok: false, error: budget.reason }, { status: 429 });
  }

  let body: {
    conversationId?: string;
    action?: "create" | "end";
    durationMinutes?: number;
  } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  const actor = await resolveAiActor();
  const anonId = await getOrCreateAnonId();

  if (body.action === "end") {
    const minutes = Number(body.durationMinutes) || 1;
    await recordVoiceUsage({
      subject: usageSubject(actor),
      role: actor.role,
      model: realtimeModel(),
      durationMinutes: Math.min(voiceMaxMinutes(), Math.max(0.1, minutes)),
    });
    return Response.json({ ok: true });
  }

  let conversationId = String(body.conversationId || "");
  let conv = conversationId ? await loadConversation(actor, conversationId, anonId) : null;
  if (!conv) {
    conv = await createConversation(actor, anonId);
    conversationId = conv.id;
  }

  const instructions = await buildActorSystemPrompt(actor);
  const history = historyForModel(conv);
  const prior =
    history.length > 0
      ? `\n\nRecent authorized conversation context:\n${history
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")
          .slice(0, 3500)}`
      : "";

  const model = realtimeModel();
  const voice = realtimeVoice();
  const safetyId = createHash("sha256")
    .update(`${actor.role}:${actor.id}:${ip}`)
    .digest("hex")
    .slice(0, 32);

  try {
    const res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": safetyId,
      },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: 600 },
        session: {
          type: "realtime",
          model,
          instructions: `${instructions}${prior}\n\nSpeak naturally. Support English, Urdu, Hindi, and Roman Urdu. Keep answers grounded. Do not claim access to unauthorized ERP data.`,
          audio: {
            output: { voice },
            input: {
              transcription: { model: "gpt-4o-mini-transcribe" },
            },
          },
        },
      }),
    });

    const data = (await res.json()) as {
      value?: string;
      client_secret?: { value?: string; expires_at?: number };
      expires_at?: number;
      error?: { message?: string };
    };

    if (!res.ok) {
      const msg = data.error?.message || "Could not create realtime session.";
      const safe = /invalid.?api.?key|incorrect api key|401/i.test(msg)
        ? "OpenAI rejected the server API key."
        : /quota|billing/i.test(msg)
          ? "OpenAI billing/quota issue."
          : "Voice session unavailable right now.";
      return Response.json({ ok: false, error: safe }, { status: 502 });
    }

    const value = data.value || data.client_secret?.value;
    if (!value) {
      return Response.json(
        { ok: false, error: "Realtime client secret missing from OpenAI response." },
        { status: 502 },
      );
    }

    // Seed conversation touch so chat/voice share the same id
    await appendMessages(actor, conversationId, [], anonId);

    return Response.json({
      ok: true,
      // Ephemeral only — never the permanent OPENAI_API_KEY
      client_secret: value,
      expires_at: data.expires_at || data.client_secret?.expires_at,
      conversationId,
      role: actor.role,
      label: actor.label,
      config: {
        model,
        voice,
        maxMinutes: voiceMaxMinutes(),
        webrtcUrl: "https://api.openai.com/v1/realtime/calls",
      },
    });
  } catch {
    return Response.json(
      { ok: false, error: "Could not reach OpenAI Realtime API." },
      { status: 502 },
    );
  }
}
