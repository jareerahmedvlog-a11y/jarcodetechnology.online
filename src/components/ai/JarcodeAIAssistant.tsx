"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Mode = "chat" | "voice";
type OrbState =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "disconnected"
  | "error";

type Msg = {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
};

const SUGGESTIONS = [
  "Show me the Hospital Management Demo.",
  "Explain your Society Management Software.",
  "How can I create a Client ERP?",
  "Where can I find your services?",
];

function friendlyNotice(raw: string) {
  const t = String(raw || "").trim();
  if (!t) return "Please try again in a moment.";
  if (/sk-|api[_-]?key|Bearer|ek_/i.test(t)) {
    return "Assistant is temporarily unavailable. Please try again shortly.";
  }
  if (/quota|billing|budget|limit/i.test(t)) {
    return "AI usage limit reached for now. Please try again later.";
  }
  if (/microphone|NotAllowed|Permission/i.test(t)) {
    return "Microphone permission is needed for voice. You can continue with text chat.";
  }
  if (/network|fetch|Failed to fetch/i.test(t)) {
    return "Connection issue. On iPhone use the HTTPS testing link, then try again.";
  }
  if (/secure context|https/i.test(t)) {
    return "Microphone needs HTTPS. Open the secure mobile testing link on your iPhone.";
  }
  return t.length > 160 ? `${t.slice(0, 157)}…` : t;
}

export function JarcodeAIAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const onAiWorkspace = pathname === "/ai" || pathname?.startsWith("/ai/");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [roleLabel, setRoleLabel] = useState("Public Visitor");
  const [orb, setOrb] = useState<OrbState>("idle");
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [privacy, setPrivacy] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const voiceStartedAt = useRef<number>(0);
  const voiceTimerRef = useRef<number>(0);

  useEffect(() => {
    void fetch("/api/ai/me")
      .then((r) => r.json())
      .then((j: { label?: string; privacy?: string }) => {
        if (j.label) setRoleLabel(j.label);
        if (j.privacy) setPrivacy(j.privacy);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const openVoice = () => {
      setOpen(true);
      setMode("voice");
      setNotice("Tap the orb to start Live Voice (HTTPS + mic permission required).");
    };
    window.addEventListener("jarcode-ai-open-voice", openVoice);
    return () => window.removeEventListener("jarcode-ai-open-voice", openVoice);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, sending]);

  const orbLabel = useMemo(() => {
    switch (orb) {
      case "connecting":
        return "Connecting…";
      case "listening":
        return "Listening";
      case "thinking":
        return "Thinking…";
      case "speaking":
        return "Speaking";
      case "error":
        return "Error";
      case "disconnected":
        return "Disconnected";
      default:
        return "Tap to talk";
    }
  }, [orb]);

  async function ensureConversation() {
    if (conversationId) return conversationId;
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "new" }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      conversationId?: string;
      label?: string;
      error?: string;
    };
    if (!res.ok || !json.ok || !json.conversationId) {
      throw new Error(json.error || "Could not start conversation.");
    }
    setConversationId(json.conversationId);
    if (json.label) setRoleLabel(json.label);
    return json.conversationId;
  }

  async function sendChat(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    setSending(true);
    setNotice("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput("");
    try {
      const id = await ensureConversation();
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId: id }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        reply?: string;
        error?: string;
        conversationId?: string;
        label?: string;
        imageUrl?: string;
        imageDataUrl?: string;
        mediaIntent?: string;
        actions?: Array<{ type: string; path?: string; message?: string }>;
      };
      if (!res.ok || !json.ok || !json.reply) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: friendlyNotice(json.error || "I could not answer that just now. Please try again."),
          },
        ]);
        return;
      }
      if (json.conversationId) setConversationId(json.conversationId);
      if (json.label) setRoleLabel(json.label);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: json.reply!,
          imageUrl: json.imageUrl || json.imageDataUrl,
        },
      ]);
      for (const action of json.actions || []) {
        if (action.type === "navigate" && action.path) {
          if (json.mediaIntent === "video") {
            setNotice("Opening Full AI Workspace for video generation…");
            setOpen(false);
          }
          router.push(action.path);
        }
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: friendlyNotice("Network error."),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function newChat() {
    await endVoice(false);
    setMessages([]);
    setTranscript([]);
    setNotice("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "new" }),
      });
      const json = (await res.json()) as { conversationId?: string; label?: string };
      setConversationId(json.conversationId || "");
      if (json.label) setRoleLabel(json.label);
    } catch {
      setConversationId("");
    }
  }

  async function clearChat() {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear", conversationId }),
    });
    setMessages([]);
    setTranscript([]);
  }

  function cleanupVoice() {
    if (voiceTimerRef.current) {
      window.clearTimeout(voiceTimerRef.current);
      voiceTimerRef.current = 0;
    }
    try {
      dcRef.current?.close();
    } catch {
      /* ignore */
    }
    dcRef.current = null;
    try {
      pcRef.current?.getSenders().forEach((s) => s.track?.stop());
      pcRef.current?.close();
    } catch {
      /* ignore */
    }
    pcRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  }

  async function endVoice(report = true) {
    const started = voiceStartedAt.current;
    cleanupVoice();
    setOrb(started ? "disconnected" : "idle");
    if (report && started) {
      const minutes = Math.max(0.1, (Date.now() - started) / 60000);
      voiceStartedAt.current = 0;
      try {
        await fetch("/api/ai/realtime/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "end",
            conversationId,
            durationMinutes: minutes,
          }),
        });
      } catch {
        /* ignore */
      }
    } else {
      voiceStartedAt.current = 0;
    }
  }

  async function startVoice() {
    setNotice("");
    setOrb("connecting");
    try {
      const id = await ensureConversation();
      const tokenRes = await fetch("/api/ai/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id }),
      });
      const tokenJson = (await tokenRes.json()) as {
        ok?: boolean;
        error?: string;
        client_secret?: string;
        conversationId?: string;
        config?: { webrtcUrl?: string; maxMinutes?: number };
      };
      if (!tokenRes.ok || !tokenJson.ok || !tokenJson.client_secret) {
        setOrb("idle");
        setNotice(friendlyNotice(tokenJson.error || "Voice is unavailable right now. Use text chat."));
        return;
      }
      if (tokenJson.conversationId) setConversationId(tokenJson.conversationId);

      if (typeof window !== "undefined" && !window.isSecureContext) {
        setOrb("idle");
        setNotice(
          "Microphone needs HTTPS. Open the secure mobile testing link (https://…) on your iPhone, then try Live Voice again.",
        );
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setOrb("idle");
        setNotice("This browser cannot access the microphone. Use Safari on iPhone over HTTPS.");
        return;
      }

      cleanupVoice();
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audioEl = audioRef.current || document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.setAttribute("playsinline", "true");
      audioEl.setAttribute("webkit-playsinline", "true");
      audioEl.volume = volume;
      audioRef.current = audioEl;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
        void audioEl.play().catch(() => undefined);
        setOrb("speaking");
      };

      const ms = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = ms;
      ms.getAudioTracks().forEach((t) => {
        t.enabled = !muted;
        pc.addTrack(t, ms);
      });

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (ev) => {
        try {
          const event = JSON.parse(String(ev.data)) as {
            type?: string;
            transcript?: string;
            delta?: string;
          };
          const type = String(event.type || "");
          if (type.includes("input_audio_buffer.speech_started")) setOrb("listening");
          if (type.includes("response.created")) setOrb("thinking");
          if (
            type.includes("response.output_audio.delta") ||
            type.includes("output_audio")
          ) {
            setOrb("speaking");
          }
          if (type.includes("response.done") || type.includes("output_audio.done")) {
            setOrb("listening");
          }
          if (
            type === "conversation.item.input_audio_transcription.completed" ||
            type === "response.output_audio_transcript.done"
          ) {
            const text = String(event.transcript || "").trim();
            if (text) {
              setTranscript((t) => [...t.slice(-30), text]);
              const role = type.includes("input_audio") ? "user" : "assistant";
              setMessages((m) => [...m, { role, content: text }]);
            }
          }
        } catch {
          /* ignore non-json */
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const sdpRes = await fetch(
        tokenJson.config?.webrtcUrl || "https://api.openai.com/v1/realtime/calls",
        {
          method: "POST",
          body: offer.sdp || "",
          headers: {
            Authorization: `Bearer ${tokenJson.client_secret}`,
            "Content-Type": "application/sdp",
          },
        },
      );
      if (!sdpRes.ok) {
        setOrb("idle");
        setNotice(friendlyNotice("Voice connection failed. Please use text chat for now."));
        cleanupVoice();
        return;
      }
      const answer = { type: "answer" as const, sdp: await sdpRes.text() };
      await pc.setRemoteDescription(answer);
      voiceStartedAt.current = Date.now();
      setOrb("listening");

      const maxMs = (tokenJson.config?.maxMinutes || 20) * 60_000;
      voiceTimerRef.current = window.setTimeout(() => {
        void endVoice(true);
        setNotice("Voice session ended after the maximum duration. You can start again or use text chat.");
      }, maxMs);
    } catch (err) {
      cleanupVoice();
      setOrb("idle");
      const msg = err instanceof Error ? err.message : "";
      setNotice(friendlyNotice(msg || "Could not start voice conversation."));
    }
  }

  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      micStreamRef.current?.getAudioTracks().forEach((t) => {
        t.enabled = !next;
      });
      return next;
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open JARCODE AI Assistant"
        onClick={() => setOpen(true)}
        className={cn(
          "ai-fab fixed z-[55] inline-flex items-center gap-2 rounded-full px-3.5 py-2.5",
          onAiWorkspace
            ? "pointer-events-none invisible xl:pointer-events-auto xl:visible xl:right-6 xl:bottom-28"
            : "right-3 bottom-[calc(var(--mobile-nav-h)+0.85rem)] xl:right-6 xl:bottom-24",
          "touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ai-accent)]",
        )}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--ai-border)] bg-[var(--ai-bg-muted)] text-[var(--ai-heading)]"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 14v-2a8 8 0 0 1 16 0v2" strokeLinecap="round" />
            <path d="M4 14a2 2 0 0 0 2 2h1v-4H6a2 2 0 0 0-2 2zM20 14a2 2 0 0 1-2 2h-1v-4h1a2 2 0 0 1 2 2z" />
            <path d="M12 18v2M9 22h6" strokeLinecap="round" />
          </svg>
        </span>
        <span className="pr-1 text-sm font-semibold tracking-wide text-[var(--ai-heading)]">
          AI Assistant
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(17,24,39,0.35)] p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="JARCODE AI Assistant"
        >
          <div
            className="ai-shell flex h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[var(--ai-border)] shadow-[var(--ai-shadow)] sm:h-auto sm:max-h-[min(92dvh,720px)] sm:rounded-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--ai-border)] bg-[var(--ai-bg)] px-4 py-3">
              <div>
                <p className="font-display text-lg font-semibold text-[var(--ai-heading)]">
                  JARCODE AI
                </p>
                <p className="text-xs text-[var(--ai-muted)]">
                  Signed context: {roleLabel} · Text & live voice
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/ai"
                  className="ai-btn px-3 py-1.5 text-sm"
                  onClick={() => {
                    void endVoice(true);
                    setOpen(false);
                  }}
                >
                  Full AI Workspace
                </Link>
                <button
                  type="button"
                  className="ai-btn px-3 py-1.5 text-sm"
                  onClick={() => {
                    void endVoice(true);
                    setOpen(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex gap-2 border-b border-[var(--ai-border)] bg-[var(--ai-bg-soft)] px-4 py-2">
              <button
                type="button"
                className={cn(
                  "ai-btn min-h-10 flex-1 text-sm",
                  mode === "chat" && "ai-btn-active",
                )}
                onClick={() => {
                  void endVoice(true);
                  setMode("chat");
                }}
              >
                Text Chat
              </button>
              <button
                type="button"
                className={cn(
                  "ai-btn min-h-10 flex-1 text-sm",
                  mode === "voice" && "ai-btn-active",
                )}
                onClick={() => setMode("voice")}
              >
                Live Voice
              </button>
            </div>

            {notice ? (
              <p className="ai-notice mx-4 mt-3 rounded-xl px-3 py-2 text-sm">{notice}</p>
            ) : null}

            {mode === "chat" ? (
              <>
                <div className="flex flex-wrap gap-2 bg-[var(--ai-bg)] px-4 pt-3">
                  <button
                    type="button"
                    className="ai-btn px-2 py-1 text-xs"
                    onClick={() => void newChat()}
                  >
                    New Chat
                  </button>
                  <button
                    type="button"
                    className="ai-btn px-2 py-1 text-xs"
                    onClick={() => void clearChat()}
                  >
                    Clear Chat
                  </button>
                </div>
                {!messages.length ? (
                  <div className="flex flex-wrap gap-2 bg-[var(--ai-bg)] px-4 pt-3">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="ai-chip px-3 py-1.5 text-left text-xs"
                        onClick={() => void sendChat(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div
                  ref={listRef}
                  className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[var(--ai-bg-soft)] px-4 py-4 [-webkit-overflow-scrolling:touch]"
                >
                  {messages.map((m, i) => (
                    <div
                      key={`${m.role}-${i}`}
                      className={cn(
                        "max-w-[90%] space-y-2 rounded-2xl px-3 py-2 text-sm",
                        m.role === "user"
                          ? "ai-bubble-user ml-auto"
                          : "ai-bubble-assistant mr-auto",
                      )}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>
                      {m.imageUrl ? (
                        <div className="space-y-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.imageUrl}
                            alt="Generated"
                            className="max-h-64 w-auto rounded-xl border border-[var(--ai-border)]"
                          />
                          <a href={m.imageUrl} download className="ai-link text-xs">
                            Download
                          </a>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {sending ? (
                    <p className="animate-pulse text-xs text-[var(--ai-muted)]">AI is typing…</p>
                  ) : null}
                </div>
                <form
                  className="flex gap-2 border-t border-[var(--ai-border)] bg-[var(--ai-bg)] p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendChat(input);
                  }}
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about demos, services, ERP…"
                    className="ai-input min-h-11 flex-1 px-3 text-base sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="ai-btn ai-btn-accent min-h-11 px-4"
                    disabled={sending}
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto bg-[var(--ai-bg-soft)] px-4 py-6">
                <button
                  type="button"
                  className={cn(
                    "jarcode-ai-orb relative flex h-28 w-28 items-center justify-center rounded-full",
                    orb === "listening" && "jarcode-ai-orb-listening",
                    orb === "speaking" && "jarcode-ai-orb-speaking",
                    orb === "error" && "opacity-70",
                  )}
                  onClick={() => {
                    if (orb === "idle" || orb === "disconnected" || orb === "error") {
                      void startVoice();
                    }
                  }}
                >
                  <span className="jarcode-ai-orb-core" aria-hidden />
                  <span className="relative z-10 text-sm font-semibold text-[var(--ai-heading)]">
                    {orbLabel}
                  </span>
                </button>
                <p className="text-center text-xs text-[var(--ai-muted)]">
                  Status: {orb} · Shared chat context kept for this session
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {(orb === "idle" || orb === "disconnected" || orb === "error") && (
                    <button
                      type="button"
                      className="ai-btn ai-btn-accent px-4 py-2 text-sm"
                      onClick={() => void startVoice()}
                    >
                      Start Voice
                    </button>
                  )}
                  {orb !== "idle" && orb !== "disconnected" && (
                    <>
                      <button type="button" className="ai-btn px-4 py-2 text-sm" onClick={toggleMute}>
                        {muted ? "Unmute Mic" : "Mute Mic"}
                      </button>
                      <button
                        type="button"
                        className="ai-btn px-4 py-2 text-sm"
                        onClick={() => void endVoice(true)}
                      >
                        End Conversation
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="ai-btn px-4 py-2 text-sm"
                    onClick={() => {
                      void endVoice(true);
                      setMode("chat");
                    }}
                  >
                    Switch to Text
                  </button>
                </div>
                <label className="flex w-full max-w-xs items-center gap-2 text-xs text-[var(--ai-muted)]">
                  Volume
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setVolume(v);
                      if (audioRef.current) audioRef.current.volume = v;
                    }}
                    className="flex-1"
                  />
                </label>
                <div className="w-full rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg)] p-3">
                  <p className="text-xs font-semibold text-[var(--ai-heading)]">Live transcript</p>
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-[var(--ai-muted)]">
                    {transcript.length ? (
                      transcript.map((t, i) => <li key={`${i}-${t.slice(0, 12)}`}>{t}</li>)
                    ) : (
                      <li>Transcripts appear after you connect and speak.</li>
                    )}
                  </ul>
                </div>
                {privacy ? (
                  <p className="text-[11px] leading-relaxed text-[var(--ai-muted)]">{privacy}</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
