"use client";

import { useCallback, useEffect, useState } from "react";

type ProviderState = {
  status: "ok" | "error" | "missing";
  detail: string;
  models?: Record<string, string>;
  provider?: string;
  setup?: string[] | null;
};

type Payload = {
  ok?: boolean;
  error?: string;
  providers?: {
    openaiChat: ProviderState;
    openaiImage: ProviderState;
    video: ProviderState;
  };
  secrets?: {
    openaiApiKey: { configured: boolean; hint: string };
    videoGenerationApiKey: { configured: boolean; hint: string };
  };
  usage?: Record<string, number>;
  last?: Record<string, string | null>;
};

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "ok"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : status === "missing"
        ? "bg-amber-50 text-amber-900 border-amber-200"
        : "bg-red-50 text-red-800 border-red-200";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${cls}`}>
      {status}
    </span>
  );
}

export function AdminAiProviders() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ai-providers", { cache: "no-store" });
      const json = (await res.json()) as Payload;
      if (!res.ok || !json.ok) {
        setError(json.error || "Could not load provider status.");
        return;
      }
      setData(json);
    } catch {
      setError("Could not load provider status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return <p className="text-sm text-text-muted">Checking AI providers…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="gradient-border rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-text">AI Provider Status</h2>
            <p className="mt-1 text-sm text-text-muted">
              Connection checks for OpenAI chat/image and the Luma video provider. Secret keys are
              never shown in full.
            </p>
          </div>
          <button type="button" className="btn-secondary !w-auto" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {data?.providers ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {(
            [
              ["OpenAI Chat", data.providers.openaiChat],
              ["OpenAI Image Generation", data.providers.openaiImage],
              ["Video Provider", data.providers.video],
            ] as const
          ).map(([title, p]) => (
            <div key={title} className="gradient-border rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-sm font-semibold text-text">{title}</p>
                <StatusPill status={p.status} />
              </div>
              <p className="mt-2 text-sm text-text-muted">{p.detail}</p>
              {p.provider ? (
                <p className="mt-1 text-xs text-text-dim">Provider: {p.provider}</p>
              ) : null}
              {p.models ? (
                <ul className="mt-2 space-y-1 text-xs text-text-dim">
                  {Object.entries(p.models).map(([k, v]) => (
                    <li key={k}>
                      {k}: <span className="font-mono text-text-muted">{v}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {p.setup?.length ? (
                <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-amber-100">
                  {p.setup.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {data?.secrets ? (
        <div className="gradient-border rounded-2xl p-4 text-sm text-text-muted">
          <p className="font-semibold text-text">Configured secrets (masked)</p>
          <p className="mt-2">
            OPENAI_API_KEY: {data.secrets.openaiApiKey.hint}
          </p>
          <p>
            VIDEO_GENERATION_API_KEY: {data.secrets.videoGenerationApiKey.hint}
          </p>
        </div>
      ) : null}

      {data?.usage ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Chat requests", data.usage.chatRequests],
            ["Image generations", data.usage.imageGenerations],
            ["Video generations", data.usage.videoGenerations],
            ["Failed requests", data.usage.failedRequests],
            ["Est. API cost", `$${data.usage.estimatedApiCostUsd}`],
            ["Est. video spend", `$${data.usage.estimatedVideoSpendUsd}`],
            ["Avg first token ms", data.usage.avgFirstTokenMs],
            ["Avg completed ms", data.usage.avgCompletedResponseMs],
          ].map(([label, value]) => (
            <div key={String(label)} className="gradient-border rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wide text-text-dim">{label}</p>
              <p className="mt-2 font-display text-xl font-bold text-text">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {data?.last ? (
        <div className="gradient-border rounded-2xl p-4 text-sm text-text-muted">
          <p className="font-semibold text-text">Recent activity</p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>Last successful: {data.last.successfulAt || "—"}</li>
            <li>Last failed: {data.last.failedAt || "—"}</li>
            <li>Last image: {data.last.imageAt || "—"}</li>
            <li>Last video: {data.last.videoAt || "—"}</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
