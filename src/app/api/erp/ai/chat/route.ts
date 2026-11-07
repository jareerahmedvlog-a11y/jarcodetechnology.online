import OpenAI from "openai";
import {
  buildHospitalAiContext,
  HOSPITAL_AI_SYSTEM_PROMPT,
} from "@/lib/hospital-ai/context";
import {
  checkHospitalAiBudget,
  recordHospitalAiUsage,
} from "@/lib/hospital-ai/usage";
import { getClientSession } from "@/lib/client-auth";
import { rateLimit } from "@/lib/demos/rate-limit";
import { getTenantDatabase } from "@/lib/tenants/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatBody = {
  message?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

export async function POST(req: Request) {
  const client = await getClientSession();
  if (!client) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (client.erp !== "hospital") {
    return Response.json(
      { ok: false, error: "AI Assistant is only available for Hospital ERP clients." },
      { status: 403 },
    );
  }

  const limited = rateLimit(`erp-ai:${client.id}`, 20, 60_000);
  if (!limited.ok) {
    return Response.json(
      {
        ok: false,
        error: `Too many chat requests. Retry in ${limited.retryAfterSec}s.`,
      },
      { status: 429 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { ok: false, error: "OpenAI API key is not configured on the server." },
      { status: 503 },
    );
  }

  const budget = await checkHospitalAiBudget();
  if (!budget.ok) {
    return Response.json({ ok: false, error: budget.reason }, { status: 429 });
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const message = String(body.message || "").trim();
  if (!message) {
    return Response.json({ ok: false, error: "Please enter a question." }, { status: 400 });
  }
  if (message.length > 1000) {
    return Response.json(
      { ok: false, error: "Message is too long (max 1000 characters)." },
      { status: 400 },
    );
  }

  const db = await getTenantDatabase(client.tenantId, "hospital");
  const snapshot = buildHospitalAiContext(db);
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  const safeHistory = history
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string",
    )
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 1500),
    }));

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content: `${HOSPITAL_AI_SYSTEM_PROMPT}\n\nYou are serving a PRIVATE authenticated hospital client tenant. Never mention other tenants or public demo data.`,
        },
        {
          role: "system",
          content: `Private tenant hospital snapshot (JSON):\n${JSON.stringify(snapshot)}`,
        },
        ...safeHistory.map((item) => ({
          role: item.role as "user" | "assistant",
          content: item.content,
        })),
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "I could not generate a reply from your hospital records right now.";

    await recordHospitalAiUsage(0.01);
    return Response.json({
      ok: true,
      reply,
      meta: { model, environment: "hospital-tenant-readonly", tenantId: client.tenantId },
    });
  } catch {
    return Response.json(
      { ok: false, error: "AI Assistant is temporarily unavailable. Please try again shortly." },
      { status: 502 },
    );
  }
}
