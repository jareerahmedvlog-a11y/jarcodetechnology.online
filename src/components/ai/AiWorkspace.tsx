"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiMarkdown } from "@/components/ai/AiMarkdown";
import { VideoResultCard } from "@/components/ai/VideoResultCard";
import { detectMediaIntent } from "@/lib/jarcode-ai/routing";
import { cn } from "@/lib/utils";

type VideoMeta = {
  jobId: string;
  status: string;
  videoUrl?: string;
  durationSec?: number;
  resolution?: string;
  aspectRatio?: string;
  provider?: string;
  model?: string;
  error?: string;
  prompt?: string;
};

type Msg = {
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
  imagePrompt?: string;
  citations?: Array<{ title?: string; url: string }>;
  video?: VideoMeta;
};

type Attached = {
  id: string;
  name: string;
  isImage: boolean;
  isVideo?: boolean;
  size: number;
};

type ConvItem = {
  id: string;
  title: string;
  updatedAt: string;
  preview?: string;
};

type PlusTool =
  | "file"
  | "image"
  | "video-upload"
  | "create-image"
  | "create-video"
  | "url"
  | "search"
  | null;

export function AiWorkspace() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<ConvItem[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aborting, setAborting] = useState(false);
  const [attachment, setAttachment] = useState<Attached | null>(null);
  const [url, setUrl] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [composeMode, setComposeMode] = useState<"chat" | "image" | "video">("chat");
  const [aspect, setAspect] = useState("1:1");
  const [imageQuality, setImageQuality] = useState<"standard" | "high">("high");
  const [answerStyle, setAnswerStyle] = useState<
    "default" | "short" | "detailed" | "steps" | "easy" | "exam"
  >("default");
  const [studyMode, setStudyMode] = useState(false);
  const [lastFileId, setLastFileId] = useState("");
  const [videoAspect, setVideoAspect] = useState("16:9");
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoQuality, setVideoQuality] = useState<"standard" | "high" | "highest">(
    "high",
  );
  const [videoConfigured, setVideoConfigured] = useState<boolean | null>(null);
  const [notice, setNotice] = useState("");
  const [activeTool, setActiveTool] = useState<PlusTool>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pollTimers = useRef<Record<string, number>>({});

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/conversations", { cache: "no-store" });
      const json = (await res.json()) as { ok?: boolean; conversations?: ConvItem[] };
      if (json.ok) setConversations(json.conversations || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadConversations();
    void fetch("/api/ai/workspace/video?settings=1")
      .then((r) => r.json())
      .then((j: { configured?: boolean }) => setVideoConfigured(Boolean(j.configured)))
      .catch(() => setVideoConfigured(false));
    try {
      const params = new URLSearchParams(window.location.search);
      const compose = params.get("compose");
      const promptParam = params.get("prompt");
      if (compose === "video" || compose === "image") {
        setComposeMode(compose);
        setNotice(
          compose === "video"
            ? "Create Video mode — review the prompt and press Send."
            : "Create Image mode — review the prompt and press Send.",
        );
      }
      if (promptParam) setInput(promptParam);
    } catch {
      /* ignore */
    }
    return () => {
      Object.values(pollTimers.current).forEach((t) => window.clearInterval(t));
    };
  }, [loadConversations]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(160, Math.max(44, el.scrollHeight))}px`;
  }, [input]);

  const filtered = conversations.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${c.title} ${c.preview || ""}`.toLowerCase().includes(q);
  });

  async function startNewChat() {
    setMessages([]);
    setConversationId("");
    setAttachment(null);
    setUrl("");
    setWebSearch(false);
    setComposeMode("chat");
    setNotice("");
    setPlusOpen(false);
    setSidebarOpen(false);
    setActiveTool(null);
    try {
      const res = await fetch("/api/ai/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "new" }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        conversation?: { id: string };
      };
      if (json.conversation?.id) setConversationId(json.conversation.id);
      await loadConversations();
    } catch {
      /* ignore */
    }
  }

  async function openConversation(id: string) {
    setSidebarOpen(false);
    setNotice("");
    try {
      const res = await fetch("/api/ai/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get", id }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        conversation?: { id: string; messages: Msg[] };
        error?: string;
      };
      if (!json.ok || !json.conversation) {
        setNotice(json.error || "Could not open chat.");
        return;
      }
      setConversationId(json.conversation.id);
      setMessages(json.conversation.messages || []);
      setComposeMode("chat");
    } catch {
      setNotice("Could not open chat.");
    }
  }

  async function renameChat(id: string, current: string) {
    const title = window.prompt("Rename chat", current);
    if (!title?.trim()) return;
    await fetch("/api/ai/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rename", id, title }),
    });
    await loadConversations();
  }

  async function deleteChat(id: string) {
    if (!confirm("Delete this conversation?")) return;
    await fetch("/api/ai/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    if (conversationId === id) {
      setConversationId("");
      setMessages([]);
    }
    await loadConversations();
  }

  async function uploadFile(file: File) {
    setNotice("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/ai/workspace/upload", { method: "POST", body: fd });
    const json = (await res.json()) as {
      ok?: boolean;
      error?: string;
      file?: Attached;
    };
    if (!res.ok || !json.ok || !json.file) {
      setNotice(json.error || "Upload failed.");
      return;
    }
    setAttachment(json.file);
  }

  function stopGenerating() {
    abortRef.current?.abort();
    setAborting(true);
    setSending(false);
  }

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (sending) return;
    if (!text && !attachment && !url) return;

    if (composeMode === "image") {
      await generateImage(text || "Create an image");
      return;
    }
    if (composeMode === "video") {
      await generateVideo(text || "Create a cinematic promotional video");
      return;
    }

    // Auto-route media intents from normal chat (do not ask the text model to "draw").
    // Only treat a currently attached image as edit context — not a stale lastFileId.
    const mediaIntent = detectMediaIntent(text, {
      hasImageAttachment: Boolean(attachment?.isImage),
    });
    if (mediaIntent === "image") {
      setComposeMode("image");
      await generateImage(text || "Create an image");
      return;
    }
    if (mediaIntent === "video") {
      setComposeMode("video");
      await generateVideo(
        text || "Create a cinematic promotional video",
        attachment?.isImage ? attachment.id : undefined,
      );
      return;
    }

    const userLine = [text, url ? `URL: ${url}` : "", attachment ? `File: ${attachment.name}` : ""]
      .filter(Boolean)
      .join("\n");

    setInput("");
    setSending(true);
    setAborting(false);
    setPlusOpen(false);
    setMessages((m) => [
      ...m,
      { role: "user", content: userLine || text },
      { role: "assistant", content: "" },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    const reuseFile =
      !attachment &&
      lastFileId &&
      /\b(it|this|that|the (chapter|file|document|pdf|paper|notes|page|image|photo))\b/i.test(
        text,
      );

    try {
      const res = await fetch("/api/ai/workspace/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: userLine || "Please analyze the attached content.",
          conversationId: conversationId || undefined,
          mode: studyMode ? "study" : "general",
          answerStyle,
          enableWebSearch: webSearch || undefined,
          fileIds: attachment
            ? [attachment.id]
            : reuseFile
              ? [lastFileId]
              : [],
          url: url || undefined,
          stream: true,
        }),
      });

      const ctype = res.headers.get("content-type") || "";
      if (!res.ok || !ctype.includes("text/event-stream") || !res.body) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
          reply?: string;
        };
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "assistant",
            content: json.reply || json.error || "Could not answer right now.",
          };
          return next;
        });
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            const line = part.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            let ev: {
              type?: string;
              text?: string;
              conversationId?: string;
              citations?: Array<{ title?: string; url: string }>;
              error?: string;
              reply?: string;
              imageUrl?: string;
              imageDataUrl?: string;
              imagePrompt?: string;
              mediaIntent?: string;
            };
            try {
              ev = JSON.parse(line.slice(6)) as typeof ev;
            } catch {
              continue;
            }
            if (ev.type === "meta" && ev.conversationId) {
              setConversationId(ev.conversationId);
            }
            if (ev.type === "delta" && ev.text) {
              setMessages((m) => {
                const next = [...m];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  next[next.length - 1] = {
                    ...last,
                    content: last.content + ev.text,
                  };
                }
                return next;
              });
            }
            if (ev.type === "image") {
              const displayUrl = ev.imageDataUrl || ev.imageUrl;
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = {
                  role: "assistant",
                  content: ev.reply || "Here’s your generated image.",
                  imageDataUrl: displayUrl,
                  imagePrompt: ev.imagePrompt || text,
                };
                return next;
              });
            }
            if (ev.type === "done") {
              if (ev.conversationId) setConversationId(ev.conversationId);
              setMessages((m) => {
                const next = [...m];
                const last = next[next.length - 1];
                if (last?.role === "assistant" && !last.imageDataUrl) {
                  next[next.length - 1] = {
                    ...last,
                    content: ev.reply || last.content,
                    citations: ev.citations,
                  };
                }
                return next;
              });
            }
            if (ev.type === "error") {
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = {
                  role: "assistant",
                  content: ev.error || "Could not answer right now.",
                };
                return next;
              });
            }
          }
        }
      }
      if (attachment?.id) setLastFileId(attachment.id);
      setAttachment(null);
      setUrl("");
      setActiveTool(null);
      await loadConversations();
    } catch (err) {
      if ((err as Error).name === "AbortError" || aborting) {
        setMessages((m) => {
          const next = [...m];
          const last = next[next.length - 1];
          if (last?.role === "assistant" && !last.content) {
            next[next.length - 1] = { role: "assistant", content: "Generation stopped." };
          } else if (last?.role === "assistant") {
            next[next.length - 1] = {
              ...last,
              content: `${last.content}\n\n_Generation stopped._`,
            };
          } else {
            next.push({ role: "assistant", content: "Generation stopped." });
          }
          return next;
        });
      } else {
        setMessages((m) => {
          const next = [...m];
          const last = next[next.length - 1];
          if (last?.role === "assistant" && !last.content) {
            next[next.length - 1] = {
              role: "assistant",
              content: "Connection issue. Please try again.",
            };
          } else {
            next.push({ role: "assistant", content: "Connection issue. Please try again." });
          }
          return next;
        });
      }
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }

  async function regenerate(lastUser: string) {
    setMessages((m) => {
      let next = m;
      if (next.length && next[next.length - 1].role === "assistant") next = next.slice(0, -1);
      if (next.length && next[next.length - 1].role === "user") next = next.slice(0, -1);
      return next;
    });
    await sendMessage(lastUser);
  }

  async function generateImage(prompt: string) {
    setSending(true);
    setPlusOpen(false);
    setMessages((m) => [...m, { role: "user", content: prompt }]);
    try {
      const res = await fetch("/api/ai/workspace/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          conversationId: conversationId || undefined,
          aspectRatio: aspect,
          quality: imageQuality === "standard" ? "medium" : "high",
          action: attachment?.isImage || lastFileId ? "edit" : "generate",
          fileId: attachment?.isImage ? attachment.id : lastFileId || undefined,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        reply?: string;
        error?: string;
        imageDataUrl?: string;
        imageUrl?: string;
        conversationId?: string;
      };
      if (json.conversationId) setConversationId(json.conversationId);
      const displayUrl = json.imageDataUrl || json.imageUrl;
      if (!res.ok || !json.ok || !displayUrl) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              json.error ||
              "Image generation failed. Check Admin → AI Provider Status and OPENAI_IMAGE_MODEL.",
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: json.reply || "Here’s your generated image.",
            imageDataUrl: displayUrl,
            imagePrompt: prompt,
          },
        ]);
        if (attachment?.id) setLastFileId(attachment.id);
      }
      setComposeMode("chat");
      setAttachment(null);
      await loadConversations();
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Could not reach the image API. Check the server connection and try again.",
        },
      ]);
    } finally {
      setSending(false);
      setInput("");
    }
  }

  function updateVideoMessage(jobId: string, patch: Partial<VideoMeta>, content?: string) {
    setMessages((m) =>
      m.map((msg) => {
        if (msg.video?.jobId !== jobId) return msg;
        return {
          ...msg,
          content: content ?? msg.content,
          video: { ...msg.video, ...patch },
        };
      }),
    );
  }

  function pollVideoJob(jobId: string) {
    if (pollTimers.current[jobId]) return;
    pollTimers.current[jobId] = window.setInterval(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/ai/workspace/video?id=${encodeURIComponent(jobId)}`, {
            cache: "no-store",
          });
          const json = (await res.json()) as {
            ok?: boolean;
            job?: VideoMeta & {
              durationSec?: number;
              resolution?: string;
              aspectRatio?: string;
              provider?: string;
              model?: string;
              error?: string;
              videoUrl?: string;
              status: string;
              id: string;
            };
          };
          if (!json.ok || !json.job) return;
          const j = json.job;
          const meta: VideoMeta = {
            jobId: j.id,
            status: j.status,
            videoUrl: j.videoUrl,
            durationSec: j.durationSec,
            resolution: j.resolution,
            aspectRatio: j.aspectRatio,
            provider: j.provider,
            model: j.model,
            error: j.error,
          };
          if (j.status === "completed") {
            updateVideoMessage(jobId, meta, "Here’s your generated video.");
            window.clearInterval(pollTimers.current[jobId]);
            delete pollTimers.current[jobId];
          } else if (j.status === "failed" || j.status === "cancelled") {
            updateVideoMessage(
              jobId,
              meta,
              j.error || `Video generation ${j.status}.`,
            );
            window.clearInterval(pollTimers.current[jobId]);
            delete pollTimers.current[jobId];
          } else {
            updateVideoMessage(jobId, meta, "Generating your video…");
          }
        } catch {
          /* keep polling */
        }
      })();
    }, 4000);
  }

  async function generateVideo(prompt: string, imageFileId?: string) {
    setPlusOpen(false);
    const mode = imageFileId || attachment?.isImage ? "image" : "text";
    const fileId = imageFileId || (attachment?.isImage ? attachment.id : undefined);
    setMessages((m) => [
      ...m,
      {
        role: "user",
        content:
          mode === "image"
            ? `${prompt}\n(Image → Video)`
            : prompt,
      },
      {
        role: "assistant",
        content: "Starting video generation…",
        video: { jobId: "pending", status: "queued", prompt },
      },
    ]);
    setInput("");
    setComposeMode("chat");
    setNotice("");

    try {
      const res = await fetch("/api/ai/workspace/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          conversationId: conversationId || undefined,
          aspectRatio: videoAspect,
          durationSec: videoDuration,
          quality: videoQuality,
          mode,
          imageFileId: fileId,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        notice?: string;
        setup?: { steps?: string[] };
        job?: {
          id: string;
          status: string;
          durationSec?: number;
          resolution?: string;
          aspectRatio?: string;
          provider?: string;
          model?: string;
          error?: string;
          videoUrl?: string;
        };
      };

      if (!json.ok || !json.job) {
        const setupHint = json.setup?.steps?.join("\n") || "";
        setMessages((m) => {
          const next = [...m];
          const last = next[next.length - 1];
          if (last?.video?.jobId === "pending") {
            next[next.length - 1] = {
              role: "assistant",
              content:
                `${json.error || "Could not start video generation."}` +
                (setupHint ? `\n\nSetup:\n${setupHint}` : ""),
              video: {
                jobId: "failed",
                status: "failed",
                error: json.error,
                prompt,
              },
            };
          }
          return next;
        });
        setNotice(json.error || "Video provider not configured.");
        return;
      }

      const job = json.job;
      setMessages((m) => {
        const next = [...m];
        const last = next[next.length - 1];
        if (last?.video?.jobId === "pending" || last?.role === "assistant") {
          next[next.length - 1] = {
            role: "assistant",
            content: json.notice || "Generating your video…",
            video: {
              jobId: job.id,
              status: job.status,
              durationSec: job.durationSec,
              resolution: job.resolution,
              aspectRatio: job.aspectRatio,
              provider: job.provider,
              model: job.model,
              videoUrl: job.videoUrl,
              error: job.error,
              prompt,
            },
          };
        }
        return next;
      });
      setAttachment(null);
      if (job.status === "completed") return;
      pollVideoJob(job.id);
    } catch {
      setMessages((m) => [
        ...m.slice(0, -1),
        {
          role: "assistant",
          content: "Could not reach the video API.",
          video: { jobId: "failed", status: "failed", prompt },
        },
      ]);
    }
  }

  function pickPlus(tool: PlusTool) {
    setPlusOpen(false);
    setActiveTool(tool);
    if (tool === "file") fileRef.current?.click();
    if (tool === "image") imageRef.current?.click();
    if (tool === "video-upload") videoRef.current?.click();
    if (tool === "create-image") {
      setComposeMode("image");
      setAspect("1:1");
      setNotice("Create Image mode — describe what you want, then Send.");
    }
    if (tool === "create-video") {
      setComposeMode("video");
      setNotice(
        videoConfigured === false
          ? "Create Video needs VIDEO_GENERATION_API_KEY (Luma). See admin/.env setup."
          : "Create Video mode — describe the scene, adjust settings, then Send.",
      );
    }
    if (tool === "url") {
      const u = window.prompt("Website URL to analyze");
      if (u?.trim()) {
        setUrl(u.trim());
        setNotice("URL attached. Ask your question and Send.");
      }
    }
    if (tool === "search") {
      setWebSearch(true);
      setNotice("Web search enabled for this chat.");
    }
  }

  const showWelcome = messages.length === 0 && !sending;

  return (
    <div className="ai-shell flex h-[calc(100dvh-var(--header-h)-var(--mobile-nav-h))] min-h-[28rem] w-full overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex w-[18rem] flex-col border-r border-[var(--ai-border)] bg-[var(--ai-bg-soft)] transition-transform xl:static xl:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0",
        )}
        style={{ top: "var(--header-h)", height: "calc(100dvh - var(--header-h) - var(--mobile-nav-h))" }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[var(--ai-border)] bg-[var(--ai-bg)] px-3 py-3">
          <p className="font-display text-sm font-semibold tracking-wide text-[var(--ai-heading)]">
            JARCODE AI
          </p>
          <button
            type="button"
            className="ai-btn xl:hidden px-2 py-1 text-xs"
            onClick={() => setSidebarOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="space-y-2 p-3">
          <button
            type="button"
            className="ai-btn ai-btn-accent w-full !py-2.5 text-sm"
            onClick={() => void startNewChat()}
          >
            + New Chat
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            className="ai-input w-full px-3 py-2 text-sm"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          <p className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-[var(--ai-muted)] uppercase">
            Recent
          </p>
          {!filtered.length ? (
            <p className="px-2 py-3 text-xs text-[var(--ai-muted)]">No conversations yet.</p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((c) => (
                <li key={c.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => void openConversation(c.id)}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 text-left text-sm touch-manipulation",
                      conversationId === c.id
                        ? "ai-btn-active border border-[rgba(0,168,204,0.35)]"
                        : "text-[var(--ai-muted)] hover:bg-[var(--ai-bg-muted)] hover:text-[var(--ai-heading)]",
                    )}
                  >
                    <span className="line-clamp-1 font-medium">{c.title}</span>
                  </button>
                  <div className="absolute top-1 right-1 flex gap-1 opacity-100 xl:opacity-0 xl:group-hover:opacity-100">
                    <button
                      type="button"
                      className="ai-btn rounded px-1.5 text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        void renameChat(c.id, c.title);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-200 bg-red-50 px-1.5 text-[10px] text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteChat(c.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[var(--ai-border)] bg-[var(--ai-bg)] p-3">
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--ai-muted)] hover:bg-[var(--ai-bg-muted)] hover:text-[var(--ai-heading)]"
            onClick={() => setSettingsOpen((v) => !v)}
          >
            Settings
          </button>
          {settingsOpen ? (
            <div className="mt-2 space-y-2 rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-soft)] p-3 text-xs text-[var(--ai-muted)]">
              <p className="font-semibold text-[var(--ai-heading)]">AI by JARCODE TECHNOLOGY</p>
              <p>Public use has daily limits — not unlimited.</p>
              <label className="flex items-center gap-2 text-[var(--ai-text)]">
                <input
                  type="checkbox"
                  checked={webSearch}
                  onChange={(e) => setWebSearch(e.target.checked)}
                />
                Prefer web search
              </label>
              <Link href="/" className="ai-link block">
                Back to website
              </Link>
            </div>
          ) : null}
        </div>
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[65] bg-[rgba(17,24,39,0.35)] xl:hidden"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* Main chat */}
      <section className="relative flex min-w-0 flex-1 flex-col bg-[var(--ai-bg)]">
        <header className="flex items-center gap-2 border-b border-[var(--ai-border)] bg-[var(--ai-bg)] px-3 py-2.5 xl:px-5">
          <button
            type="button"
            className="ai-btn inline-flex h-10 w-10 items-center justify-center xl:hidden"
            aria-label="Open chats"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--ai-heading)]">JARCODE AI</p>
            <p className="truncate text-[11px] text-[var(--ai-muted)]">Ask anything</p>
          </div>
          <button
            type="button"
            className="ai-btn px-3 py-2 text-xs"
            onClick={() => void startNewChat()}
          >
            New
          </button>
        </header>

        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[var(--ai-bg-soft)] px-3 py-6 sm:px-6 [-webkit-overflow-scrolling:touch]"
        >
          {showWelcome ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
              <p className="font-display text-3xl font-bold text-[var(--ai-heading)] sm:text-4xl">
                Hello! How can I help you today?
              </p>
              <p className="mt-3 text-base text-[var(--ai-muted)]">Ask me anything.</p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((m, i) => (
                <div key={`${m.role}-${i}`} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {m.role === "assistant" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/images/logo-mark.png"
                        alt="JARCODE AI"
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full object-cover ring-1 ring-[var(--ai-border)]"
                      />
                    ) : null}
                    <p className="text-[11px] font-semibold tracking-wide text-[var(--ai-muted)] uppercase">
                      {m.role === "user" ? "You" : "JARCODE AI"}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                      m.role === "user"
                        ? "ai-bubble-user whitespace-pre-wrap"
                        : "ai-bubble-assistant",
                    )}
                  >
                    {m.role === "assistant" ? (
                      m.content ? (
                        <AiMarkdown content={m.content} />
                      ) : sending && i === messages.length - 1 ? (
                        <span className="animate-pulse text-[var(--ai-muted)]">Thinking…</span>
                      ) : null
                    ) : (
                      m.content
                    )}
                    {m.imageDataUrl ? (
                      <div className="mt-3 space-y-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.imageDataUrl}
                          alt="Generated"
                          className="max-h-96 w-auto rounded-xl border border-[var(--ai-border)]"
                        />
                        <div className="flex flex-wrap gap-3 text-xs">
                          <a
                            href={m.imageDataUrl}
                            download={`jarcode-ai-${Date.now()}.png`}
                            className="ai-link"
                          >
                            Download
                          </a>
                          <button
                            type="button"
                            className="ai-link"
                            onClick={() => {
                              setComposeMode("image");
                              setNotice("Edit mode — describe changes, then Send.");
                              setInput(
                                m.imagePrompt
                                  ? `Edit this image: ${m.imagePrompt}`
                                  : "Edit this image: ",
                              );
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="ai-link"
                            onClick={() => {
                              if (m.imagePrompt) void generateImage(m.imagePrompt);
                            }}
                          >
                            Regenerate
                          </button>
                          <button
                            type="button"
                            className="ai-link"
                            onClick={() => {
                              setComposeMode("video");
                              setNotice(
                                "Convert Image to Video — describe motion/camera, then Send. (Re-upload the image if needed.)",
                              );
                              setInput("Animate this image with cinematic camera movement.");
                            }}
                          >
                            Convert Image to Video
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {m.video ? (
                      <VideoResultCard
                        meta={m.video}
                        onRegenerate={() => {
                          if (m.video?.prompt) void generateVideo(m.video.prompt);
                        }}
                        onCreateAnother={() => {
                          setComposeMode("video");
                          setNotice("Create Video mode — describe a new scene, then Send.");
                          setInput("");
                        }}
                      />
                    ) : null}
                    {m.citations?.length ? (
                      <ul className="mt-3 space-y-1 text-xs">
                        {m.citations.map((c) => (
                          <li key={c.url}>
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ai-link underline"
                            >
                              {c.title || c.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  {m.role === "assistant" && !m.video ? (
                    <div className="flex gap-3 text-[11px] text-[var(--ai-muted)]">
                      <button
                        type="button"
                        onClick={() => void navigator.clipboard.writeText(m.content)}
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const lastUser = [...messages]
                            .reverse()
                            .find((x) => x.role === "user")?.content;
                          if (lastUser) void regenerate(lastUser);
                        }}
                      >
                        Regenerate
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
              {sending && messages[messages.length - 1]?.role !== "assistant" ? (
                <p className="animate-pulse text-sm text-[var(--ai-muted)]">JARCODE AI is typing…</p>
              ) : null}
            </div>
          )}
        </div>

        {notice ? (
          <p className="ai-notice mx-auto mb-2 w-full max-w-3xl rounded-xl px-3 py-2 text-xs sm:px-6">
            {notice}
            {url ? ` · URL ready` : ""}
            {webSearch ? ` · Web search on` : ""}
            {composeMode === "image" ? ` · Create Image mode` : ""}
            {composeMode === "video" ? ` · Create Video mode` : ""}
          </p>
        ) : null}

        {/* Input bar */}
        <div
          className="ai-mobile-composer border-t border-[var(--ai-border)] bg-[var(--ai-bg)] px-3 pt-3 xl:px-6"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="relative mx-auto w-full max-w-3xl">
            {composeMode === "chat" ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {(
                  [
                    ["default", "Balanced"],
                    ["short", "Short Answer"],
                    ["detailed", "Detailed"],
                    ["steps", "Step-by-Step"],
                    ["easy", "Easy Explanation"],
                    ["exam", "Exam Answer"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAnswerStyle(id)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold",
                      answerStyle === id
                        ? "border-[rgba(0,168,204,0.45)] bg-[var(--ai-accent-soft)] text-[var(--ai-heading)]"
                        : "border-[var(--ai-border)] bg-white text-[var(--ai-muted)]",
                    )}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setStudyMode((v) => !v)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-semibold",
                    studyMode
                      ? "border-[rgba(0,168,204,0.45)] bg-[var(--ai-accent-soft)] text-[var(--ai-heading)]"
                      : "border-[var(--ai-border)] bg-white text-[var(--ai-muted)]",
                  )}
                >
                  Student Study Mode
                </button>
              </div>
            ) : null}

            {composeMode === "image" ? (
              <div className="mb-2 grid gap-2 rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-bg-muted)] p-3 sm:grid-cols-2">
                <label className="text-[11px] text-[var(--ai-muted)]">
                  Aspect ratio
                  <select
                    value={aspect}
                    onChange={(e) => setAspect(e.target.value)}
                    className="ai-input mt-1 w-full px-2 py-2 text-sm"
                  >
                    <option value="1:1">Square 1:1</option>
                    <option value="4:5">Portrait 4:5</option>
                    <option value="9:16">Vertical 9:16</option>
                    <option value="16:9">Landscape 16:9</option>
                  </select>
                </label>
                <label className="text-[11px] text-[var(--ai-muted)]">
                  Quality
                  <select
                    value={imageQuality}
                    onChange={(e) =>
                      setImageQuality(e.target.value as "standard" | "high")
                    }
                    className="ai-input mt-1 w-full px-2 py-2 text-sm"
                  >
                    <option value="standard">Standard (faster)</option>
                    <option value="high">High (precise edits)</option>
                  </select>
                </label>
                <p className="sm:col-span-2 text-[11px] text-[var(--ai-muted)]">
                  Upload a photo then describe a new scene to keep facial identity as close as
                  possible. Preview and regenerate if needed — exact identity is not guaranteed.
                </p>
              </div>
            ) : null}

            {composeMode === "video" ? (
              <div className="mb-2 grid gap-2 rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-bg-muted)] p-3 sm:grid-cols-3">
                <label className="text-[11px] text-[var(--ai-muted)]">
                  Aspect ratio
                  <select
                    value={videoAspect}
                    onChange={(e) => setVideoAspect(e.target.value)}
                    className="ai-input mt-1 w-full px-2 py-2 text-sm"
                  >
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                    <option value="1:1">1:1 Square</option>
                  </select>
                </label>
                <label className="text-[11px] text-[var(--ai-muted)]">
                  Duration
                  <select
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(Number(e.target.value))}
                    className="ai-input mt-1 w-full px-2 py-2 text-sm"
                  >
                    <option value={5}>5 seconds</option>
                    <option value={9}>9 seconds</option>
                  </select>
                </label>
                <label className="text-[11px] text-[var(--ai-muted)]">
                  Quality
                  <select
                    value={videoQuality}
                    onChange={(e) =>
                      setVideoQuality(e.target.value as "standard" | "high" | "highest")
                    }
                    className="ai-input mt-1 w-full px-2 py-2 text-sm"
                  >
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                    <option value="highest">Highest</option>
                  </select>
                </label>
                <p className="sm:col-span-3 text-[11px] text-[var(--ai-muted)]">
                  Powered by Luma Dream Machine · OpenAI enhances your prompt · Image attach =
                  image-to-video
                </p>
              </div>
            ) : null}

            {attachment ? (
              <div className="mb-2 flex items-center justify-between rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-muted)] px-3 py-2 text-xs text-[var(--ai-text)]">
                <span>
                  {attachment.name} ({Math.round(attachment.size / 1024)} KB)
                  {attachment.isImage ? " · image" : ""}
                  {attachment.isVideo ? " · video" : ""}
                </span>
                <button type="button" className="ai-link" onClick={() => setAttachment(null)}>
                  Remove
                </button>
              </div>
            ) : null}

            {plusOpen ? (
              <div className="ai-dropdown absolute bottom-[calc(100%+0.5rem)] left-0 z-20 w-60 overflow-hidden rounded-2xl">
                {[
                  { id: "create-image" as const, label: "Create Image" },
                  { id: "create-video" as const, label: "Create Video" },
                  { id: "image" as const, label: "Upload Image" },
                  { id: "video-upload" as const, label: "Upload Video" },
                  { id: "file" as const, label: "Upload Documents" },
                  { id: "url" as const, label: "Analyze Website" },
                  { id: "search" as const, label: "Web Search" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="block w-full px-4 py-3 text-left text-sm text-[var(--ai-text)] hover:bg-[var(--ai-bg-muted)]"
                    onClick={() => pickPlus(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex items-end gap-2 rounded-[1.6rem] border border-[var(--ai-border)] bg-[var(--ai-bg)] px-2 py-2 shadow-[var(--ai-shadow-sm)]">
              <button
                type="button"
                aria-label="More tools"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl text-[var(--ai-muted)] hover:bg-[var(--ai-bg-muted)] hover:text-[var(--ai-heading)]"
                onClick={() => setPlusOpen((v) => !v)}
              >
                +
              </button>
              <textarea
                ref={taRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder={
                  composeMode === "image"
                    ? "Describe an image to create…"
                    : composeMode === "video"
                      ? "Describe the video to create…"
                      : "Ask anything..."
                }
                className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-1 py-2.5 text-base text-[var(--ai-text)] outline-none placeholder:text-[var(--ai-muted)] sm:text-[15px]"
              />
              <button
                type="button"
                aria-label="Voice conversation"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--ai-muted)] hover:bg-[var(--ai-bg-muted)] hover:text-[var(--ai-heading)]"
                title="Open voice via floating AI Assistant"
                onClick={() => {
                  setNotice("Opening Live Voice — allow microphone when Safari asks.");
                  window.dispatchEvent(new Event("jarcode-ai-open-voice"));
                }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
                </svg>
              </button>
              {sending ? (
                <button
                  type="button"
                  className="ai-btn inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm"
                  onClick={stopGenerating}
                >
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Send"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--ai-heading)] text-white hover:bg-[#1f2937]"
                  onClick={() => void sendMessage()}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M3.5 12 20 4l-5.5 16-2.8-6.2L3.5 12z" />
                  </svg>
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-[10px] text-[var(--ai-muted)]">
              JARCODE AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </section>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.rtf,.md,.ppt,.pptx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp,text/plain"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadFile(f);
          e.target.value = "";
        }}
      />
      <input
        ref={imageRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadFile(f);
          e.target.value = "";
        }}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
