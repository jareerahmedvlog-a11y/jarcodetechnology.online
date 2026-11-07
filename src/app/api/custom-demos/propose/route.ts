import { resolveAiActor, usageSubject } from "@/lib/jarcode-ai/actor";
import { getOrCreateAnonId } from "@/lib/jarcode-ai/anon";
import { checkAiBudget, recordChatUsage } from "@/lib/jarcode-ai/usage";
import { proposeCustomDemoModules } from "@/lib/custom-demos/generate";
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
  const limited = rateLimit(`custom-demo-propose:${ip}`, 6, 60_000);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: `Too many AI demo requests. Retry in ${limited.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const budget = await checkAiBudget("chat");
  if (!budget.ok) {
    return Response.json({ ok: false, error: budget.reason }, { status: 429 });
  }

  let body: {
    niche?: string;
    businessName?: string;
    businessType?: string;
    description?: string;
    requirements?: string;
    extraInstructions?: string;
    currency?: string;
    country?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const niche = String(body.niche || "").trim();
  const businessName = String(body.businessName || "").trim();
  if (!niche || !businessName) {
    return Response.json(
      { ok: false, error: "Business name and niche are required." },
      { status: 400 },
    );
  }

  await getOrCreateAnonId();
  const actor = await resolveAiActor();

  try {
    const result = await proposeCustomDemoModules({
      niche,
      businessName,
      businessType: String(body.businessType || niche).trim(),
      description: String(body.description || "").trim(),
      requirements: String(body.requirements || "").trim(),
      extraInstructions: String(body.extraInstructions || "").trim(),
      currency: String(body.currency || "PKR").trim(),
      country: String(body.country || "Pakistan").trim(),
    });

    await recordChatUsage({
      subject: usageSubject(actor),
      role: actor.role,
      model: result.model,
      inputTokens: result.usage?.inputTokens || 0,
      outputTokens: result.usage?.outputTokens || 0,
    });

    return Response.json({
      ok: true,
      modules: result.modules,
      unsupportedNotes: result.unsupportedNotes,
      notice:
        "Modules use approved form/table components. Unsupported ideas are listed separately for custom development.",
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Could not generate modules.",
      },
      { status: 502 },
    );
  }
}
