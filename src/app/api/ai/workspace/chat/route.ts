import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { resolveAiActor, usageSubject } from "@/lib/jarcode-ai/actor";
import {
  complexMaxOutputTokens,
  historyMessageLimit,
  openaiApiKey,
  simpleMaxOutputTokens,
} from "@/lib/jarcode-ai/config";
import { getOrCreateAnonId } from "@/lib/jarcode-ai/anon";
import {
  appendMessages,
  createConversation,
  historyForModel,
  loadConversation,
} from "@/lib/jarcode-ai/conversations";
import { generateOrEditImage } from "@/lib/jarcode-ai/image-generate";
import {
  classifyChatRequest,
  detectMediaIntent,
  selectChatModel,
  shouldAutoWebSearch,
  type AnswerStyle,
} from "@/lib/jarcode-ai/routing";
import { fetchPublicPageText } from "@/lib/jarcode-ai/ssrf";
import { readUploadBytes } from "@/lib/jarcode-ai/uploads";
import { checkAiBudget, recordChatUsage, recordImageUsage } from "@/lib/jarcode-ai/usage";
import { buildWorkspaceSystemPrompt } from "@/lib/jarcode-ai/workspace-prompt";
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

function extractOutputText(response: OpenAI.Responses.Response) {
  const chunks: string[] = [];
  for (const item of response.output || []) {
    if (item.type !== "message") continue;
    for (const part of item.content || []) {
      if (part.type === "output_text" && part.text) chunks.push(part.text);
    }
  }
  return chunks.join("\n").trim();
}

function extractCitations(response: OpenAI.Responses.Response) {
  const links: Array<{ title?: string; url: string }> = [];
  const seen = new Set<string>();
  for (const item of response.output || []) {
    if (item.type !== "web_search_call") continue;
    const anyItem = item as {
      action?: { sources?: Array<{ url?: string; title?: string }> };
    };
    for (const src of anyItem.action?.sources || []) {
      if (!src.url || seen.has(src.url)) continue;
      seen.add(src.url);
      links.push({ url: src.url, title: src.title });
    }
  }
  // Also scan annotations in message content if present
  for (const item of response.output || []) {
    if (item.type !== "message") continue;
    for (const part of item.content || []) {
      if (part.type !== "output_text") continue;
      const anns = (part as { annotations?: Array<{ type?: string; url?: string; title?: string }> })
        .annotations;
      for (const a of anns || []) {
        if (a.url && !seen.has(a.url)) {
          seen.add(a.url);
          links.push({ url: a.url, title: a.title });
        }
      }
    }
  }
  return links.slice(0, 8);
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`ai-workspace-chat:${ip}`, 24, 60_000);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: `Too many requests. Retry in ${limited.retryAfterSec}s.` },
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

  const budget = await checkAiBudget("chat");
  if (!budget.ok) {
    return Response.json({ ok: false, error: budget.reason }, { status: 429 });
  }

  let body: {
    message?: string;
    conversationId?: string;
    mode?: string;
    enableWebSearch?: boolean;
    fileIds?: string[];
    url?: string;
    stream?: boolean;
    answerStyle?: AnswerStyle;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  const wantStream = body.stream !== false; // default stream on for speed UX
  const startedAt = Date.now();

  const message = String(body.message || "").trim();
  if (!message) {
    return Response.json({ ok: false, error: "Please enter a question." }, { status: 400 });
  }
  if (message.length > 8000) {
    return Response.json({ ok: false, error: "Message too long." }, { status: 400 });
  }

  const actor = await resolveAiActor();
  const anonId = await getOrCreateAnonId();
  let conversationId = String(body.conversationId || "");
  let conv = conversationId ? await loadConversation(actor, conversationId, anonId) : null;
  if (!conv) {
    conv = await createConversation(actor, anonId);
    conversationId = conv.id;
  }

  const mode = String(body.mode || "general");
  const answerStyle = (body.answerStyle || "default") as AnswerStyle;
  const fileIds = Array.isArray(body.fileIds)
    ? body.fileIds.map(String).filter(Boolean).slice(0, 4)
    : [];
  const url = String(body.url || "").trim();

  // Image requests: call OpenAI Images API here — never ask the text model to "draw".
  const mediaIntent = detectMediaIntent(message, { hasImageAttachment: fileIds.length > 0 });
  if (mediaIntent === "image") {
    const imageBudget = await checkAiBudget("image");
    if (!imageBudget.ok) {
      return Response.json({ ok: false, error: imageBudget.reason, mediaIntent: "image" }, { status: 429 });
    }
    const imageCandidates = await Promise.all(
      fileIds.map(async (id) => {
        const u = await readUploadBytes(id);
        return u?.meta.isImage ? id : null;
      }),
    );
    const imageFileId = imageCandidates.find(Boolean) || undefined;

    const generated = await generateOrEditImage({
      prompt: message,
      quality: "high",
      fileId: imageFileId,
      action: imageFileId ? "edit" : "generate",
    });

    if (!generated.ok) {
      if (wantStream) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            const send = (obj: unknown) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
            };
            send({ type: "meta", conversationId, role: actor.role, label: actor.label });
            send({ type: "error", error: generated.error, mediaIntent: "image" });
            controller.close();
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      }
      return Response.json(
        { ok: false, error: generated.error, mediaIntent: "image" },
        { status: generated.status },
      );
    }

    await appendMessages(
      actor,
      conversationId,
      [
        { role: "user", content: `[Image ${generated.action}] ${message}` },
        { role: "assistant", content: `${generated.reply}\n${generated.imageUrl}` },
      ],
      anonId,
    );
    await recordImageUsage({
      subject: usageSubject(actor),
      role: actor.role,
      model: generated.model,
    });

    if (wantStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const send = (obj: unknown) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          };
          send({ type: "meta", conversationId, role: actor.role, label: actor.label });
          send({
            type: "image",
            reply: generated.reply,
            imageUrl: generated.imageUrl,
            imagePrompt: message,
            mediaIntent: "image",
            conversationId,
          });
          send({ type: "done", reply: generated.reply, conversationId });
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    return Response.json({
      ok: true,
      reply: generated.reply,
      conversationId,
      imageUrl: generated.imageUrl,
      imageDataUrl: generated.imageDataUrl,
      imagePrompt: message,
      mediaIntent: "image",
      meta: { model: generated.model, action: generated.action },
    });
  }

  if (mediaIntent === "video") {
    const tip =
      "This looks like a video request. Open Create Video from the + menu in JARCODE AI Workspace, or switch compose mode to Video.";
    if (wantStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const send = (obj: unknown) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          };
          send({ type: "meta", conversationId, role: actor.role, label: actor.label });
          send({ type: "error", error: tip, mediaIntent: "video" });
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }
    return Response.json({ ok: false, error: tip, mediaIntent: "video" }, { status: 409 });
  }

  const complexity = classifyChatRequest({
    message,
    hasFiles: fileIds.length > 0,
    hasUrl: Boolean(url),
    answerStyle,
    mode,
  });
  const model = selectChatModel(complexity);
  const enableWebSearch = shouldAutoWebSearch(
    message,
    body.enableWebSearch === undefined ? undefined : Boolean(body.enableWebSearch),
  );
  if (enableWebSearch) {
    const searchBudget = await checkAiBudget("web_search");
    if (!searchBudget.ok) {
      return Response.json({ ok: false, error: searchBudget.reason }, { status: 429 });
    }
  }

  if (fileIds.length) {
    const fileBudget = await checkAiBudget("file");
    if (!fileBudget.ok) {
      return Response.json({ ok: false, error: fileBudget.reason }, { status: 429 });
    }
  }

  let urlContext = "";
  if (url) {
    try {
      const page = await fetchPublicPageText(url);
      urlContext = `\n\nFetched public webpage content from ${page.url}:\n${page.text}`;
    } catch (err) {
      return Response.json(
        {
          ok: false,
          error:
            err instanceof Error
              ? `Could not analyze URL: ${err.message}`
              : "Could not analyze URL.",
        },
        { status: 400 },
      );
    }
  }

  const client = new OpenAI({ apiKey });
  const historyLimit =
    complexity === "simple" ? Math.min(6, historyMessageLimit()) : historyMessageLimit();
  const history = historyForModel(conv, historyLimit, complexity === "simple" ? 900 : 1800);

  const userContent: Array<
    | { type: "input_text"; text: string }
    | { type: "input_image"; image_url: string; detail: "auto" | "high" | "low" }
    | { type: "input_file"; file_id: string }
  > = [
    {
      type: "input_text",
      text: `${message}${urlContext}${
        fileIds.length
          ? "\n\n(Use the attached study/document material as the primary source for this answer.)"
          : ""
      }`,
    },
  ];

  let usedFile = false;
  for (const id of fileIds) {
    const loaded = await readUploadBytes(id);
    if (!loaded) continue;
    usedFile = true;
    if (loaded.meta.isImage) {
      const b64 = loaded.buf.toString("base64");
      const mime = loaded.meta.mime || "image/png";
      userContent.push({
        type: "input_image",
        image_url: `data:${mime};base64,${b64}`,
        detail: "high",
      });
    } else {
      try {
        const uploaded = await client.files.create({
          file: await toFile(loaded.buf, loaded.meta.originalName),
          purpose: "user_data",
        });
        userContent.push({ type: "input_file", file_id: uploaded.id });
      } catch {
        if (/\.(txt|md|csv|tsv|json|html|css|js|ts|tsx|py)$/i.test(loaded.meta.ext)) {
          userContent.push({
            type: "input_text",
            text: `Attached file ${loaded.meta.originalName}:\n${loaded.buf
              .toString("utf8")
              .slice(0, 40000)}`,
          });
        } else {
          return Response.json(
            {
              ok: false,
              error: `Could not process file ${loaded.meta.originalName}. Try PDF, DOCX, PPTX, XLSX, TXT, CSV, or image formats.`,
            },
            { status: 400 },
          );
        }
      }
    }
  }

  const input = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user" as const,
      content: userContent,
    },
  ];

  const tools: Array<{ type: "web_search" }> = [];
  if (enableWebSearch) tools.push({ type: "web_search" });

  const createArgs = {
    model,
    instructions: buildWorkspaceSystemPrompt({
      mode,
      complexity,
      answerStyle,
      hasFiles: usedFile || fileIds.length > 0,
      hasUrl: Boolean(url),
    }),
    input,
    tools: tools.length ? tools : undefined,
    include: enableWebSearch
      ? (["web_search_call.action.sources"] as ["web_search_call.action.sources"])
      : undefined,
    temperature: complexity === "simple" ? 0.3 : 0.4,
    max_output_tokens:
      complexity === "simple" ? simpleMaxOutputTokens() : complexMaxOutputTokens(),
  };

  if (wantStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };
        try {
          send({
            type: "meta",
            conversationId,
            role: actor.role,
            label: actor.label,
            model,
            complexity,
          });
          const streamed = await client.responses.create({
            ...createArgs,
            stream: true,
          });
          let reply = "";
          let usageIn = 0;
          let usageOut = 0;
          let firstTokenMs: number | undefined;
          // Collect final response for citations when available
          let finalResponse: OpenAI.Responses.Response | null = null;
          for await (const event of streamed) {
            const ev = event as {
              type?: string;
              delta?: string;
              response?: OpenAI.Responses.Response;
            };
            if (ev.type === "response.output_text.delta" && typeof ev.delta === "string") {
              if (firstTokenMs === undefined) firstTokenMs = Date.now() - startedAt;
              reply += ev.delta;
              send({ type: "delta", text: ev.delta });
            }
            if (ev.type === "response.completed" && ev.response) {
              finalResponse = ev.response;
              usageIn = ev.response.usage?.input_tokens || 0;
              usageOut = ev.response.usage?.output_tokens || 0;
              if (!reply) reply = extractOutputText(ev.response);
            }
          }
          if (!reply.trim()) {
            reply = "I could not generate a reply right now. Please try again.";
            send({ type: "delta", text: reply });
          }
          const citations = finalResponse ? extractCitations(finalResponse) : [];
          await appendMessages(
            actor,
            conversationId,
            [
              { role: "user", content: message },
              { role: "assistant", content: reply },
            ],
            anonId,
          );
          const totalMs = Date.now() - startedAt;
          await recordChatUsage({
            subject: usageSubject(actor),
            role: actor.role,
            model,
            inputTokens: usageIn,
            outputTokens: usageOut,
            usedSearch: enableWebSearch,
            usedFile,
            firstTokenMs,
            totalMs,
          });
          send({
            type: "done",
            reply,
            conversationId,
            citations,
            meta: {
              model,
              mode,
              complexity,
              usedFile,
              usedSearch: enableWebSearch,
              firstTokenMs,
              totalMs,
            },
          });
        } catch (err) {
          const detail = err instanceof Error ? err.message : "Unknown error";
          const safe =
            /quota|billing|insufficient/i.test(detail)
              ? "OpenAI billing/quota issue. Check billing balance."
              : /incorrect api key|invalid_api_key|401/i.test(detail)
                ? "OpenAI rejected the server API key."
                : /model/i.test(detail)
                  ? "AI model unavailable. Ask admin to update OPENAI_FAST_MODEL / OPENAI_CAPABLE_MODEL."
                  : "AI Workspace is temporarily unavailable. Please try again shortly.";
          await recordChatUsage({
            subject: usageSubject(actor),
            role: actor.role,
            model,
            inputTokens: 0,
            outputTokens: 0,
            usedSearch: enableWebSearch,
            usedFile,
            totalMs: Date.now() - startedAt,
            failed: true,
          }).catch(() => undefined);
          send({ type: "error", error: safe });
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  try {
    const response = await client.responses.create(createArgs);

    const reply =
      extractOutputText(response) ||
      "I could not generate a reply right now. Please try again.";
    const citations = extractCitations(response);

    await appendMessages(
      actor,
      conversationId,
      [
        { role: "user", content: message },
        { role: "assistant", content: reply },
      ],
      anonId,
    );

    const usage = response.usage;
    const totalMs = Date.now() - startedAt;
    await recordChatUsage({
      subject: usageSubject(actor),
      role: actor.role,
      model,
      inputTokens: usage?.input_tokens || 0,
      outputTokens: usage?.output_tokens || 0,
      usedSearch: enableWebSearch,
      usedFile,
      firstTokenMs: totalMs,
      totalMs,
    });

    return Response.json({
      ok: true,
      reply,
      conversationId,
      role: actor.role,
      label: actor.label,
      citations,
      meta: {
        model,
        mode,
        complexity,
        usedFile,
        usedSearch: enableWebSearch,
        totalMs,
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    const safe =
      /quota|billing|insufficient/i.test(detail)
        ? "OpenAI billing/quota issue. Check billing balance."
        : /incorrect api key|invalid_api_key|401/i.test(detail)
          ? "OpenAI rejected the server API key."
          : /model/i.test(detail)
            ? "AI model unavailable. Ask admin to update OPENAI_FAST_MODEL / OPENAI_CAPABLE_MODEL."
            : "AI Workspace is temporarily unavailable. Please try again shortly.";
    await recordChatUsage({
      subject: usageSubject(actor),
      role: actor.role,
      model,
      inputTokens: 0,
      outputTokens: 0,
      usedSearch: enableWebSearch,
      usedFile,
      totalMs: Date.now() - startedAt,
      failed: true,
    }).catch(() => undefined);
    return Response.json({ ok: false, error: safe }, { status: 502 });
  }
}
