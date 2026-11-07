import { resolveAiActor, usageSubject } from "@/lib/jarcode-ai/actor";
import { openaiApiKey } from "@/lib/jarcode-ai/config";
import { getOrCreateAnonId } from "@/lib/jarcode-ai/anon";
import {
  appendMessages,
  createConversation,
  loadConversation,
} from "@/lib/jarcode-ai/conversations";
import { generateOrEditImage } from "@/lib/jarcode-ai/image-generate";
import { checkAiBudget, recordImageUsage } from "@/lib/jarcode-ai/usage";
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
  const limited = rateLimit(`ai-image:${ip}`, 10, 60_000);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: `Too many image requests. Retry in ${limited.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  if (!openaiApiKey()) {
    return Response.json(
      { ok: false, error: "OpenAI API key is not configured on the server." },
      { status: 503 },
    );
  }

  const budget = await checkAiBudget("image");
  if (!budget.ok) {
    return Response.json({ ok: false, error: budget.reason }, { status: 429 });
  }

  let body: {
    prompt?: string;
    conversationId?: string;
    aspectRatio?: string;
    quality?: string;
    action?: "generate" | "edit";
    fileId?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const prompt = String(body.prompt || "").trim();
  if (!prompt) {
    return Response.json({ ok: false, error: "Please enter an image prompt." }, { status: 400 });
  }
  if (prompt.length > 3000) {
    return Response.json({ ok: false, error: "Prompt too long." }, { status: 400 });
  }

  const actor = await resolveAiActor();
  const anonId = await getOrCreateAnonId();
  let conversationId = String(body.conversationId || "");
  let conv = conversationId ? await loadConversation(actor, conversationId, anonId) : null;
  if (!conv) {
    conv = await createConversation(actor, anonId);
    conversationId = conv.id;
  }

  const result = await generateOrEditImage({
    prompt,
    aspectRatio: body.aspectRatio,
    quality: body.quality,
    action: body.action,
    fileId: body.fileId,
  });

  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error, detail: result.detail },
      { status: result.status },
    );
  }

  await appendMessages(
    actor,
    conversationId,
    [
      { role: "user", content: `[Image ${result.action}] ${prompt}` },
      { role: "assistant", content: `${result.reply}\n${result.imageUrl}` },
    ],
    anonId,
  );

  await recordImageUsage({
    subject: usageSubject(actor),
    role: actor.role,
    model: result.model,
  });

  return Response.json({
    ok: true,
    conversationId,
    imageDataUrl: result.imageDataUrl,
    imageUrl: result.imageUrl,
    imageId: result.imageId,
    reply: result.reply,
    meta: { model: result.model, action: result.action, identityAware: result.action === "edit" },
  });
}
