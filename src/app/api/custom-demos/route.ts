import { randomUUID } from "crypto";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { resolveAiActor } from "@/lib/jarcode-ai/actor";
import { getOrCreateAnonId } from "@/lib/jarcode-ai/anon";
import { ownerKey } from "@/lib/jarcode-ai/conversations";
import { sanitizeModules } from "@/lib/custom-demos/sanitize";
import {
  listCustomDemoIndex,
  loadCustomDemo,
  saveCustomDemo,
  seedSampleData,
  uniqueSlug,
} from "@/lib/custom-demos/store";
import type { CustomDemoConfig } from "@/lib/custom-demos/types";
import { rateLimit } from "@/lib/demos/rate-limit";
import { siteConfig } from "@/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon"
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const admin = await isAdminAuthenticated();
  if (url.searchParams.get("admin") === "1") {
    if (!admin) {
      return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }
    const index = await listCustomDemoIndex();
    const demos = [];
    for (const entry of index) {
      const bundle = await loadCustomDemo(entry.id);
      if (bundle) demos.push(bundle.config);
    }
    return Response.json({ ok: true, demos, total: demos.length });
  }

  // Public: published only (summary)
  const index = await listCustomDemoIndex();
  const published = index.filter((e) => e.status === "published");
  return Response.json({ ok: true, demos: published, total: published.length });
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`custom-demo-create:${ip}`, 4, 60_000);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: `Too many demo creations. Retry in ${limited.retryAfterSec}s.` },
      { status: 429 },
    );
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
    modules?: unknown;
    aiAssistantEnabled?: boolean;
    unsupportedNotes?: string[];
    publish?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const businessName = String(body.businessName || "").trim().slice(0, 100);
  const niche = String(body.niche || "").trim().slice(0, 80);
  if (!businessName || !niche) {
    return Response.json(
      { ok: false, error: "Business name and niche are required." },
      { status: 400 },
    );
  }

  const { modules, unsupportedNotes } = sanitizeModules(body.modules);
  const actor = await resolveAiActor();
  const anonId = await getOrCreateAnonId();
  const now = new Date().toISOString();
  const id = randomUUID();
  const slug = await uniqueSlug(businessName);
  const base = siteConfig.url.replace(/\/$/, "");
  const publish = body.publish !== false;

  const config: CustomDemoConfig = {
    id,
    slug,
    businessName,
    businessType: String(body.businessType || niche).trim().slice(0, 80),
    niche,
    description: String(body.description || "").trim().slice(0, 2000),
    requirements: String(body.requirements || "").trim().slice(0, 4000),
    currency: String(body.currency || "PKR").trim().slice(0, 12),
    country: String(body.country || "Pakistan").trim().slice(0, 60),
    extraInstructions: String(body.extraInstructions || "").trim().slice(0, 4000),
    modules,
    aiAssistantEnabled: body.aiAssistantEnabled !== false,
    unsupportedNotes: [
      ...unsupportedNotes,
      ...(Array.isArray(body.unsupportedNotes)
        ? body.unsupportedNotes.map((n) => String(n).slice(0, 160))
        : []),
    ].slice(0, 20),
    status: publish ? "published" : "draft",
    creatorLabel: actor.label,
    creatorKey: ownerKey(actor, anonId),
    publicUrl: `${base}/demo/${slug}`,
    createdAt: now,
    updatedAt: now,
    publishedAt: publish ? now : undefined,
  };

  const data = seedSampleData(modules);
  await saveCustomDemo({ config, data });

  return Response.json({
    ok: true,
    demo: config,
    url: `/demo/${slug}`,
    notice: "Demo saved permanently on the server. Use fictional data only.",
  });
}
