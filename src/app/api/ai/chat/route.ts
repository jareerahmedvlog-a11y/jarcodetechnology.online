import OpenAI from "openai";
import { resolveAiActor, usageSubject } from "@/lib/jarcode-ai/actor";
import { chatModel, openaiApiKey, videoGenerationApiKey } from "@/lib/jarcode-ai/config";
import { buildActorSystemPrompt } from "@/lib/jarcode-ai/context";
import { getOrCreateAnonId } from "@/lib/jarcode-ai/anon";
import {
  appendMessages,
  clearConversation,
  createConversation,
  historyForModel,
  loadConversation,
} from "@/lib/jarcode-ai/conversations";
import { generateOrEditImage } from "@/lib/jarcode-ai/image-generate";
import { detectMediaIntent } from "@/lib/jarcode-ai/routing";
import { chatTools, runApprovedTool } from "@/lib/jarcode-ai/tools";
import { checkAiBudget, recordChatUsage, recordImageUsage } from "@/lib/jarcode-ai/usage";
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
  const limited = rateLimit(`jarcode-ai-chat:${ip}`, 30, 60_000);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: `Too many requests. Retry in ${limited.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const apiKey = openaiApiKey();
  if (!apiKey) {
    return Response.json(
      {
        ok: false,
        error:
          "OpenAI API key is not configured. Set OPENAI_API_KEY on the server environment.",
      },
      { status: 503 },
    );
  }

  const budget = await checkAiBudget("chat");
  if (!budget.ok) {
    return Response.json({ ok: false, error: budget.reason }, { status: 429 });
  }

  let body: {
    message?: string;
    conversationId?: string;
    action?: "new" | "clear" | "chat";
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const actor = await resolveAiActor();
  const anonId = await getOrCreateAnonId();
  const action = body.action || "chat";

  if (action === "new") {
    const conv = await createConversation(actor, anonId);
    return Response.json({
      ok: true,
      conversationId: conv.id,
      role: actor.role,
      label: actor.label,
    });
  }

  if (action === "clear") {
    const id = String(body.conversationId || "");
    if (!id) {
      return Response.json({ ok: false, error: "conversationId required." }, { status: 400 });
    }
    await clearConversation(actor, id, anonId);
    return Response.json({ ok: true, conversationId: id });
  }

  const message = String(body.message || "").trim();
  if (!message) {
    return Response.json({ ok: false, error: "Please enter a question." }, { status: 400 });
  }
  if (message.length > 2000) {
    return Response.json({ ok: false, error: "Message too long (max 2000)." }, { status: 400 });
  }

  let conversationId = String(body.conversationId || "");
  let conv = conversationId ? await loadConversation(actor, conversationId, anonId) : null;
  if (!conv) {
    conv = await createConversation(actor, anonId);
    conversationId = conv.id;
  }

  // Real media routing — never let the text model refuse image/video creation.
  const mediaIntent = detectMediaIntent(message);
  if (mediaIntent === "image") {
    const imageBudget = await checkAiBudget("image");
    if (!imageBudget.ok) {
      return Response.json({ ok: false, error: imageBudget.reason }, { status: 429 });
    }
    const generated = await generateOrEditImage({ prompt: message, quality: "high" });
    if (!generated.ok) {
      return Response.json(
        { ok: false, error: generated.error, mediaIntent: "image" },
        { status: generated.status },
      );
    }
    await appendMessages(
      actor,
      conversationId,
      [
        { role: "user", content: `[Image] ${message}` },
        { role: "assistant", content: `${generated.reply}\n${generated.imageUrl}` },
      ],
      anonId,
    );
    await recordImageUsage({
      subject: usageSubject(actor),
      role: actor.role,
      model: generated.model,
    });
    return Response.json({
      ok: true,
      reply: generated.reply,
      conversationId,
      role: actor.role,
      label: actor.label,
      imageUrl: generated.imageUrl,
      mediaIntent: "image",
      meta: { model: generated.model, action: generated.action },
    });
  }

  if (mediaIntent === "video") {
    const configured = Boolean(videoGenerationApiKey());
    const reply = configured
      ? "Video generation runs in the Full AI Workspace (asynchronous Luma jobs with preview and download). Opening it now — send the same prompt there to start the job."
      : "Video generation needs a separate Luma API key (OpenAI Sora is discontinued). An administrator must set VIDEO_GENERATION_API_KEY on the server. Open Full AI Workspace for setup details, or ask admin to configure Luma at https://platform.lumalabs.ai/";
    await appendMessages(
      actor,
      conversationId,
      [
        { role: "user", content: message },
        { role: "assistant", content: reply },
      ],
      anonId,
    );
    return Response.json({
      ok: true,
      reply,
      conversationId,
      role: actor.role,
      label: actor.label,
      mediaIntent: "video",
      videoConfigured: configured,
      actions: [
        {
          type: "navigate",
          path: `/ai?compose=video&prompt=${encodeURIComponent(message.slice(0, 500))}`,
          message: "Open AI Workspace for video generation",
        },
      ],
    });
  }

  const model = chatModel();
  const system = await buildActorSystemPrompt(actor);
  const history = historyForModel(conv);

  try {
    const client = new OpenAI({ apiKey });
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    let completion = await client.chat.completions.create({
      model,
      temperature: 0.3,
      max_tokens: 900,
      tools: chatTools,
      messages,
    });

    const clientActions: Array<{ type: string; path?: string; message?: string }> = [];
    let guard = 0;
    while (guard < 3) {
      const choice = completion.choices[0];
      const toolCalls = choice?.message?.tool_calls;
      if (!toolCalls?.length) break;
      messages.push(choice.message);
      for (const call of toolCalls) {
        if (call.type !== "function") continue;
        const ran = await runApprovedTool(
          actor,
          call.function.name,
          call.function.arguments || "{}",
        );
        if (ran.clientAction) clientActions.push(ran.clientAction);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(ran.result),
        });
      }
      completion = await client.chat.completions.create({
        model,
        temperature: 0.3,
        max_tokens: 900,
        tools: chatTools,
        messages,
      });
      guard += 1;
    }

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "I could not generate a reply right now.";

    await appendMessages(
      actor,
      conversationId,
      [
        { role: "user", content: message },
        { role: "assistant", content: reply },
      ],
      anonId,
    );

    const usage = completion.usage;
    await recordChatUsage({
      subject: usageSubject(actor),
      role: actor.role,
      model,
      inputTokens: usage?.prompt_tokens || 0,
      outputTokens: usage?.completion_tokens || 0,
    });

    return Response.json({
      ok: true,
      reply,
      conversationId,
      role: actor.role,
      label: actor.label,
      actions: clientActions,
      meta: { model },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    const safe =
      /quota|billing|insufficient/i.test(detail)
        ? "OpenAI billing/quota issue. Check billing balance."
        : /incorrect api key|invalid_api_key|401/i.test(detail)
          ? "OpenAI rejected the server API key. Update OPENAI_API_KEY on the server."
          : "AI Assistant is temporarily unavailable. Please try again shortly.";
    return Response.json({ ok: false, error: safe }, { status: 502 });
  }
}
