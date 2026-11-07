"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminAiProviders } from "@/components/admin/AdminAiProviders";
import { AdminAiUsage } from "@/components/admin/AdminAiUsage";
import { AdminCustomDemos } from "@/components/admin/AdminCustomDemos";
import { InquiryAdmin } from "@/components/admin/InquiryAdmin";
import type { ClientPublic } from "@/lib/clients/types";
import type { DemoProduct } from "@/lib/demos/types";
import { cn } from "@/lib/utils";

type Tab =
  | "inquiries"
  | "clients"
  | "create-erp"
  | "ai-demos"
  | "ai-providers"
  | "ai-usage"
  | "settings";

export function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("clients");
  const [clients, setClients] = useState<ClientPublic[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    erp: "hospital" as DemoProduct,
    password: "",
  });
  const [creating, setCreating] = useState(false);
  const [createdTempPassword, setCreatedTempPassword] = useState("");

  const [credForm, setCredForm] = useState({
    currentPassword: "",
    newEmail: "",
    newPassword: "",
  });
  const [savingCreds, setSavingCreds] = useState(false);

  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    setError("");
    try {
      const res = await fetch("/api/admin/clients");
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = (await res.json()) as {
        ok?: boolean;
        clients?: ClientPublic[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to load clients.");
        return;
      }
      setClients(data.clients || []);
    } catch {
      setError("Failed to load clients.");
    } finally {
      setLoadingClients(false);
    }
  }, [router]);

  const loadAdminEmail = useCallback(async () => {
    const res = await fetch("/api/admin/credentials");
    if (!res.ok) return;
    const data = (await res.json()) as { ok?: boolean; email?: string };
    if (data.ok && data.email) {
      setAdminEmail(data.email);
      setCredForm((f) => ({ ...f, newEmail: data.email || "" }));
    }
  }, []);

  useEffect(() => {
    void loadClients();
    void loadAdminEmail();
  }, [loadClients, loadAdminEmail]);

  async function onCreateErp(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");
    setCreatedTempPassword("");
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          phone: createForm.phone,
          erp: createForm.erp,
          password: createForm.password || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        temporaryPassword?: string;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not create client ERP.");
        return;
      }
      setMessage(data.message || "Client ERP created.");
      setCreatedTempPassword(data.temporaryPassword || "");
      setCreateForm({
        name: "",
        email: "",
        phone: "",
        erp: "hospital",
        password: "",
      });
      await loadClients();
      setTab("clients");
    } catch {
      setError("Could not create client ERP.");
    } finally {
      setCreating(false);
    }
  }

  async function clientAction(
    id: string,
    action:
      | { type: "status"; status: ClientPublic["status"] }
      | { type: "reset" }
      | { type: "delete" },
  ) {
    setError("");
    setMessage("");
    try {
      if (action.type === "delete") {
        if (
          !confirm(
            "Delete this client account? Tenant data folder will remain as backup on disk.",
          )
        ) {
          return;
        }
        const res = await fetch(`/api/admin/clients/${id}`, { method: "DELETE" });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          setError(data.error || "Delete failed.");
          return;
        }
        setMessage("Client deleted.");
        await loadClients();
        return;
      }

      if (action.type === "reset") {
        const res = await fetch(`/api/admin/clients/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reset-password" }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          temporaryPassword?: string;
        };
        if (!res.ok || !data.ok) {
          setError(data.error || "Password reset failed.");
          return;
        }
        setMessage(
          `Temporary password: ${data.temporaryPassword || "(generated)"} — share securely.`,
        );
        await loadClients();
        return;
      }

      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action.status }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Status update failed.");
        return;
      }
      setMessage(`Account marked ${action.status}.`);
      await loadClients();
    } catch {
      setError("Action failed.");
    }
  }

  async function onSaveCredentials(e: FormEvent) {
    e.preventDefault();
    setSavingCreds(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: credForm.currentPassword,
          newEmail: credForm.newEmail,
          newPassword: credForm.newPassword || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        email?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not update admin credentials.");
        return;
      }
      setMessage("Admin credentials updated securely.");
      setAdminEmail(data.email || credForm.newEmail);
      setCredForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
    } catch {
      setError("Could not update admin credentials.");
    } finally {
      setSavingCreds(false);
    }
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "create-erp", label: "Create Your Client ERP System" },
    { id: "clients", label: "My Clients / Client ERP Management" },
    { id: "ai-demos", label: "AI Generated Client Demos" },
    { id: "ai-providers", label: "AI Provider Status" },
    { id: "ai-usage", label: "AI Usage" },
    { id: "inquiries", label: "Project Inquiries" },
    { id: "settings", label: "Admin Security" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-text">
            JARCODE Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage client ERP systems, public demos, inquiries, and admin access.
            {adminEmail ? ` Signed in as ${adminEmail}.` : ""}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary !w-auto"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            router.replace("/admin/login");
            router.refresh();
          }}
        >
          Logout
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-medium",
              tab === item.id
                ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                : "border-border text-text-muted hover:bg-white/5",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message ? <p className="mb-4 text-sm text-emerald-300">{message}</p> : null}
      {error ? (
        <p className="mb-4 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      {createdTempPassword ? (
        <p className="mb-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          Temporary client password (copy now):{" "}
          <strong className="font-mono">{createdTempPassword}</strong>
        </p>
      ) : null}

      {tab === "create-erp" ? (
        <form onSubmit={onCreateErp} className="gradient-border rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold text-text">
            Create Your Client ERP System
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Creates a private tenant workspace — completely separate from the public demo.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm text-text-muted" htmlFor="clientName">
                Client Name
              </label>
              <input
                id="clientName"
                required
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-[#0a0a12] px-3 py-2.5 text-sm text-text"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted" htmlFor="clientEmail">
                Client Email Address
              </label>
              <input
                id="clientEmail"
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-[#0a0a12] px-3 py-2.5 text-sm text-text"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted" htmlFor="clientPhone">
                Client Phone Number
              </label>
              <input
                id="clientPhone"
                required
                value={createForm.phone}
                onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-[#0a0a12] px-3 py-2.5 text-sm text-text"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted" htmlFor="clientPassword">
                Create Client Login (optional temporary password)
              </label>
              <input
                id="clientPassword"
                type="text"
                minLength={8}
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Leave blank to auto-generate"
                className="mt-1 w-full rounded-xl border border-border bg-[#0a0a12] px-3 py-2.5 text-sm text-text"
              />
            </div>
          </div>

          <p className="mt-5 text-sm font-medium text-text">Select ERP System</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  id: "hospital" as const,
                  title: "Hospital Management System",
                  desc: "For hospitals and clinics.",
                },
                {
                  id: "society" as const,
                  title: "Society Office Management System",
                  desc: "For housing societies and offices.",
                },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCreateForm((f) => ({ ...f, erp: option.id }))}
                className={cn(
                  "rounded-2xl border p-4 text-left",
                  createForm.erp === option.id
                    ? "border-cyan-400/50 bg-cyan-500/10"
                    : "border-border bg-[#0a0a12]",
                )}
              >
                <p className="font-display font-semibold text-text">{option.title}</p>
                <p className="mt-1 text-sm text-text-muted">{option.desc}</p>
              </button>
            ))}
          </div>

          <button type="submit" className="btn-primary mt-6 !w-auto" disabled={creating}>
            {creating ? "Creating…" : "Create ERP System"}
          </button>
        </form>
      ) : null}

      {tab === "clients" ? (
        <div className="gradient-border overflow-hidden rounded-2xl">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-text">
              My Clients / Client ERP Management
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Each client has an isolated tenant database — never mixed with public demos.
            </p>
          </div>
          {loadingClients ? (
            <p className="p-5 text-sm text-text-muted">Loading clients…</p>
          ) : clients.length === 0 ? (
            <p className="p-5 text-sm text-text-muted">
              No client ERP systems yet. Use Create Your Client ERP System.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-text-dim">
                  <tr>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">ERP</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Login</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className="px-4 py-3 text-text">{client.name}</td>
                      <td className="px-4 py-3 text-text-muted">{client.email}</td>
                      <td className="px-4 py-3 text-text-muted">
                        {client.erp === "hospital" ? "Hospital" : "Society"}
                      </td>
                      <td className="px-4 py-3 text-text-dim">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 capitalize text-text-muted">
                        {client.status}
                      </td>
                      <td className="px-4 py-3 text-text-dim">
                        {client.lastLoginAt
                          ? new Date(client.lastLoginAt).toLocaleString()
                          : "Never"}
                        {client.mustChangePassword ? " · temp pwd" : ""}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="rounded-lg border border-border px-2 py-1 text-xs text-cyan-300"
                            onClick={() =>
                              void clientAction(client.id, {
                                type: "status",
                                status: "active",
                              })
                            }
                          >
                            Activate
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-border px-2 py-1 text-xs text-amber-200"
                            onClick={() =>
                              void clientAction(client.id, {
                                type: "status",
                                status: "suspended",
                              })
                            }
                          >
                            Suspend
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-border px-2 py-1 text-xs text-text-muted"
                            onClick={() =>
                              void clientAction(client.id, {
                                type: "status",
                                status: "deactivated",
                              })
                            }
                          >
                            Deactivate
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-border px-2 py-1 text-xs text-cyan-200"
                            onClick={() => void clientAction(client.id, { type: "reset" })}
                          >
                            Reset Password
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-red-400/30 px-2 py-1 text-xs text-red-200"
                            onClick={() => void clientAction(client.id, { type: "delete" })}
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
          <div className="border-t border-border px-5 py-4 text-sm text-text-muted">
            Clients sign in at{" "}
            <Link href="/login" className="text-cyan-300">
              /login
            </Link>{" "}
            and are redirected to their private ERP at{" "}
            <Link href="/erp" className="text-cyan-300">
              /erp
            </Link>
            .
          </div>
        </div>
      ) : null}

      {tab === "settings" ? (
        <form onSubmit={onSaveCredentials} className="gradient-border rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-xl font-semibold text-text">
            Secure Admin Login
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Change your admin email/ID and password. Passwords are stored with scrypt hashing
            — never plaintext.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm text-text-muted" htmlFor="currentPassword">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                required
                value={credForm.currentPassword}
                onChange={(e) =>
                  setCredForm((f) => ({ ...f, currentPassword: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-border bg-[#0a0a12] px-3 py-2.5 text-sm text-text"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted" htmlFor="newEmail">
                Admin Email / ID
              </label>
              <input
                id="newEmail"
                type="email"
                required
                value={credForm.newEmail}
                onChange={(e) => setCredForm((f) => ({ ...f, newEmail: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-border bg-[#0a0a12] px-3 py-2.5 text-sm text-text"
              />
            </div>
            <div>
              <label className="text-sm text-text-muted" htmlFor="newPassword">
                New Password (optional)
              </label>
              <input
                id="newPassword"
                type="password"
                minLength={8}
                value={credForm.newPassword}
                onChange={(e) =>
                  setCredForm((f) => ({ ...f, newPassword: e.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-border bg-[#0a0a12] px-3 py-2.5 text-sm text-text"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-5 !w-auto" disabled={savingCreds}>
            {savingCreds ? "Saving…" : "Update Admin Credentials"}
          </button>
        </form>
      ) : null}

      {tab === "ai-demos" ? <AdminCustomDemos /> : null}

      {tab === "ai-providers" ? <AdminAiProviders /> : null}

      {tab === "ai-usage" ? <AdminAiUsage /> : null}

      {tab === "inquiries" ? (
        <div className="-mx-4 sm:mx-0">
          <InquiryAdmin embedded />
        </div>
      ) : null}
    </div>
  );
}
