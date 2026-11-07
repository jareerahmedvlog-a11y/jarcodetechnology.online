"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEMO_WARNING, isInvoiceCollection } from "@/config/demos";
import {
  societyCollections,
  societyNav,
  societyRoleLabels,
  type SocietyRole,
} from "@/config/society";
import { DemoWarning } from "@/components/demos/DemoWarning";
import { emptyDemoDatabase } from "@/lib/demos/empty";
import type { DemoDatabase, DemoRecord } from "@/lib/demos/types";
import {
  financeStats,
  societyDashboardStats,
  visitorStats,
} from "@/lib/society/visitors";
import { cn } from "@/lib/utils";

type Props = {
  initialData?: DemoDatabase;
  mode?: "public" | "tenant";
  clientName?: string;
};

const HIDDEN_FORM_KEYS = new Set([
  "entryCode",
  "codeExpiresAt",
  "checkedInAt",
  "checkedOutAt",
  "guardId",
  "durationMinutes",
]);

export function SocietyWorkspace({
  initialData,
  mode = "public",
  clientName,
}: Props) {
  const isTenant = mode === "tenant";
  const boot = initialData ?? emptyDemoDatabase("society");
  const [role, setRole] = useState<SocietyRole>("administrator");
  const [active, setActive] = useState("dashboard");
  const [data, setData] = useState<DemoDatabase>(boot);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<DemoRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [guardId, setGuardId] = useState("GRD-001");
  const [verifyCode, setVerifyCode] = useState("");
  const [verified, setVerified] = useState<Record<string, string> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [listQuery, setListQuery] = useState("");
  const [listDate, setListDate] = useState("");
  const dataRef = useRef(boot);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const collection = useMemo(
    () => societyCollections.find((c) => c.id === active) || null,
    [active],
  );

  const nav = useMemo(() => {
    return societyNav
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => item.roles.includes(role)),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [role]);

  const load = useCallback(async (quiet = true) => {
    if (!quiet) setRefreshing(true);
    try {
      const res = await fetch(isTenant ? "/api/erp/data" : "/api/demos/society", {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        data?: DemoDatabase;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.data) {
        if (!quiet) setError(json.error || "Could not sync society data.");
        return;
      }
      if (JSON.stringify(json.data) !== JSON.stringify(dataRef.current)) {
        setData(json.data);
        dataRef.current = json.data;
      }
      setError("");
    } catch {
      if (!quiet) setError("Sync failed. You can still browse modules.");
    } finally {
      if (!quiet) setRefreshing(false);
    }
  }, [isTenant]);

  useEffect(() => {
    setData(boot);
    dataRef.current = boot;
    void load(true);
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, 45000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTenant, load]);

  useEffect(() => {
    if (!collection) {
      setForm({});
      setEditing(null);
      return;
    }
    const blank: Record<string, string> = {};
    for (const field of collection.fields) {
      if (HIDDEN_FORM_KEYS.has(field.key) && field.key !== "status") continue;
      blank[field.key] = field.key === "status" && collection.id === "visitors" ? "Approved" : "";
    }
    setForm(blank);
    setEditing(null);
  }, [collection]);

  useEffect(() => {
    const allowed = nav.flatMap((c) => c.items.map((i) => i.id));
    if (!allowed.includes(active)) setActive(allowed[0] || "dashboard");
  }, [nav, active]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!collection) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (collection.id === "visitors" && !editing) {
        const res = await fetch("/api/society/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "register", data: form }),
        });
        const json = (await res.json()) as {
          ok?: boolean;
          error?: string;
          entryCode?: string;
        };
        if (!res.ok || !json.ok) {
          setError(json.error || "Could not register visitor.");
          return;
        }
        setMessage(`Visitor registered. Entry Code: ${json.entryCode}`);
      } else {
        const url = isTenant
          ? editing
            ? `/api/erp/${collection.id}/${editing.id}`
            : `/api/erp/${collection.id}`
          : editing
            ? `/api/demos/society/${collection.id}/${editing.id}`
            : `/api/demos/society/${collection.id}`;
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
        setMessage(editing ? "Record updated." : "Record added.");
      }
      setEditing(null);
      await load(true);
    } catch {
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!collection) return;
    if (!confirm("Delete this record?")) return;
    try {
      const res = await fetch(
        isTenant
          ? `/api/erp/${collection.id}/${id}`
          : `/api/demos/society/${collection.id}/${id}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error || "Delete failed.");
        return;
      }
      setMessage("Record deleted.");
      await load(true);
    } catch {
      setError("Delete failed.");
    }
  }

  async function visitorAction(action: string, payload: Record<string, unknown> = {}) {
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/society/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, guardId, ...payload }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        entryCode?: string;
        visitor?: Record<string, string>;
      };
      if (!res.ok || !json.ok) {
        setError(json.error || "Action failed.");
        setVerified(null);
        return json;
      }
      setMessage(json.message || "Done.");
      if (json.visitor) setVerified(json.visitor);
      if (json.entryCode) setMessage(`Entry Code: ${json.entryCode}`);
      await load(true);
      return json;
    } catch {
      setError("Network error.");
      return { ok: false };
    }
  }

  function startEdit(row: DemoRecord) {
    if (!collection) return;
    const next: Record<string, string> = {};
    for (const field of collection.fields) {
      if (HIDDEN_FORM_KEYS.has(field.key) && field.key !== "status") continue;
      next[field.key] = String(row[field.key] || "");
    }
    setForm(next);
    setEditing(row);
  }

  const dash = societyDashboardStats(data);
  const vStats = visitorStats(data);
  const fStats = financeStats(data);
  const activeVisitors = (data.visitors || []).filter((v) => v.status === "Checked In");

  const filteredRows = useMemo(() => {
    if (!collection) return [];
    const rows = data[collection.id] || [];
    const q = listQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (listDate) {
        const dateHit = Object.values(row).some(
          (v) => typeof v === "string" && v.slice(0, 10) === listDate,
        );
        if (!dateHit) return false;
      }
      if (!q) return true;
      return Object.values(row).some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [collection, data, listQuery, listDate]);

  const chartBars = [
    { label: "Visitors today", value: dash.visitorsToday, max: Math.max(dash.visitorsToday, 1) },
    { label: "Inside now", value: dash.visitorsInside, max: Math.max(dash.visitorsToday, dash.visitorsInside, 1) },
    { label: "Open complaints", value: dash.openComplaints, max: Math.max(dash.openComplaints, 1) },
    {
      label: "Collection",
      value: dash.monthlyCollection,
      max: Math.max(dash.monthlyCollection, dash.outstandingPayments, 1),
    },
    {
      label: "Outstanding",
      value: dash.outstandingPayments,
      max: Math.max(dash.monthlyCollection, dash.outstandingPayments, 1),
    },
  ];

  function Stat({ label, value }: { label: string; value: string | number }) {
    return (
      <div className="demo-card p-4">
        <p className="text-xs tracking-wide text-[var(--demo-muted)] uppercase">{label}</p>
        <p className="mt-2 font-display text-2xl font-bold text-[var(--demo-heading)]">{value}</p>
      </div>
    );
  }

  const formFields = collection
    ? collection.fields.filter(
        (f) =>
          !(HIDDEN_FORM_KEYS.has(f.key) && f.key !== "status") ||
          (collection.id === "visitors" && f.key === "status"),
      )
    : [];

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-col gap-3 lg:mb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {isTenant ? (
            <p className="text-sm font-medium text-[var(--demo-accent)]">
              Private Society ERP{clientName ? ` · ${clientName}` : ""}
            </p>
          ) : (
            <Link
              href="/create-your-demo"
              className="demo-link text-sm font-medium"
            >
              ← Back to Create Your Demo
            </Link>
          )}
          <h1 className="mt-2 font-display text-xl font-bold text-[var(--demo-heading)] sm:text-2xl lg:text-3xl">
            Society Office Management Software
          </h1>
          <p className="mt-1 text-sm text-[var(--demo-text)]">
            Professional housing society operations — visitors, billing, security & more.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-[var(--demo-muted)]" htmlFor="society-role">
            Working as
          </label>
          <select
            id="society-role"
            value={role}
            onChange={(e) => setRole(e.target.value as SocietyRole)}
            className="min-h-11 rounded-xl demo-input"
          >
            {(Object.keys(societyRoleLabels) as SocietyRole[]).map((r) => (
              <option key={r} value={r}>
                {societyRoleLabels[r]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-secondary !w-auto lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "Close Menu" : "Modules"}
          </button>
        </div>
      </div>

      {!isTenant ? (
        <div className="mb-5">
          <DemoWarning />
          
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {menuOpen ? (
          <div className="fixed inset-0 z-[65] lg:hidden" role="presentation">
            <button
              type="button"
              className="absolute inset-0 bg-[rgba(17,24,39,0.35)] touch-manipulation"
              aria-label="Close modules menu"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-hidden rounded-t-3xl border border-[var(--demo-border)] bg-white p-3 shadow-[var(--demo-shadow)]"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="font-display text-base font-semibold text-[var(--demo-heading)]">Modules</p>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border text-[var(--demo-heading)]"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <nav
                className="max-h-[calc(78dvh-4.5rem)] space-y-4 overflow-y-auto overscroll-contain pr-1"
                aria-label="Society modules"
              >
                {nav.map((cat) => (
                  <div key={cat.id}>
                    <p className="mb-1 px-2 text-[11px] font-semibold tracking-wide text-[var(--demo-muted)] uppercase">
                      {cat.label}
                    </p>
                    {cat.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActive(item.id);
                          setMenuOpen(false);
                          setMessage("");
                          setError("");
                        }}
                        className={cn(
                          "mb-1 w-full rounded-xl px-3 py-3 text-left text-sm font-medium touch-manipulation",
                          active === item.id
                            ? "demo-nav-item-active"
                            : "demo-nav-item",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        ) : null}

        <aside className="demo-sidebar sticky top-[calc(var(--header-h)+1rem)] hidden h-fit rounded-2xl p-3 lg:block">
          <nav className="max-h-[70vh] space-y-4 overflow-y-auto overscroll-contain pr-1" aria-label="Society modules desktop">
            {nav.map((cat) => (
              <div key={cat.id}>
                <p className="mb-1 px-2 text-[11px] font-semibold tracking-wide text-[var(--demo-muted)] uppercase">
                  {cat.label}
                </p>
                {cat.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActive(item.id);
                      setMessage("");
                      setError("");
                    }}
                    className={cn(
                      "mb-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium touch-manipulation",
                      active === item.id
                        ? "demo-nav-item-active"
                        : "demo-nav-item",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 space-y-5">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </div>
          ) : null}
          {refreshing ? <p className="text-xs text-[var(--demo-muted)]">Syncing…</p> : null}

          {active === "dashboard" ? (
            <div className="space-y-5">
              <div className="demo-card p-5">
                <h2 className="font-display text-xl font-semibold text-[var(--demo-heading)]">
                  Society Dashboard
                </h2>
                <p className="mt-2 text-sm text-[var(--demo-text)]">
                  Live counts from the {isTenant ? "private client" : "shared demo"} database.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Stat label="Total Properties" value={dash.totalProperties} />
                <Stat label="Registered Residents" value={dash.registeredResidents} />
                <Stat label="Visitors Today" value={dash.visitorsToday} />
                <Stat label="Currently Inside" value={dash.visitorsInside} />
                <Stat label="Pending Approvals" value={dash.pendingVisitorApprovals} />
                <Stat label="Payments Received" value={dash.monthlyCollection} />
                <Stat label="Outstanding" value={dash.outstandingPayments} />
                <Stat label="Open Complaints" value={dash.openComplaints} />
                <Stat label="Maintenance Requests" value={dash.maintenanceRequests} />
                <Stat label="Registered Vehicles" value={dash.registeredVehicles} />
              </div>
              <div className="demo-card p-5">
                <h3 className="font-display text-lg font-semibold text-[var(--demo-heading)]">Activity snapshot</h3>
                <div className="mt-4 space-y-3">
                  {chartBars.map((bar) => (
                    <div key={bar.label}>
                      <div className="mb-1 flex justify-between text-xs text-[var(--demo-text)]">
                        <span>{bar.label}</span>
                        <span>{bar.value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-[var(--demo-accent)]"
                          style={{
                            width: `${Math.min(100, Math.round((Number(bar.value) / bar.max) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {active === "visitor-dashboard" ? (
            <div className="space-y-5">
              <div className="demo-card p-5">
                <h2 className="font-display text-xl font-semibold text-[var(--demo-heading)]">
                  Visitor Dashboard
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Stat label="Total Visitors Today" value={vStats.totalToday} />
                <Stat label="Expected Visitors" value={vStats.expected} />
                <Stat label="Currently Inside" value={vStats.currentlyInside} />
                <Stat label="Checked Out Today" value={vStats.checkedOut} />
                <Stat label="Pending Approvals" value={vStats.pendingApprovals} />
                <Stat label="Rejected" value={vStats.rejected} />
                <Stat label="Expired Codes" value={vStats.expired} />
              </div>
            </div>
          ) : null}

          {active === "finance-dashboard" ? (
            <div className="space-y-5">
              <div className="demo-card p-5">
                <h2 className="font-display text-xl font-semibold text-[var(--demo-heading)]">
                  Financial Dashboard
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Stat label="Total Monthly Billing" value={fStats.totalBilling} />
                <Stat label="Payments Received" value={fStats.totalPaid} />
                <Stat label="Outstanding Amount" value={fStats.outstanding} />
                <Stat label="Overdue Payments" value={fStats.overdue} />
                <Stat label="Invoices" value={fStats.invoiceCount} />
              </div>
            </div>
          ) : null}

          {active === "verify-entry" ? (
            <div className="space-y-5">
              <div className="demo-card p-5">
                <h2 className="font-display text-xl font-semibold text-[var(--demo-heading)]">
                  Visitor Entry Verification
                </h2>
                <p className="mt-2 text-sm text-[var(--demo-text)]">
                  Gate interface for security guards — enter the visitor Entry Code.
                </p>
              </div>
              <div className="demo-card p-5">
                <label className="text-sm text-[var(--demo-text)]" htmlFor="guardId">
                  Guard Account ID
                </label>
                <input
                  id="guardId"
                  value={guardId}
                  onChange={(e) => setGuardId(e.target.value)}
                  className="mt-1 w-full rounded-xl demo-input"
                />
                <label className="mt-4 block text-sm text-[var(--demo-text)]" htmlFor="entryCode">
                  Entry Code
                </label>
                <input
                  id="entryCode"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  placeholder="JAR-######"
                  className="mt-1 w-full rounded-xl demo-input text-lg font-semibold tracking-wider"
                />
                <button
                  type="button"
                  className="btn-primary mt-4 min-h-12"
                  onClick={() => void visitorAction("verify", { code: verifyCode })}
                >
                  Verify Entry
                </button>
              </div>
              {verified ? (
                <div className="demo-card border-emerald-200 bg-emerald-50 p-5">
                  <p className="font-display text-lg font-semibold text-emerald-800">
                    SUCCESSFULLY VERIFIED
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-[var(--demo-text)]">
                    <li>Visitor: {verified.visitorName}</li>
                    <li>Resident: {verified.residentName}</li>
                    <li>House / Flat: {verified.houseNo}</li>
                    <li>Purpose: {verified.purpose}</li>
                    <li>Mobile: {verified.mobile}</li>
                    <li>
                      Expected: {verified.expectedDate} {verified.expectedArrival}
                    </li>
                    <li>Vehicle: {verified.vehicle || "—"}</li>
                  </ul>
                  <button
                    type="button"
                    className="btn-primary mt-4 !w-auto"
                    onClick={() =>
                      void visitorAction("confirm-entry", { id: verified.id })
                    }
                  >
                    Confirm Visitor Entry
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {active === "active-visitors" ? (
            <div className="space-y-5">
              <div className="demo-card p-5">
                <h2 className="font-display text-xl font-semibold text-[var(--demo-heading)]">
                  Currently Inside Society
                </h2>
                <p className="mt-1 text-sm text-[var(--demo-text)]">
                  Checked-in visitors. Mark exit when they leave.
                </p>
              </div>
              {!activeVisitors.length ? (
                <p className="text-sm text-[var(--demo-text)]">No visitors currently inside.</p>
              ) : (
                <ul className="space-y-3">
                  {activeVisitors.map((row) => (
                    <li key={row.id} className="demo-card p-4">
                      <p className="font-medium text-[var(--demo-heading)]">{row.visitorName}</p>
                      <p className="text-sm text-[var(--demo-text)]">
                        {row.houseNo} · {row.residentName} · In at {row.checkedInAt}
                      </p>
                      <button
                        type="button"
                        className="btn-secondary mt-3 !w-auto"
                        onClick={() => void visitorAction("mark-exit", { id: row.id })}
                      >
                        Mark Exit
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {collection ? (
            <div className="space-y-5">
              <div className="demo-card p-5">
                <h2 className="font-display text-xl font-semibold text-[var(--demo-heading)]">
                  {collection.label}
                </h2>
                <p className="mt-1 text-sm text-[var(--demo-text)]">{collection.description}</p>
              </div>

              <form onSubmit={onSubmit} className="demo-card p-5">
                <h3 className="font-display text-lg font-semibold text-[var(--demo-heading)]">
                  {editing ? "Edit Record" : collection.id === "visitors" ? "Register Visitor" : "Add Record"}
                </h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {formFields.map((field) => (
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
                          className="mt-1 w-full rounded-xl demo-input"
                        />
                      ) : field.type === "select" ? (
                        <select
                          id={field.key}
                          required={field.required}
                          value={form[field.key] || ""}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          className="mt-1 w-full rounded-xl demo-input"
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
                          className="mt-1 w-full rounded-xl demo-input"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="submit" className="btn-primary !w-auto" disabled={saving}>
                    {saving
                      ? "Saving…"
                      : collection.id === "visitors" && !editing
                        ? "Register & Generate Entry Code"
                        : editing
                          ? "Update Record"
                          : "Add Record"}
                  </button>
                  {editing ? (
                    <button
                      type="button"
                      className="btn-secondary !w-auto"
                      onClick={() => setEditing(null)}
                    >
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="demo-card overflow-hidden">
                <div className="space-y-3 border-b border-border px-5 py-3">
                  <h3 className="font-display font-semibold text-[var(--demo-heading)]">
                    Records ({filteredRows.length}
                    {filteredRows.length !== (data[collection.id]?.length || 0)
                      ? ` of ${data[collection.id]?.length || 0}`
                      : ""}
                    )
                  </h3>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={listQuery}
                      onChange={(e) => setListQuery(e.target.value)}
                      placeholder="Search records…"
                      className="min-h-11 w-full rounded-xl demo-input"
                    />
                    <input
                      type="date"
                      value={listDate}
                      onChange={(e) => setListDate(e.target.value)}
                      className="min-h-11 rounded-xl demo-input"
                    />
                  </div>
                </div>
                {!filteredRows.length ? (
                  <p className="p-5 text-sm text-[var(--demo-text)]">No records yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {filteredRows.map((row) => (
                      <li key={row.id} className="p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:justify-between">
                          <div className="min-w-0 space-y-1">
                            {collection.fields.map((field) => {
                              const val = row[field.key];
                              if (!val && HIDDEN_FORM_KEYS.has(field.key)) return null;
                              return (
                                <p key={field.key} className="text-sm text-[var(--demo-text)]">
                                  <span className="text-[var(--demo-muted)]">{field.label}: </span>
                                  <span
                                    className={cn(
                                      "whitespace-pre-wrap text-[var(--demo-heading)]",
                                      field.key === "entryCode" &&
                                        "font-mono font-semibold text-[var(--demo-heading)]",
                                    )}
                                  >
                                    {val || "—"}
                                  </span>
                                </p>
                              );
                            })}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {collection.id === "visitors" ? (
                              <>
                                <button
                                  type="button"
                                  className="min-h-11 rounded-xl border border-border px-3 text-sm font-semibold text-[var(--demo-accent)]"
                                  onClick={() =>
                                    void visitorAction("generate-code", { id: row.id })
                                  }
                                >
                                  Generate Entry Code
                                </button>
                                <button
                                  type="button"
                                  className="min-h-11 rounded-xl border border-border px-3 text-sm text-amber-200"
                                  onClick={() => void visitorAction("revoke", { id: row.id })}
                                >
                                  Revoke Code
                                </button>
                              </>
                            ) : null}
                            {collection.id === "walkIns" &&
                            row.approvalStatus === "Pending Approval" ? (
                              <button
                                type="button"
                                className="min-h-11 rounded-xl border border-border px-3 text-sm font-semibold text-[var(--demo-accent)]"
                                onClick={() =>
                                  void visitorAction("approve-walk-in", { id: row.id })
                                }
                              >
                                Approve Entry
                              </button>
                            ) : null}
                            {isInvoiceCollection(collection.id) ? (
                              <button
                                type="button"
                                className="min-h-11 rounded-xl border border-border px-3 text-sm text-[var(--demo-heading)]"
                                onClick={() => {
                                  const lines = collection.fields
                                    .map((f) => `${f.label}: ${row[f.key] || "—"}`)
                                    .join("\n");
                                  const html = `<!doctype html><html><head><title>Invoice</title>
                                    <style>body{font-family:system-ui;padding:24px}pre{white-space:pre-wrap}.note{margin-top:12px;padding:12px;border:1px solid #ddd;border-radius:8px}</style></head>
                                    <body><h1>Society Invoice</h1><pre>${lines.replace(/</g, "&lt;")}</pre>
                                    ${row.extraNote ? `<div class="note"><strong>Extra Note</strong><br/>${String(row.extraNote).replace(/</g, "&lt;")}</div>` : ""}
                                    <script>onload=()=>print()</script></body></html>`;
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
                              className="min-h-11 rounded-xl border border-border px-3 text-sm font-semibold text-[var(--demo-accent)]"
                              onClick={() => startEdit(row)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="min-h-11 rounded-xl border border-red-200 bg-red-50 px-3 text-sm text-red-700"
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
