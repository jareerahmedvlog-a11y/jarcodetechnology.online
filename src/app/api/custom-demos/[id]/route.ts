import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  deleteCustomDemo,
  loadCustomDemo,
  saveCustomDemo,
} from "@/lib/custom-demos/store";
import type { CustomDemoStatus } from "@/lib/custom-demos/types";
import { sanitizeModules } from "@/lib/custom-demos/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const bundle = await loadCustomDemo(id);
  if (!bundle) {
    return Response.json({ ok: false, error: "Demo not found." }, { status: 404 });
  }
  const admin = await isAdminAuthenticated();
  if (!admin && bundle.config.status !== "published") {
    return Response.json({ ok: false, error: "Demo is not published." }, { status: 403 });
  }
  return Response.json({ ok: true, config: bundle.config, data: bundle.data });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  const { id } = await ctx.params;
  const bundle = await loadCustomDemo(id);
  if (!bundle) {
    return Response.json({ ok: false, error: "Demo not found." }, { status: 404 });
  }

  let body: {
    status?: CustomDemoStatus;
    modules?: unknown;
    aiAssistantEnabled?: boolean;
    businessName?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const now = new Date().toISOString();
  if (body.status) {
    const allowed: CustomDemoStatus[] = [
      "draft",
      "published",
      "unpublished",
      "suspended",
      "archived",
    ];
    if (!allowed.includes(body.status)) {
      return Response.json({ ok: false, error: "Invalid status." }, { status: 400 });
    }
    bundle.config.status = body.status;
    if (body.status === "published") bundle.config.publishedAt = now;
  }
  if (typeof body.aiAssistantEnabled === "boolean") {
    bundle.config.aiAssistantEnabled = body.aiAssistantEnabled;
  }
  if (body.businessName?.trim()) {
    bundle.config.businessName = body.businessName.trim().slice(0, 100);
  }
  if (body.modules) {
    const { modules, unsupportedNotes } = sanitizeModules(body.modules);
    bundle.config.modules = modules;
    bundle.config.unsupportedNotes = [
      ...bundle.config.unsupportedNotes,
      ...unsupportedNotes,
    ].slice(0, 20);
    for (const m of modules) {
      if (!bundle.data[m.id]) bundle.data[m.id] = [];
    }
  }
  bundle.config.updatedAt = now;
  await saveCustomDemo(bundle);
  return Response.json({ ok: true, config: bundle.config });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const admin = await isAdminAuthenticated();
  if (!admin) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  const { id } = await ctx.params;
  await deleteCustomDemo(id);
  return Response.json({ ok: true });
}
