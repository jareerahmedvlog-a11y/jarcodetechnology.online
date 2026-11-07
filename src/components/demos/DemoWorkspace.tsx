"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { demoProducts, isInvoiceCollection } from "@/config/demos";
import { DemoWarning } from "@/components/demos/DemoWarning";
import { HospitalAIAssistant } from "@/components/demos/HospitalAIAssistant";
import { emptyDemoDatabase } from "@/lib/demos/empty";
import type { DemoDatabase, DemoProduct, DemoRecord } from "@/lib/demos/types";
import { cn } from "@/lib/utils";

type Props = {
  product: DemoProduct;
  initialData?: DemoDatabase;
  /** public = shared demo; tenant = private client ERP */
  mode?: "public" | "tenant";
  clientName?: string;
};

export function DemoWorkspace({
  product,
  initialData,
  mode = "public",
  clientName,
}: Props) {
  const isTenant = mode === "tenant";
  const config = demoProducts[product];
  const bootData = initialData ?? emptyDemoDatabase(product);
  const [active, setActive] = useState("dashboard");
  const [data, setData] = useState<DemoDatabase>(bootData);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<DemoRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const dataRef = useRef<DemoDatabase>(bootData);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const collection = useMemo(
    () => config.collections.find((item) => item.id === active) || null,
    [active, config.collections],
  );

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    const quiet = opts?.quiet !== false;
    if (!quiet) setRefreshing(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(isTenant ? "/api/erp/data" : `/api/demos/${product}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const json = (await res.json()) as {
        ok?: boolean;
        data?: DemoDatabase;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data) {
        if (!quiet) {
          setError(
            json.error ||
              (isTenant
                ? "Could not sync your ERP data."
                : "Could not sync shared demo data."),
          );
        }
        return;
      }
      // Avoid re-render storms that steal mobile taps
      const next = JSON.stringify(json.data);
      const prev = JSON.stringify(dataRef.current);
      if (next !== prev) {
        setData(json.data);
        dataRef.current = json.data;
      }
      setError("");
    } catch {
      if (!quiet) {
        setError("Could not sync right now. You can still browse modules.");
      }
    } finally {
      window.clearTimeout(timeout);
      if (!quiet) setRefreshing(false);
    }
  }, [product, isTenant]);

  useEffect(() => {
    setActive("dashboard");
    const next = initialData ?? emptyDemoDatabase(product);
    setData(next);
    dataRef.current = next;
    setError("");

    const bootSync = window.setTimeout(() => {
      void load({ quiet: true });
    }, isTenant ? 200 : 2500);

    const poll = () => {
      if (document.visibilityState === "visible") void load({ quiet: true });
    };
    const timer = window.setInterval(poll, isTenant ? 30000 : 60000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      window.clearTimeout(bootSync);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [product, load, isTenant]);

  useEffect(() => {
    if (!collection) {
      setForm({});
      setEditing(null);
      return;
    }
    const blank: Record<string, string> = {};
    for (const field of collection.fields) blank[field.key] = "";
    setForm(blank);
    setEditing(null);
  }, [collection]);

  const stats = useMemo(() => {
    if (!data) return [];
    return config.collections.map((item) => ({
      id: item.id,
      label: item.label,
      count: data[item.id]?.length || 0,
    }));
  }, [config.collections, data]);

  function startEdit(record: DemoRecord) {
    if (!collection) return;
    const next: Record<string, string> = {};
    for (const field of collection.fields) {
      next[field.key] = String(record[field.key] || "");
    }
    setForm(next);
    setEditing(record);
    setMessage("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!collection) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const url = isTenant
        ? editing
          ? `/api/erp/${collection.id}/${editing.id}`
          : `/api/erp/${collection.id}`
        : editing
          ? `/api/demos/${product}/${collection.id}/${editing.id}`
          : `/api/demos/${product}/${collection.id}`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error || "Could not save record.");
        return;
      }
      setMessage(
        editing
          ? isTenant
            ? "Record updated in your ERP."
            : "Record updated in shared demo."
          : isTenant
            ? "Record added to your ERP."
            : "Record added to shared demo.",
      );
      setEditing(null);
      const blank: Record<string, string> = {};
      for (const field of collection.fields) blank[field.key] = "";
      setForm(blank);
      await load({ quiet: true });
    } catch {
      setError("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!collection) return;
    if (
      !confirm(
        isTenant
          ? "Delete this record from your ERP?"
          : "Delete this demo record for all visitors?",
      )
    ) {
      return;
    }
    setError("");
    try {
      const res = await fetch(
        isTenant
          ? `/api/erp/${collection.id}/${id}`
          : `/api/demos/${product}/${collection.id}/${id}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error || "Could not delete record.");
        return;
      }
      setMessage(
        isTenant
          ? "Record deleted from your ERP."
          : "Record deleted from shared demo.",
      );
      await load({ quiet: true });
    } catch {
      setError("Delete failed. Please try again.");
    }
  }

  const selectNav = useCallback((id: string) => {
    setActive(id);
  }, []);

  const moduleOptions = [
    { id: "dashboard", label: "Dashboard" },
    ...(product === "hospital"
      ? [{ id: "ai-assistant", label: "AI Assistant" }]
      : []),
    ...config.collections.map((item) => ({ id: item.id, label: item.label })),
  ];

  const navItems = (
    <>
      {moduleOptions.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => selectNav(item.id)}
          className={cn(
            "demo-nav-item mb-1 flex w-full items-center gap-2 touch-manipulation rounded-xl px-3 py-3.5 text-left text-sm font-medium",
            active === item.id && "demo-nav-item-active",
          )}
        >
          {item.id === "ai-assistant" ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[var(--demo-accent)]" fill="none" aria-hidden>
              <path d="M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          ) : null}
          {item.label}
        </button>
      ))}
    </>
  );

  const activeLabel =
    active === "dashboard"
      ? "Dashboard"
      : active === "ai-assistant"
        ? "AI Assistant"
        : collection?.label || config.shortTitle;

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-4 lg:mb-6">
        {isTenant ? (
          <p className="text-sm font-medium text-[var(--demo-accent)]">
            Private Client ERP
            {clientName ? ` · ${clientName}` : ""}
          </p>
        ) : (
          <Link href="/create-your-demo" className="demo-link text-sm font-medium">
            ← Back to Create Your Demo
          </Link>
        )}
        <h1 className="mt-2 font-display text-xl font-bold text-[var(--demo-heading)] sm:text-2xl lg:text-3xl">
          {config.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--demo-text)] lg:mt-2 lg:text-base">
          <span className="lg:hidden">Module: {activeLabel}</span>
          <span className="hidden lg:inline">
            {isTenant
              ? "Your private ERP workspace. Data is isolated from other clients and from the public demo."
              : "Shared public demo workspace. Entries are stored in the server database and visible to all visitors."}
          </span>
        </p>
      </div>

      {!isTenant ? (
        <div className="mb-5 lg:mb-6">
          <DemoWarning />
        </div>
      ) : null}

      {/* Mobile modules — always visible chips, no hamburger */}
      <div className="sticky top-[var(--header-h)] z-40 -mx-4 mb-5 border-b border-[var(--demo-border)] bg-[var(--demo-surface)] px-4 py-3 lg:hidden">
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-[var(--demo-muted)] uppercase">
          Modules
        </p>
        <nav
          className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain pb-1"
          aria-label="Demo modules"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {moduleOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectNav(item.id)}
              className={cn(
                "demo-chip inline-flex shrink-0 touch-manipulation items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap",
                active === item.id && "demo-chip-active",
              )}
            >
              {item.id === "ai-assistant" ? (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[var(--demo-accent)]" fill="none" aria-hidden>
                  <path d="M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              ) : null}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <aside className="demo-sidebar sticky top-[calc(var(--header-h)+1rem)] hidden h-fit max-h-[calc(100vh-var(--header-h)-2rem)] overflow-y-auto p-3 lg:block">
          <nav aria-label="Demo modules desktop">{navItems}</nav>
        </aside>

        <section className="min-w-0 space-y-5 overflow-x-hidden">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{error}</p>
              <button
                type="button"
                className="btn-secondary mt-3 !w-auto touch-manipulation"
                onClick={() => void load({ quiet: false })}
              >
                Retry sync
              </button>
            </div>
          ) : null}
          {message ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </p>
          ) : null}
          {refreshing ? (
            <p className="text-xs text-[var(--demo-muted)]">Syncing shared demo…</p>
          ) : null}

          {active === "dashboard" ? (
            <div className="space-y-5">
              <div className="demo-card p-5">
                <h2 className="font-display text-xl font-semibold text-[var(--demo-heading)]">
                  {config.shortTitle} Dashboard
                </h2>
                <p className="mt-2 text-sm text-[var(--demo-text)]">
                  Live counts from the shared cloud demo database. Refresh happens
                  automatically every few seconds.
                </p>
              </div>
              {product === "hospital" ? (
                <button
                  type="button"
                  onClick={() => setActive("ai-assistant")}
                  className="demo-card flex w-full items-center gap-3 p-4 text-left transition-transform hover:-translate-y-0.5"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--demo-border)] bg-[var(--demo-accent-soft)] text-[var(--demo-accent)]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                      <path d="M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                      <path d="M5 14.5l.8 2.2L8 17.5l-2.2.8L5 20.5l-.8-2.2L2 17.5l2.2-.8L5 14.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>
                    <span className="block font-display text-base font-semibold text-[var(--demo-heading)]">
                      AI Assistant
                    </span>
                    <span className="mt-0.5 block text-sm text-[var(--demo-text)]">
                      Ask natural-language questions about hospital demo data
                    </span>
                  </span>
                </button>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {stats.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActive(item.id)}
                    className="demo-card p-4 text-left transition-transform hover:-translate-y-0.5"
                  >
                    <p className="text-xs tracking-wide text-[var(--demo-muted)] uppercase">
                      {item.label}
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold text-[var(--demo-heading)]">
                      {item.count}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : active === "ai-assistant" && product === "hospital" ? (
            <HospitalAIAssistant mode={isTenant ? "tenant" : "public"} />
          ) : collection ? (
            <div className="space-y-5">
              <div className="demo-card p-5">
                <h2 className="font-display text-xl font-semibold text-[var(--demo-heading)]">
                  {collection.label}
                </h2>
                <p className="mt-1 text-sm text-[var(--demo-text)]">{collection.description}</p>
              </div>

              <form onSubmit={onSubmit} className="demo-card p-5">
                <h3 className="font-display text-lg font-semibold text-[var(--demo-heading)]">
                  {editing ? "Edit Demo Record" : "Add Demo Record"}
                </h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {collection.fields.map((field) => (
                    <div
                      key={field.key}
                      className={field.type === "textarea" ? "sm:col-span-2" : ""}
                    >
                      <label className="text-sm text-[var(--demo-text)]" htmlFor={field.key}>
                        {field.label}
                        {field.required ? " *" : ""}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea
                          id={field.key}
                          required={field.required}
                          rows={3}
                          value={form[field.key] || ""}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          className="demo-input mt-1"
                        />
                      ) : field.type === "select" ? (
                        <select
                          id={field.key}
                          required={field.required}
                          value={form[field.key] || ""}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          className="demo-input mt-1"
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          {(field.options || []).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={field.key}
                          type={field.type || "text"}
                          required={field.required}
                          placeholder={field.placeholder}
                          value={form[field.key] || ""}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          className="demo-input mt-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="submit"
                    className="btn-primary sm:!w-auto"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : editing ? "Update Record" : "Add Record"}
                  </button>
                  {editing ? (
                    <button
                      type="button"
                      className="btn-secondary sm:!w-auto"
                      onClick={() => {
                        setEditing(null);
                        const blank: Record<string, string> = {};
                        for (const field of collection.fields) blank[field.key] = "";
                        setForm(blank);
                      }}
                    >
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="demo-card overflow-hidden">
                <div className="demo-table-head px-5 py-3">
                  <h3 className="font-display font-semibold text-[var(--demo-heading)]">
                    Shared Records ({data?.[collection.id]?.length || 0})
                  </h3>
                </div>
                {!data?.[collection.id]?.length ? (
                  <p className="p-5 text-sm text-[var(--demo-text)]">
                    No records yet. Add the first demo entry.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--demo-border)]">
                    {data[collection.id].map((row) => (
                      <li key={row.id} className="bg-[var(--demo-surface)] p-5 hover:bg-[var(--demo-surface-2)]">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-1">
                            {collection.fields.map((field) => (
                              <p
                                key={field.key}
                                className={cn(
                                  "text-sm text-[var(--demo-text)]",
                                  field.key === "extraNote" &&
                                    row.extraNote &&
                                    "rounded-lg border border-[var(--demo-border)] bg-[var(--demo-accent-soft)] px-2 py-1.5",
                                )}
                              >
                                <span className="text-[var(--demo-muted)]">{field.label}: </span>
                                <span className="whitespace-pre-wrap text-[var(--demo-heading)]">
                                  {row[field.key] || "—"}
                                </span>
                              </p>
                            ))}
                            <p className="text-xs text-[var(--demo-muted)]">
                              Updated {new Date(row.updatedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                            {isInvoiceCollection(collection.id) ? (
                              <button
                                type="button"
                                className="min-h-11 flex-1 rounded-xl border border-[var(--demo-border)] bg-white px-3 py-2 text-sm text-[var(--demo-heading)] hover:bg-[var(--demo-surface-2)] sm:flex-none"
                                onClick={() => {
                                  const lines = collection.fields
                                    .map(
                                      (field) =>
                                        `${field.label}: ${row[field.key] || "—"}`,
                                    )
                                    .join("\n");
                                  const html = `<!doctype html><html><head><title>Invoice</title>
                                    <style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}
                                    h1{font-size:20px;margin:0 0 8px}pre{white-space:pre-wrap;line-height:1.5}
                                    .note{margin-top:16px;padding:12px;border:1px solid #ddd;border-radius:8px;background:#f8fafc}</style>
                                    </head><body>
                                    <h1>${collection.label}</h1>
                                    <p>${isTenant ? "Private Client ERP Invoice" : "Demo Invoice"}</p>
                                    <pre>${lines.replace(/</g, "&lt;")}</pre>
                                    ${
                                      row.extraNote
                                        ? `<div class="note"><strong>Extra Note</strong><br/>${String(row.extraNote).replace(/</g, "&lt;")}</div>`
                                        : ""
                                    }
                                    <script>window.onload=()=>window.print()</script>
                                    </body></html>`;
                                  const w = window.open("", "_blank");
                                  if (w) {
                                    w.document.write(html);
                                    w.document.close();
                                  }
                                }}
                              >
                                Print / Download
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="min-h-11 flex-1 rounded-xl border border-[var(--demo-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--demo-accent)] hover:bg-[var(--demo-accent-soft)] sm:flex-none"
                              onClick={() => startEdit(row)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="min-h-11 flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 sm:flex-none"
                              onClick={() => void onDelete(row.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
