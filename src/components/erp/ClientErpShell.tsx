"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import type { DemoProduct } from "@/lib/demos/types";

type Props = {
  clientName: string;
  email: string;
  erp: DemoProduct;
  mustChangePassword: boolean;
};

function PasswordGate({
  forced,
}: {
  forced: boolean;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const open = forced || search.get("changePassword") === "1";
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/client/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not update password.");
        return;
      }
      setMessage("Password updated.");
      router.replace("/erp");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto mb-4 max-w-7xl px-4 sm:px-6 lg:px-8">
      <form onSubmit={onSubmit} className="demo-card p-5">
        <h2 className="font-display text-lg font-semibold text-[var(--demo-heading)]">
          {forced ? "Set a New Password" : "Change Password"}
        </h2>
        <p className="mt-1 text-sm text-[var(--demo-text)]">
          Temporary passwords must be changed before regular use.
        </p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm text-[var(--demo-text)]" htmlFor="currentPassword">
              Current / Temporary Password
            </label>
            <input
              id="currentPassword"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="demo-input mt-1"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--demo-text)]" htmlFor="newPassword">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="demo-input mt-1"
            />
          </div>
        </div>
        <button type="submit" className="btn-primary mt-4 !w-auto" disabled={saving}>
          {saving ? "Saving…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}

export function ClientErpShell({
  clientName,
  email,
  erp,
  mustChangePassword,
}: Props) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/client/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="demo-card mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-base font-semibold text-[var(--demo-heading)]">
            {clientName}
          </p>
          <p className="text-sm text-[var(--demo-text)]">
            {email} · {erp === "hospital" ? "Hospital ERP" : "Society ERP"}
          </p>
        </div>
        <button type="button" className="btn-secondary !w-auto" onClick={() => void logout()}>
          Logout
        </button>
      </div>
      <Suspense fallback={null}>
        <PasswordGate forced={mustChangePassword} />
      </Suspense>
    </div>
  );
}
