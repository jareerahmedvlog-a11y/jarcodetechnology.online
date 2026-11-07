import {
  createCustomDemoRecord,
  loadCustomDemo,
  updateCustomDemoRecord,
  deleteCustomDemoRecord,
} from "@/lib/custom-demos/store";
import { rateLimit } from "@/lib/demos/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; collection: string }> };

function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon"
  );
}

function sanitize(
  bundle: NonNullable<Awaited<ReturnType<typeof loadCustomDemo>>>,
  collection: string,
  body: Record<string, unknown>,
) {
  const mod = bundle.config.modules.find((m) => m.id === collection);
  if (!mod) return null;
  const data: Record<string, string> = {};
  for (const field of mod.fields) {
    const value = String(body[field.key] ?? "").trim();
    if (field.required && !value) return { error: `${field.label} is required.` };
    if (value.length > 2000) return { error: `${field.label} is too long.` };
    data[field.key] = value;
  }
  return { data };
}

export async function POST(req: Request, ctx: Ctx) {
  const ip = clientIp(req);
  const limited = rateLimit(`custom-demo-write:${ip}`, 40, 60_000);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: "Too many requests. Please wait." },
      { status: 429 },
    );
  }

  const { id, collection } = await ctx.params;
  const bundle = await loadCustomDemo(id);
  if (!bundle) {
    return Response.json({ ok: false, error: "Demo not found." }, { status: 404 });
  }
  if (bundle.config.status === "suspended" || bundle.config.status === "archived") {
    return Response.json({ ok: false, error: "This demo is not accepting changes." }, { status: 403 });
  }
  if (bundle.config.status !== "published" && bundle.config.status !== "draft") {
    // unpublished still writable for owner/admin via same public demo path if they know URL — keep published+draft
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const cleaned = sanitize(bundle, collection, body);
  if (!cleaned || "error" in cleaned) {
    return Response.json(
      { ok: false, error: cleaned && "error" in cleaned ? cleaned.error : "Invalid module." },
      { status: 400 },
    );
  }

  const record = await createCustomDemoRecord(bundle.config.id, collection, cleaned.data);
  return Response.json({ ok: true, record });
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id, collection } = await ctx.params;
  const bundle = await loadCustomDemo(id);
  if (!bundle) {
    return Response.json({ ok: false, error: "Demo not found." }, { status: 404 });
  }

  let body: Record<string, unknown> & { recordId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  const recordId = String(body.recordId || "");
  if (!recordId) {
    return Response.json({ ok: false, error: "Missing recordId." }, { status: 400 });
  }
  const cleaned = sanitize(bundle, collection, body);
  if (!cleaned || "error" in cleaned) {
    return Response.json(
      { ok: false, error: cleaned && "error" in cleaned ? cleaned.error : "Invalid module." },
      { status: 400 },
    );
  }
  const record = await updateCustomDemoRecord(
    bundle.config.id,
    collection,
    recordId,
    cleaned.data,
  );
  return Response.json({ ok: true, record });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id, collection } = await ctx.params;
  const url = new URL(req.url);
  const recordId = url.searchParams.get("recordId") || "";
  if (!recordId) {
    return Response.json({ ok: false, error: "Missing recordId." }, { status: 400 });
  }
  const bundle = await loadCustomDemo(id);
  if (!bundle) {
    return Response.json({ ok: false, error: "Demo not found." }, { status: 404 });
  }
  await deleteCustomDemoRecord(bundle.config.id, collection, recordId);
  return Response.json({ ok: true });
}
