"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { CustomDemoStatus } from "@/lib/custom-demos/types";

type DemoRow = {
  id: string;
  slug: string;
  businessName: string;
  niche: string;
  status: CustomDemoStatus;
  createdAt: string;
  moduleCount?: number;
};

export function PublicMadeDemos() {
  const [demos, setDemos] = useState<DemoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [managing, setManaging] = useState(false);
  const [email, setEmail] = useState("jareer@admin.com");
  const [password, setPassword] = useState("");
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/custom-demos?gallery=1", { cache: "no-store" });
      const json = (await res.json()) as {
        ok?: boolean;
        demos?: DemoRow[];
        managing?: boolean;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setError(json.error || "Could not load public demos.");
        return;
      }
      setDemos(json.demos || []);
      setManaging(Boolean(json.managing));
    } catch {
      setError("Could not load public demos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error || "Unlock failed.");
        return;
      }
      setPassword("");
      setUnlockOpen(false);
      setManaging(true);
      setMessage("Manage mode unlocked.");
      await load();
    } catch {
      setError("Unlock failed.");
    } finally {
      setBusy(false);
    }
  }

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
      setError(json.error || "Update failed. Unlock manage mode first.");
      return;
    }
    setMessage(`Demo marked ${status}.`);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this public demo permanently?")) return;
    setError("");
    setMessage("");
    const res = await fetch(`/api/custom-demos/${id}`, { method: "DELETE" });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      setError(json.error || "Delete failed. Unlock manage mode first.");
      return;
    }
    setMessage("Demo deleted.");
    await load();
  }

  return (
    <section className="mt-14" aria-labelledby="people-made-demos">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#00A8CC] uppercase">
            Community
          </p>
          <h2
            id="people-made-demos"
            className="mt-2 font-display text-2xl font-bold text-[#101828] sm:text-3xl"
          >
            People made these demos
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#475467] sm:text-base">
            Public demos created on this site. Open any demo anytime — no need to create again.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary !min-h-10 text-sm" onClick={() => void load()}>
            Refresh
          </button>
          {managing ? (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              Manage unlocked
            </span>
          ) : (
            <button
              type="button"
              className="btn-primary !min-h-10 text-sm"
              onClick={() => setUnlockOpen((v) => !v)}
            >
              Unlock delete / edit
            </button>
          )}
        </div>
      </div>

      {unlockOpen && !managing ? (
        <form
          onSubmit={unlock}
          className="premium-card mt-5 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div>
            <label className="text-xs font-semibold text-[#667085]" htmlFor="manage-email">
              Admin email
            </label>
            <input
              id="manage-email"
              className="input-field mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#667085]" htmlFor="manage-pass">
              Admin password
            </label>
            <input
              id="manage-pass"
              type="password"
              className="input-field mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn-primary !min-h-11" disabled={busy}>
            {busy ? "Unlocking…" : "Unlock"}
          </button>
        </form>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-[#667085]">Loading demos…</p>
        ) : demos.length === 0 ? (
          <div className="premium-card p-6 text-sm text-[#475467]">
            No public demos yet. Create one from{" "}
            <Link href="/create-your-demo/builder" className="font-semibold text-[#00A8CC]">
              Create My Business Demo
            </Link>
            .
          </div>
        ) : (
          demos.map((demo) => (
            <article
              key={demo.id}
              className="premium-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-[#101828]">
                  {demo.businessName}
                </p>
                <p className="mt-1 text-sm text-[#667085]">
                  {demo.niche} · /demo/{demo.slug} · {demo.status}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/demo/${demo.slug}`} className="btn-primary !min-h-10 text-sm">
                  Open
                </Link>
                {managing ? (
                  <>
                    {demo.status !== "published" ? (
                      <button
                        type="button"
                        className="btn-secondary !min-h-10 text-sm"
                        onClick={() => void setStatus(demo.id, "published")}
                      >
                        Make public
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-secondary !min-h-10 text-sm"
                        onClick={() => void setStatus(demo.id, "unpublished")}
                      >
                        Unpublish
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-secondary !min-h-10 text-sm text-red-600"
                      onClick={() => void remove(demo.id)}
                    >
                      Delete
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
