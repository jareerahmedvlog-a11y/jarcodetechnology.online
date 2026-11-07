"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Summary = {
  month: string;
  totalChatRequests: number;
  totalVoiceSessions: number;
  voiceSessionDurationMinutes: number;
  totalImageGenerations?: number;
  totalFileAnalysis?: number;
  totalWebSearches?: number;
  totalVideoGenerations?: number;
  videoSuccessful?: number;
  videoFailed?: number;
  videoDurationSeconds?: number;
  videoProvider?: string;
  estimatedVideoSpendUsd?: number;
  inputTokens: number;
  outputTokens: number;
  failedRequests?: number;
  avgFirstTokenMs?: number;
  avgCompletedResponseMs?: number;
  estimatedApiCostUsd: number;
  monthlyBudgetUsd: number;
  budgetUsedPercent: number;
  alerts: string[];
  usageByCustomer: Record<string, Record<string, number>>;
  usageByModel: Record<string, { count: number; estimatedUsd: number }>;
  limits: {
    chatDaily: number;
    voiceDaily: number;
    imageDaily?: number;
    fileDaily?: number;
    searchDaily?: number;
    videoDaily?: number;
    videoMonthly?: number;
    videoPerUserDaily?: number;
    dayChatUsed: number;
    dayVoiceUsed: number;
    dayImageUsed?: number;
    dayFileUsed?: number;
    daySearchUsed?: number;
    dayVideoUsed?: number;
  };
  recentEvents: Array<{
    id: string;
    at: string;
    kind: string;
    subject: string;
    model: string;
    estimatedUsd: number;
  }>;
};

export function AdminAiUsage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("25");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/ai/usage", { cache: "no-store" });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        summary?: Summary;
      };
      if (!res.ok || !json.ok || !json.summary) {
        setError(json.error || "Could not load AI usage.");
        return;
      }
      setSummary(json.summary);
      setBudget(String(json.summary.monthlyBudgetUsd));
    } catch {
      setError("Could not load AI usage.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSaveBudget(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/ai/usage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudgetUsd: Number(budget) }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        summary?: Summary;
      };
      if (!res.ok || !json.ok || !json.summary) {
        setError(json.error || "Could not update budget.");
        return;
      }
      setSummary(json.summary);
      setMessage("Monthly AI budget updated. Usage is never unlimited.");
    } catch {
      setError("Could not update budget.");
    } finally {
      setSaving(false);
    }
  }

  if (!summary && !error) {
    return <p className="text-sm text-text-muted">Loading AI usage…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="gradient-border rounded-2xl p-5">
        <h2 className="font-display text-xl font-semibold text-text">AI Usage Dashboard</h2>
        <p className="mt-1 text-sm text-text-muted">
          Estimated OpenAI + Luma video spend for month {summary?.month}. Limits and budgets
          protect against unexpected cost — AI is not unlimited.
        </p>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="font-display text-sm font-semibold text-text">AI Video Usage</h3>
          <p className="mt-1 text-xs text-text-muted">
            Provider: {summary?.videoProvider || "luma"} · Generated{" "}
            {summary?.totalVideoGenerations || 0} · Success {summary?.videoSuccessful || 0} ·
            Failed {summary?.videoFailed || 0} · Duration {summary?.videoDurationSeconds || 0}s
            · Est. ${summary?.estimatedVideoSpendUsd || 0}
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      {summary ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Chat Requests", summary.totalChatRequests],
              ["Avg First Token (ms)", summary.avgFirstTokenMs || 0],
              ["Avg Completed (ms)", summary.avgCompletedResponseMs || 0],
              ["Failed Requests", summary.failedRequests || 0],
              ["Voice Sessions", summary.totalVoiceSessions],
              ["Voice Minutes", summary.voiceSessionDurationMinutes],
              ["Image Generations", summary.totalImageGenerations || 0],
              ["File Analysis", summary.totalFileAnalysis || 0],
              ["Web Searches", summary.totalWebSearches || 0],
              ["Videos Generated", summary.totalVideoGenerations || 0],
              ["Videos OK / Failed", `${summary.videoSuccessful || 0} / ${summary.videoFailed || 0}`],
              ["Video Seconds", summary.videoDurationSeconds || 0],
              ["Video Provider", summary.videoProvider || "luma"],
              ["Est. Video Spend", `$${summary.estimatedVideoSpendUsd || 0}`],
              ["Input Tokens", summary.inputTokens],
              ["Output Tokens", summary.outputTokens],
              ["Est. API Cost", `$${summary.estimatedApiCostUsd}`],
              ["Monthly Budget", `$${summary.monthlyBudgetUsd}`],
              ["Budget Used", `${summary.budgetUsedPercent}%`],
              [
                "Today Chat",
                `${summary.limits.dayChatUsed}/${summary.limits.chatDaily}`,
              ],
              [
                "Today Voice",
                `${summary.limits.dayVoiceUsed}/${summary.limits.voiceDaily}`,
              ],
              [
                "Today Images",
                `${summary.limits.dayImageUsed || 0}/${summary.limits.imageDaily || 0}`,
              ],
              [
                "Today Videos",
                `${summary.limits.dayVideoUsed || 0}/${summary.limits.videoDaily || 0}`,
              ],
              [
                "Video Monthly Cap",
                String(summary.limits.videoMonthly || 0),
              ],
              [
                "Video Per-User/Day",
                String(summary.limits.videoPerUserDaily || 0),
              ],
            ].map(([label, value]) => (
              <div key={String(label)} className="gradient-border rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-text-dim">{label}</p>
                <p className="mt-2 font-display text-2xl font-bold text-text">{value}</p>
              </div>
            ))}
          </div>

          {summary.alerts.length ? (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {summary.alerts.join(" · ")}
            </div>
          ) : null}

          <form onSubmit={onSaveBudget} className="gradient-border flex flex-wrap items-end gap-3 rounded-2xl p-5">
            <div>
              <label className="text-sm text-text-muted" htmlFor="ai-budget">
                Monthly budget (USD)
              </label>
              <input
                id="ai-budget"
                type="number"
                min={1}
                max={10000}
                step={1}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="mt-1 min-h-11 rounded-xl border border-border bg-[#0a0a12] px-3 text-sm text-text"
              />
            </div>
            <button type="submit" className="btn-primary !w-auto" disabled={saving}>
              {saving ? "Saving…" : "Update Budget"}
            </button>
            <button type="button" className="btn-secondary !w-auto" onClick={() => void load()}>
              Refresh
            </button>
          </form>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="gradient-border rounded-2xl p-5">
              <h3 className="font-display font-semibold text-text">Usage by customer</h3>
              <ul className="mt-3 space-y-2 text-sm text-text-muted">
                {Object.entries(summary.usageByCustomer).map(([k, v]) => (
                  <li key={k}>
                    {k}: chat {v.chat || 0}, voice {v.voice || 0}, images{" "}
                    {v.image || 0}, videos {v.video || 0}, ${v.estimatedUsd || 0}
                  </li>
                ))}
                {!Object.keys(summary.usageByCustomer).length ? <li>No usage yet.</li> : null}
              </ul>
            </div>
            <div className="gradient-border rounded-2xl p-5">
              <h3 className="font-display font-semibold text-text">Usage by model</h3>
              <ul className="mt-3 space-y-2 text-sm text-text-muted">
                {Object.entries(summary.usageByModel).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v.count} calls · ${v.estimatedUsd}
                  </li>
                ))}
                {!Object.keys(summary.usageByModel).length ? <li>No usage yet.</li> : null}
              </ul>
            </div>
          </div>

          <div className="gradient-border rounded-2xl p-5">
            <h3 className="font-display font-semibold text-text">Recent events</h3>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs text-text-muted">
              {summary.recentEvents.map((e) => (
                <li key={e.id}>
                  {e.at} · {e.kind} · {e.subject} · {e.model} · ${e.estimatedUsd}
                </li>
              ))}
              {!summary.recentEvents.length ? <li>No events yet.</li> : null}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
