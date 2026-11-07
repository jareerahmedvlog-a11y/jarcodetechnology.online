"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
        client?: { mustChangePassword?: boolean };
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      const next = search.get("next") || data.redirectTo || "/erp";
      router.replace(
        data.client?.mustChangePassword
          ? `/erp?changePassword=1`
          : next,
      );
      router.refresh();
    } catch {
      setError("Unable to reach the login service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section-soft mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-10">
      <form onSubmit={onSubmit} className="premium-card w-full p-6 sm:p-8">
        <p className="text-sm font-medium text-[#00A8CC]">Client Access</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-[#101828]">
          Login to Your ERP
        </h1>
        <p className="mt-2 text-sm text-[#475467]">
          Use the email and password provided by JARCODE TECHNOLOGY admin.
        </p>

        {error ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <label className="mt-5 block text-sm text-[#475467]" htmlFor="email">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field mt-1"
        />

        <label className="mt-4 block text-sm text-[#475467]" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field mt-1"
        />

        <button type="submit" className="btn-primary mt-6" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </button>

        <p className="mt-4 text-center text-sm text-text-dim">
          Admin staff?{" "}
          <Link href="/admin/login" className="text-cyan-300 hover:text-cyan-200">
            Admin Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-text-muted">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
