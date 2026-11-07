"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { DemoWarning } from "@/components/demos/DemoWarning";
import type {
  CustomDemoConfig,
  CustomDemoData,
  CustomDemoRecord,
  CustomFieldDef,
} from "@/lib/custom-demos/types";
import { cn } from "@/lib/utils";

type Props = {
  initialConfig: CustomDemoConfig;
  initialData: CustomDemoData;
};

function emptyForm(fields: CustomFieldDef[]) {
  const o: Record<string, string> = {};
  for (const f of fields) o[f.key] = "";
  return o;
}

export function CustomDemoWorkspace({ initialConfig, initialData }: Props) {
  const [config] = useState(initialConfig);
  const [data, setData] = useState(initialData);
  const [active, setActive] = useState<"dashboard" | "ai" | string>("dashboard");
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const modules = config.modules;
  const activeModule = modules.find((m) => m.id === active);

  const stats = useMemo(() => {
    return modules.map((m) => ({
      id: m.id,
      label: m.label,
      count: (data[m.id] || []).length,
    }));
  }, [modules, data]);

  function openModule(id: string) {
    setActive(id);
    setError("");
    setMessage("");
    setEditingId("");
    const mod = modules.find((m) => m.id === id);
    setForm(mod ? emptyForm(mod.fields) : {});
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activeModule) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(
        `/api/custom-demos/${config.id}/${activeModule.id}`,
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, recordId: editingId || undefined }),
        },
      );
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        record?: CustomDemoRecord;
      };
      if (!res.ok || !json.ok || !json.record) {
        setError(json.error || "Could not save record.");
        return;
      }
      setData((prev) => {
        const rows = [...(prev[activeModule.id] || [])];
        if (editingId) {
          const idx = rows.findIndex((r) => r.id === editingId);
          if (idx >= 0) rows[idx] = json.record!;
        } else {
          rows.unshift(json.record!);
        }
        return { ...prev, [activeModule.id]: rows };
      });
      setForm(emptyForm(activeModule.fields));
      setEditingId("");
      setMessage(editingId ? "Record updated." : "Record added.");
    } catch {
      setError("Connection issue while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(recordId: string) {
    if (!activeModule || !confirm("Delete this demo record?")) return;
    const res = await fetch(
      `/api/custom-demos/${config.id}/${activeModule.id}?recordId=${encodeURIComponent(recordId)}`,
      { method: "DELETE" },
    );
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      setError(json.error || "Delete failed.");
      return;
    }
    setData((prev) => ({
      ...prev,
      [activeModule.id]: (prev[activeModule.id] || []).filter((r) => r.id !== recordId),
    }));
  }

  async function askAi(e: FormEvent) {
    e.preventDefault();
    if (!aiInput.trim() || !config.aiAssistantEnabled) return;
    setAiBusy(true);
    setAiReply("");
    try {
      const moduleSummary = modules.map((m) => m.label).join(", ");
      const res = await fetch("/api/ai/workspace/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `You are assisting inside a fictional public ERP demo for "${config.businessName}" (${config.niche}). Available modules: ${moduleSummary}. Dashboard is always first. Answer about this demo only. Use fictional context.\n\nUser: ${aiInput}`,
          mode: "general",
          stream: false,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; reply?: string; error?: string };
      setAiReply(json.reply || json.error || "No reply.");
    } catch {
      setAiReply("Could not reach JARCODE AI.");
    } finally {
      setAiBusy(false);
    }
  }

  const navItems: Array<{ id: string; label: string }> = [
    { id: "dashboard", label: "Dashboard" },
    ...modules.map((m) => ({ id: m.id, label: m.label })),
    ...(config.aiAssistantEnabled ? [{ id: "ai", label: "AI Assistant" }] : []),
  ];

  return (
    <div className="section-soft min-h-[70vh] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#00A8CC] uppercase">
              AI Business Demo
            </p>
            <h1 className="font-display text-2xl font-bold text-[#101828]">
              {config.businessName}
            </h1>
            <p className="text-sm text-[#475467]">
              {config.niche} · {config.country} · {config.currency}
            </p>
          </div>
          <Link href="/create-your-demo" className="btn-secondary !min-h-10 text-sm">
            ← All Demos
          </Link>
        </div>

        <DemoWarning />
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This is a shared demonstration environment. Information entered here may be visible to
          other visitors. Use fictional data only. Separate from production client ERPs.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[15rem_1fr]">
          <aside className="premium-card h-fit p-3">
            <nav className="space-y-1" aria-label="Demo modules">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    item.id === "dashboard" || item.id === "ai"
                      ? setActive(item.id)
                      : openModule(item.id)
                  }
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold",
                    active === item.id
                      ? "bg-[#101828] text-white"
                      : "text-[#475467] hover:bg-[#F4F6FA]",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <section className="premium-card min-w-0 p-4 sm:p-6">
            {error ? (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {message}
              </p>
            ) : null}

            {active === "dashboard" ? (
              <div>
                <h2 className="font-display text-xl font-bold text-[#101828]">Dashboard</h2>
                <p className="mt-1 text-sm text-[#475467]">
                  Fictional sample metrics for this generated demo.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {stats.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => openModule(s.id)}
                      className="rounded-xl border border-[#101828]/10 bg-[#F4F6FA] p-4 text-left hover:border-[#00C2E8]/40"
                    >
                      <p className="text-xs font-semibold text-[#667085] uppercase">{s.label}</p>
                      <p className="mt-2 font-display text-2xl font-bold text-[#101828]">
                        {s.count}
                      </p>
                      <p className="mt-1 text-xs text-[#667085]">Sample records</p>
                    </button>
                  ))}
                </div>
                {config.unsupportedNotes.length ? (
                  <div className="mt-6 rounded-xl border border-[#101828]/10 p-4">
                    <p className="text-sm font-semibold text-[#101828]">
                      Needs custom development
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#475467]">
                      {config.unsupportedNotes.map((n) => (
                        <li key={n}>{n}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {active === "ai" && config.aiAssistantEnabled ? (
              <div>
                <h2 className="font-display text-xl font-bold text-[#101828]">AI Assistant</h2>
                <p className="mt-1 text-sm text-[#475467]">
                  Uses JARCODE AI to answer questions about this demo&apos;s modules and sample data.
                </p>
                <form onSubmit={askAi} className="mt-4 space-y-3">
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    rows={3}
                    className="input-field"
                    placeholder="Ask about this demo…"
                  />
                  <button type="submit" className="btn-primary" disabled={aiBusy}>
                    {aiBusy ? "Thinking…" : "Ask AI"}
                  </button>
                </form>
                {aiReply ? (
                  <div className="mt-4 whitespace-pre-wrap rounded-xl bg-[#F4F6FA] p-4 text-sm text-[#344054]">
                    {aiReply}
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeModule ? (
              <div>
                <h2 className="font-display text-xl font-bold text-[#101828]">
                  {activeModule.label}
                </h2>
                <p className="mt-1 text-sm text-[#475467]">{activeModule.description}</p>

                <form onSubmit={onSubmit} className="mt-5 grid gap-3 sm:grid-cols-2">
                  {activeModule.fields.map((field) => (
                    <label
                      key={field.key}
                      className={cn(
                        "block text-sm text-[#475467]",
                        field.type === "textarea" ? "sm:col-span-2" : "",
                      )}
                    >
                      {field.label}
                      {field.required ? " *" : ""}
                      {field.type === "textarea" ? (
                        <textarea
                          className="input-field mt-1"
                          rows={3}
                          required={field.required}
                          value={form[field.key] || ""}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, [field.key]: e.target.value }))
                          }
                        />
                      ) : field.type === "select" ? (
                        <select
                          className="input-field mt-1"
                          required={field.required}
                          value={form[field.key] || ""}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, [field.key]: e.target.value }))
                          }
                        >
                          <option value="">Select…</option>
                          {(field.options || []).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="input-field mt-1"
                          type={field.type === "number" ? "number" : field.type || "text"}
                          required={field.required}
                          value={form[field.key] || ""}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, [field.key]: e.target.value }))
                          }
                        />
                      )}
                    </label>
                  ))}
                  <div className="sm:col-span-2 flex flex-wrap gap-2">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? "Saving…" : editingId ? "Update Record" : "Add Record"}
                    </button>
                    {editingId ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setEditingId("");
                          setForm(emptyForm(activeModule.fields));
                        }}
                      >
                        Cancel Edit
                      </button>
                    ) : null}
                  </div>
                </form>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#101828]/10 text-[#667085]">
                        {activeModule.fields.slice(0, 4).map((f) => (
                          <th key={f.key} className="px-2 py-2 font-semibold">
                            {f.label}
                          </th>
                        ))}
                        <th className="px-2 py-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data[activeModule.id] || []).map((row) => (
                        <tr key={row.id} className="border-b border-[#101828]/06">
                          {activeModule.fields.slice(0, 4).map((f) => (
                            <td key={f.key} className="px-2 py-2 text-[#344054]">
                              {row[f.key] || "—"}
                            </td>
                          ))}
                          <td className="px-2 py-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="text-xs font-semibold text-[#00A8CC]"
                                onClick={() => {
                                  const next: Record<string, string> = {};
                                  for (const f of activeModule.fields) {
                                    next[f.key] = row[f.key] || "";
                                  }
                                  setForm(next);
                                  setEditingId(row.id);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-xs font-semibold text-red-600"
                                onClick={() => void onDelete(row.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!(data[activeModule.id] || []).length ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-2 py-6 text-center text-[#667085]"
                          >
                            No records yet — add fictional sample data.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
