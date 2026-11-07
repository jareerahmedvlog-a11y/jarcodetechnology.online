"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BUSINESS_NICHES, type CustomModuleDef } from "@/lib/custom-demos/types";
import { cn } from "@/lib/utils";

type Step = "info" | "modules" | "generating";

export function CustomDemoBuilder() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("info");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [customNiche, setCustomNiche] = useState("");
  const [form, setForm] = useState({
    niche: "Restaurant Management",
    businessName: "",
    businessType: "",
    description: "",
    requirements: "",
    extraInstructions: "",
    currency: "PKR",
    country: "Pakistan",
    aiAssistantEnabled: true,
  });
  const [modules, setModules] = useState<CustomModuleDef[]>([]);
  const [unsupportedNotes, setUnsupportedNotes] = useState<string[]>([]);

  const nicheValue =
    form.niche === "Custom Business" ? customNiche.trim() || "Custom Business" : form.niche;

  async function proposeModules(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/custom-demos/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          niche: nicheValue,
          businessType: form.businessType || nicheValue,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        modules?: CustomModuleDef[];
        unsupportedNotes?: string[];
      };
      if (!res.ok || !json.ok || !json.modules?.length) {
        setError(json.error || "AI could not propose modules. Try again.");
        return;
      }
      setModules(json.modules);
      setUnsupportedNotes(json.unsupportedNotes || []);
      setStep("modules");
    } catch {
      setError("Could not reach JARCODE AI.");
    } finally {
      setBusy(false);
    }
  }

  async function refineModules() {
    if (!form.extraInstructions.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/custom-demos/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          niche: nicheValue,
          businessType: form.businessType || nicheValue,
          extraInstructions: `${form.extraInstructions}\n\nCurrent modules to refine: ${modules
            .map((m) => m.label)
            .join(", ")}`,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        modules?: CustomModuleDef[];
        unsupportedNotes?: string[];
      };
      if (!res.ok || !json.ok || !json.modules?.length) {
        setError(json.error || "Could not refine modules.");
        return;
      }
      setModules(json.modules);
      setUnsupportedNotes(json.unsupportedNotes || []);
    } catch {
      setError("Could not refine with AI.");
    } finally {
      setBusy(false);
    }
  }

  async function generateDemo() {
    setBusy(true);
    setError("");
    setStep("generating");
    try {
      const res = await fetch("/api/custom-demos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          niche: nicheValue,
          businessType: form.businessType || nicheValue,
          modules,
          unsupportedNotes,
          aiAssistantEnabled: form.aiAssistantEnabled,
          publish: true,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        url?: string;
      };
      if (!res.ok || !json.ok || !json.url) {
        setError(json.error || "Could not save demo.");
        setStep("modules");
        return;
      }
      router.push(json.url);
      router.refresh();
    } catch {
      setError("Connection issue while generating demo.");
      setStep("modules");
    } finally {
      setBusy(false);
    }
  }

  function updateModule(index: number, patch: Partial<CustomModuleDef>) {
    setModules((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    );
  }

  function removeModule(index: number) {
    setModules((prev) => prev.filter((_, i) => i !== index));
  }

  function addModule() {
    const id = `custom-${Date.now().toString(36)}`;
    setModules((prev) => [
      ...prev,
      {
        id,
        label: "Custom Module",
        description: "Custom business records",
        fields: [
          { key: "name", label: "Name", type: "text", required: true },
          {
            key: "status",
            label: "Status",
            type: "select",
            required: true,
            options: ["Active", "Inactive"],
          },
          { key: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ]);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/create-your-demo"
          className="text-sm font-semibold text-[#00A8CC] hover:underline"
        >
          ← Back to Create Demo
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold text-[#101828] sm:text-4xl">
          Create Your Own Business Demo
        </h1>
        <p className="mt-2 text-base text-[#475467]">
          Describe your business, choose your requirements, and let AI build a customized
          software demo for you.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {step === "info" ? (
        <form onSubmit={proposeModules} className="premium-card space-y-5 p-5 sm:p-7">
          <div>
            <p className="text-sm font-semibold text-[#101828]">
              What type of business do you run?
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {BUSINESS_NICHES.map((niche) => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, niche }))}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold sm:text-sm",
                    form.niche === niche
                      ? "border-[#101828] bg-[#101828] text-white"
                      : "border-[#101828]/12 text-[#475467] hover:border-[#00A8CC]/40",
                  )}
                >
                  {niche}
                </button>
              ))}
            </div>
            {form.niche === "Custom Business" ? (
              <input
                className="input-field mt-3"
                placeholder="Enter your business niche"
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
                required
              />
            ) : null}
          </div>

          <label className="block text-sm text-[#475467]">
            Business Name *
            <input
              className="input-field mt-1"
              required
              maxLength={100}
              value={form.businessName}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            />
          </label>
          <label className="block text-sm text-[#475467]">
            Business Type
            <input
              className="input-field mt-1"
              placeholder="e.g. Fine dining restaurant"
              value={form.businessType}
              onChange={(e) => setForm((f) => ({ ...f, businessType: e.target.value }))}
            />
          </label>
          <label className="block text-sm text-[#475467]">
            Short Business Description
            <textarea
              className="input-field mt-1"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className="block text-sm text-[#475467]">
            Business Requirements / Required Features
            <textarea
              className="input-field mt-1"
              rows={3}
              placeholder="Orders, inventory, staff attendance…"
              value={form.requirements}
              onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-[#475467]">
              Preferred Currency
              <input
                className="input-field mt-1"
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              />
            </label>
            <label className="block text-sm text-[#475467]">
              Country
              <input
                className="input-field mt-1"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              />
            </label>
          </div>
          <label className="block text-sm text-[#475467]">
            Additional Instructions
            <textarea
              className="input-field mt-1"
              rows={3}
              value={form.extraInstructions}
              onChange={(e) =>
                setForm((f) => ({ ...f, extraInstructions: e.target.value }))
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-[#344054]">
            <input
              type="checkbox"
              checked={form.aiAssistantEnabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, aiAssistantEnabled: e.target.checked }))
              }
            />
            Include optional AI Assistant module (enabled by default)
          </label>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "AI is designing modules…" : "Generate Module Suggestions with AI"}
          </button>
        </form>
      ) : null}

      {step === "modules" || step === "generating" ? (
        <div className="premium-card space-y-5 p-5 sm:p-7">
          <div>
            <h2 className="font-display text-xl font-bold text-[#101828]">
              Customize your ERP modules
            </h2>
            <p className="mt-1 text-sm text-[#475467]">
              Dashboard is always first in the demo. Edit, remove, or add modules below.
            </p>
          </div>

          <div className="rounded-xl border border-[#101828]/10 bg-[#F4F6FA] px-3 py-2 text-sm font-semibold text-[#101828]">
            1. Dashboard (mandatory)
          </div>

          <ul className="space-y-3">
            {modules.map((mod, index) => (
              <li
                key={mod.id}
                className="rounded-xl border border-[#101828]/10 p-3 sm:p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      className="input-field font-semibold"
                      value={mod.label}
                      onChange={(e) => updateModule(index, { label: e.target.value })}
                    />
                    <input
                      className="input-field text-sm"
                      value={mod.description}
                      onChange={(e) =>
                        updateModule(index, { description: e.target.value })
                      }
                    />
                    <p className="text-xs text-[#667085]">
                      {mod.fields.length} fields · id: {mod.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600"
                    onClick={() => removeModule(index)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <button type="button" className="btn-secondary" onClick={addModule}>
            + Add Custom Module
          </button>

          <label className="block text-sm text-[#475467]">
            Describe Anything Else You Need
            <textarea
              className="input-field mt-1"
              rows={3}
              placeholder="Tell AI how you want your business software to work..."
              value={form.extraInstructions}
              onChange={(e) =>
                setForm((f) => ({ ...f, extraInstructions: e.target.value }))
              }
            />
          </label>
          <button
            type="button"
            className="btn-secondary"
            disabled={busy || !form.extraInstructions.trim()}
            onClick={() => void refineModules()}
          >
            {busy ? "Updating…" : "Ask AI to Update Structure"}
          </button>

          <label className="flex items-center gap-2 text-sm text-[#344054]">
            <input
              type="checkbox"
              checked={form.aiAssistantEnabled}
              onChange={(e) =>
                setForm((f) => ({ ...f, aiAssistantEnabled: e.target.checked }))
              }
            />
            Keep AI Assistant in the generated sidebar
          </label>

          {unsupportedNotes.length ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Needs custom development (not interactive in demo)</p>
              <ul className="mt-1 list-disc pl-5">
                {unsupportedNotes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={() => setStep("info")}
            >
              Back
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={busy || !modules.length}
              onClick={() => void generateDemo()}
            >
              {step === "generating" || busy
                ? "Generating interactive demo…"
                : "Generate My Business Demo"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
