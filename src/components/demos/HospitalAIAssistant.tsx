"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_WARNING } from "@/config/demos";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

const SUGGESTIONS = [
  "How many patients are registered?",
  "How many appointments are scheduled today?",
  "How many patients are currently admitted?",
  "Show today's appointment summary.",
  "Which medicines are available in pharmacy inventory?",
  "What is the total billing amount?",
  "Show department-wise patient statistics.",
];

function AiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4L12 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M5 14.5l.8 2.2L8 17.5l-2.2.8L5 20.5l-.8-2.2L2 17.5l2.2-.8L5 14.5zM19 14l.7 1.8L21.5 16l-1.8.7L19 18.5l-.7-1.8L16.5 16l1.8-.7L19 14z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type AssistantMode = "public" | "tenant";

export function HospitalAIAssistant({ mode = "public" }: { mode?: AssistantMode }) {
  const isTenant = mode === "tenant";
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: isTenant
        ? "Hello — I am your private Hospital ERP AI Assistant. I only read your tenant hospital records."
        : "Hello — I am the Hospital Demo AI Assistant. Ask me about patients, doctors, appointments, admissions, billing, pharmacy, and other demo modules. I only read fictional demo data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || sending) return;

    setError("");
    setInput("");
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(
        isTenant ? "/api/erp/ai/chat" : "/api/hospital-ai/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
        },
      );
      const json = (await res.json()) as {
        ok?: boolean;
        reply?: string;
        error?: string;
      };

      if (!res.ok || !json.ok || !json.reply) {
        const failText =
          json.error ||
          "Sorry — I could not answer that right now. Please try again.";
        setError(json.error || "Could not reach the AI Assistant.");
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: failText,
          },
        ]);
        return;
      }

      const replyText = json.reply;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: replyText,
        },
      ]);
    } catch {
      setError("Network error while contacting the AI Assistant.");
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "Network error. Please check your connection and try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function clearChat() {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Chat cleared. Ask a new question about the Hospital Demo database.",
      },
    ]);
    setError("");
    setInput("");
  }

  return (
    <div className="space-y-4">
      <div className="demo-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--demo-border)] bg-[var(--demo-accent-soft)] text-[var(--demo-accent)]">
              <AiIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-[var(--demo-heading)]">
                AI Assistant
              </h2>
              <p className="mt-1 text-sm text-[var(--demo-text)]">
                Natural-language answers from the Hospital Demo database
                (read-only).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearChat}
            className="btn-secondary !w-auto touch-manipulation self-start"
          >
            Clear chat
          </button>
        </div>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
          {isTenant
            ? "Private client ERP AI — answers are limited to your authenticated hospital tenant data only."
            : `Public demonstration only — fictional sample data. Do not enter real patient information. ${DEMO_WARNING}`}
        </p>
      </div>

      <div className="demo-card flex min-h-[28rem] flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[var(--demo-bg)] p-4 sm:p-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap sm:max-w-[80%]",
                  msg.role === "user"
                    ? "rounded-br-md border border-[var(--demo-border)] bg-[var(--demo-surface-2)] text-[var(--demo-heading)]"
                    : "rounded-bl-md border border-[var(--demo-border)] bg-white text-[var(--demo-text)]",
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {sending ? (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-[var(--demo-border)] bg-white px-4 py-3 text-sm text-[var(--demo-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--demo-accent)]" />
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--demo-accent)]"
                    style={{ animationDelay: "120ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--demo-accent)]"
                    style={{ animationDelay: "240ms" }}
                  />
                  <span className="ml-1">AI is thinking…</span>
                </span>
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-[var(--demo-border)] bg-white p-3 sm:p-4">
          {error ? (
            <p className="mb-2 text-xs text-red-700">{error}</p>
          ) : null}

          <div className="mb-3 flex gap-2 overflow-x-auto overscroll-x-contain pb-1">
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                disabled={sending}
                onClick={() => void sendMessage(q)}
                className="demo-chip shrink-0 touch-manipulation rounded-full px-3 py-1.5 text-xs disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <label htmlFor="hospital-ai-input" className="sr-only">
              Message
            </label>
            <input
              id="hospital-ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about hospital demo data…"
              maxLength={1000}
              disabled={sending}
              className="demo-input min-h-12 flex-1 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn-primary touch-manipulation sm:!w-auto sm:px-6"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
