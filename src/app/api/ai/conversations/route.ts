import { resolveAiActor } from "@/lib/jarcode-ai/actor";
import { getOrCreateAnonId } from "@/lib/jarcode-ai/anon";
import {
  clearConversation,
  createConversation,
  deleteConversation,
  listConversations,
  loadConversation,
  renameConversation,
} from "@/lib/jarcode-ai/conversations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await resolveAiActor();
  const anonId = await getOrCreateAnonId();
  const items = await listConversations(actor, anonId);
  return Response.json({ ok: true, conversations: items });
}

export async function POST(req: Request) {
  const actor = await resolveAiActor();
  const anonId = await getOrCreateAnonId();
  let body: { action?: string; id?: string; title?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }
  const action = String(body.action || "new");

  if (action === "new") {
    const conv = await createConversation(actor, anonId);
    return Response.json({ ok: true, conversation: { id: conv.id, title: conv.title } });
  }

  if (action === "get") {
    const id = String(body.id || "");
    const conv = await loadConversation(actor, id, anonId);
    if (!conv) return Response.json({ ok: false, error: "Not found." }, { status: 404 });
    return Response.json({
      ok: true,
      conversation: {
        id: conv.id,
        title: conv.title,
        messages: conv.messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content })),
      },
    });
  }

  if (action === "rename") {
    const conv = await renameConversation(
      actor,
      String(body.id || ""),
      String(body.title || ""),
      anonId,
    );
    if (!conv) return Response.json({ ok: false, error: "Not found." }, { status: 404 });
    return Response.json({ ok: true, conversation: { id: conv.id, title: conv.title } });
  }

  if (action === "delete") {
    const ok = await deleteConversation(actor, String(body.id || ""), anonId);
    if (!ok) return Response.json({ ok: false, error: "Not found." }, { status: 404 });
    return Response.json({ ok: true });
  }

  if (action === "clear") {
    const conv = await clearConversation(actor, String(body.id || ""), anonId);
    if (!conv) return Response.json({ ok: false, error: "Not found." }, { status: 404 });
    return Response.json({ ok: true });
  }

  return Response.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
