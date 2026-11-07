"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { CustomDemoConfig, CustomDemoStatus } from "@/lib/custom-demos/types";

export function AdminCustomDemos() {
  const [demos, setDemos] = useState<CustomDemoConfig[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/custom-demos?admin=1");
      const json = (await res.json()) as {
        ok?: boolean;
        demos?: CustomDemoConfig[];
        total?: number;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setError(json.error || "Failed to load AI demos.");
        return;
      }
      setDemos(json.demos || []);
      setTotal(json.total || 0);
    } catch {
      setError("Failed to load AI demos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: CustomDemoStatus) {
    setError("");
    setMessage("");
    const res = await fetch(`/api/custom-demos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      setError(json.error || "Update failed.");
      return;
    }
    setMessage(`Demo marked ${status}.`);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this AI-generated demo permanently?")) return;
    const res = await fetch(`/api/custom-demos/${id}`, { method: "DELETE" });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      setError(json.error || "Delete failed.");
      return;
    }
    setMessage("Demo deleted.");
    await load();
  }

  async function duplicate(demo: CustomDemoConfig) {
    setError("");
    setMessage("");
    const res = await fetch("/api/custom-demos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        niche: demo.niche,
        businessName: `${demo.businessName} (Copy)`,
        businessType: demo.businessType,
        description: demo.description,
        requirements: demo.requirements,
        extraInstructions: demo.extraInstructions,
        currency: demo.currency,
        country: demo.country,
        modules: demo.modules,
        unsupportedNotes: demo.unsupportedNotes,
        aiAssistantEnabled: demo.aiAssistantEnabled,
        publish: false,
      }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string; url?: string };
    if (!res.ok || !json.ok) {
      setError(json.error || "Duplicate failed.");
      return;
    }
    setMessage(`Duplicated as draft${json.url ? `: ${json.url}` : "."}`);
    await load();
  }

  return (
    <div className="gradient-border overflow-hidden rounded-2xl">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-text">
          AI Generated Client Demos
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Every customer-built business demo is saved here automatically. Total:{" "}
          <strong className="text-text">{total}</strong>
        </p>
      </div>

      {message ? <p className="px-5 pt-4 text-sm text-emerald-300">{message}</p> : null}
      {error ? (
        <p className="px-5 pt-4 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="p-5 text-sm text-text-muted">Loading demos…</p>
      ) : demos.length === 0 ? (
        <p className="p-5 text-sm text-text-muted">
          No AI-generated demos yet. Visitors create them at /create-your-demo/builder.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-text-dim">
              <tr>
                <th className="px-4 py-3 font-medium">Demo ID</th>
                <th className="px-4 py-3 font-medium">Business Name</th>
                <th className="px-4 py-3 font-medium">Business Type</th>
                <th className="px-4 py-3 font-medium">Creator</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Modules</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Public URL</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {demos.map((demo) => (
                <tr key={demo.id}>
                  <td className="px-4 py-3 font-mono text-xs text-text-dim">
                    {demo.id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3 text-text">{demo.businessName}</td>
                  <td className="px-4 py-3 text-text-muted">{demo.niche}</td>
                  <td className="px-4 py-3 text-text-dim">{demo.creatorLabel}</td>
                  <td className="px-4 py-3 text-text-dim">
                    {new Date(demo.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {demo.modules.length}
                    {demo.aiAssistantEnabled ? " + AI" : ""}
                  </td>
                  <td className="px-4 py-3 capitalize text-text-muted">{demo.status}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/demo/${demo.slug}`}
                      className="text-cyan-300 hover:underline"
                      target="_blank"
                    >
                      /demo/{demo.slug}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Link
                        href={`/demo/${demo.slug}`}
                        className="rounded-lg border border-border px-2 py-1 text-xs text-cyan-300"
                        target="_blank"
                      >
                        Open Live
                      </Link>
                      <button
                        type="button"
                        className="rounded-lg border border-border px-2 py-1 text-xs text-emerald-200"
                        onClick={() => void setStatus(demo.id, "published")}
                      >
                        Publish
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-border px-2 py-1 text-xs text-text-muted"
                        onClick={() => void setStatus(demo.id, "unpublished")}
                      >
                        Unpublish
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-border px-2 py-1 text-xs text-amber-200"
                        onClick={() => void setStatus(demo.id, "suspended")}
                      >
                        Suspend
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-border px-2 py-1 text-xs text-text-dim"
                        onClick={() => void setStatus(demo.id, "archived")}
                      >
                        Archive
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-border px-2 py-1 text-xs text-cyan-200"
                        onClick={() => void duplicate(demo)}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-red-400/30 px-2 py-1 text-xs text-red-200"
                        onClick={() => void remove(demo.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
