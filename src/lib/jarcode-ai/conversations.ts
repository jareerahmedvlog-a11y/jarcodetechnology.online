import { promises as fs } from "fs";
import path from "path";
import type { AiActor } from "@/lib/jarcode-ai/actor";
import { dataRoot } from "@/lib/data-root";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  at: string;
};

export type Conversation = {
  id: string;
  ownerKey: string;
  role: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

const DIR = dataRoot("ai", "conversations");

export function ownerKey(actor: AiActor, anonId?: string) {
  if (actor.role === "admin") return `admin:${actor.id}`;
  if (actor.role === "public") return `anon:${anonId || "guest"}`;
  return `tenant:${actor.tenantId}`;
}

function fileFor(id: string) {
  return path.join(DIR, `${id}.json`);
}

function titleFromMessage(text: string) {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "New chat";
  return t.length > 48 ? `${t.slice(0, 45)}…` : t;
}

export async function createConversation(actor: AiActor, anonId?: string) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const conv: Conversation = {
    id,
    ownerKey: ownerKey(actor, anonId),
    role: actor.role,
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(fileFor(id), JSON.stringify(conv, null, 2), "utf8");
  return conv;
}

export async function loadConversation(actor: AiActor, id: string, anonId?: string) {
  try {
    const raw = await fs.readFile(fileFor(id), "utf8");
    const conv = JSON.parse(raw) as Conversation;
    if (!conv.title) conv.title = "New chat";
    const key = ownerKey(actor, anonId);
    // Allow legacy public chats owned by "public" for same anon migration window
    if (conv.ownerKey !== key && !(actor.role === "public" && conv.ownerKey === "public")) {
      return null;
    }
    return conv;
  } catch {
    return null;
  }
}

export async function listConversations(actor: AiActor, anonId?: string) {
  await fs.mkdir(DIR, { recursive: true });
  const key = ownerKey(actor, anonId);
  let names: string[] = [];
  try {
    names = await fs.readdir(DIR);
  } catch {
    return [];
  }
  const items: Array<{
    id: string;
    title: string;
    updatedAt: string;
    createdAt: string;
    preview: string;
  }> = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(DIR, name), "utf8");
      const conv = JSON.parse(raw) as Conversation;
      if (conv.ownerKey !== key && !(actor.role === "public" && conv.ownerKey === "public" && anonId)) {
        // Only list exact owner; skip shared legacy public dump for privacy
        if (conv.ownerKey !== key) continue;
      }
      if (conv.ownerKey !== key) continue;
      const last = [...(conv.messages || [])].reverse().find((m) => m.role === "user" || m.role === "assistant");
      items.push({
        id: conv.id,
        title: conv.title || "New chat",
        updatedAt: conv.updatedAt,
        createdAt: conv.createdAt,
        preview: (last?.content || "").slice(0, 80),
      });
    } catch {
      /* skip */
    }
  }
  items.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return items.slice(0, 80);
}

export async function renameConversation(
  actor: AiActor,
  id: string,
  title: string,
  anonId?: string,
) {
  const conv = await loadConversation(actor, id, anonId);
  if (!conv) return null;
  conv.title = titleFromMessage(title) || "New chat";
  conv.updatedAt = new Date().toISOString();
  await fs.writeFile(fileFor(id), JSON.stringify(conv, null, 2), "utf8");
  return conv;
}

export async function deleteConversation(actor: AiActor, id: string, anonId?: string) {
  const conv = await loadConversation(actor, id, anonId);
  if (!conv) return false;
  await fs.unlink(fileFor(id)).catch(() => undefined);
  return true;
}

export async function appendMessages(
  actor: AiActor,
  id: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  anonId?: string,
) {
  let current = id ? await loadConversation(actor, id, anonId) : null;
  if (!current) current = await createConversation(actor, anonId);
  if (!messages.length) return current;
  const now = new Date().toISOString();
  for (const m of messages) {
    current.messages.push({
      role: m.role,
      content: m.content.slice(0, 8000),
      at: now,
    });
  }
  if ((!current.title || current.title === "New chat") && messages[0]?.role === "user") {
    current.title = titleFromMessage(messages[0].content);
  }
  current.messages = current.messages.slice(-60);
  current.updatedAt = now;
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(fileFor(current.id), JSON.stringify(current, null, 2), "utf8");
  return current;
}

export async function clearConversation(actor: AiActor, id: string, anonId?: string) {
  const conv = await loadConversation(actor, id, anonId);
  if (!conv) return null;
  conv.messages = [];
  conv.updatedAt = new Date().toISOString();
  await fs.writeFile(fileFor(id), JSON.stringify(conv, null, 2), "utf8");
  return conv;
}

export function historyForModel(
  conv: Conversation | null,
  limit = 10,
  maxCharsPerMessage = 1800,
) {
  if (!conv) return [];
  const n = Math.max(2, Math.min(24, limit));
  return conv.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-n)
    .map((m) => {
      let content = m.content;
      if (content.length > maxCharsPerMessage) {
        content = `${content.slice(0, maxCharsPerMessage)}…`;
      }
      return { role: m.role as "user" | "assistant", content };
    });
}
