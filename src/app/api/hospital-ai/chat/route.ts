import OpenAI from "openai";
import {
  buildHospitalAiContext,
  HOSPITAL_AI_SYSTEM_PROMPT,
} from "@/lib/hospital-ai/context";
import {
  checkHospitalAiBudget,
  recordHospitalAiUsage,
} from "@/lib/hospital-ai/usage";
import { getDemoDatabase } from "@/lib/demos/store";
import { rateLimit } from "@/lib/demos/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatBody = {
  message?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon"
  );
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`hospital-ai:${ip}`, 20, 60_000);
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
      {
        ok: false,
        error:
          "OpenAI API key is not configured on the server. Add OPENAI_API_KEY to server environment variables.",
      },
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
    return Response.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const message = String(body.message || "").trim();
  if (!message) {
    return Response.json(
      { ok: false, error: "Please enter a question." },
      { status: 400 },
    );
  }
  if (message.length > 1000) {
    return Response.json(
      { ok: false, error: "Message is too long (max 1000 characters)." },
      { status: 400 },
    );
  }

  // Hospital demo DB only — never society, never writes
  const db = await getDemoDatabase("hospital");
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
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        { role: "system", content: HOSPITAL_AI_SYSTEM_PROMPT },
        {
          role: "system",
          content: `Hospital Demo database snapshot (JSON):\n${JSON.stringify(snapshot)}`,
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
      "I could not generate a reply from the demo database right now.";

    await recordHospitalAiUsage(0.01);

    return Response.json({
      ok: true,
      reply,
      meta: {
        model,
        environment: "hospital-demo-readonly",
        today: snapshot.today,
      },
    });
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : "Unknown OpenAI error";
    const safe =
      /quota|billing|insufficient/i.test(detail)
        ? "OpenAI billing/quota issue. Check your OpenAI billing balance and limits."
        : /incorrect api key|invalid_api_key|401/i.test(detail)
          ? "OpenAI rejected the server API key. Update OPENAI_API_KEY on the server."
          : "AI Assistant is temporarily unavailable. Please try again shortly.";

    return Response.json({ ok: false, error: safe }, { status: 502 });
  }
}
