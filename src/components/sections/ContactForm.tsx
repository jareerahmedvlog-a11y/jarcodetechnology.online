"use client";

import { useState } from "react";
import { getWhatsAppLink, serviceOptions, siteConfig } from "@/config/site";

type FormState = "idle" | "loading" | "success" | "error" | "whatsapp";

type FormErrors = Partial<Record<string, string>>;

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState("");

  function validate(form: FormData): FormErrors {
    const next: FormErrors = {};
    const name = String(form.get("fullName") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const service = String(form.get("service") || "").trim();
    const details = String(form.get("details") || "").trim();

    if (name.length < 2) next.fullName = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Please enter a valid email address.";
    }
    if (phone.length < 7) {
      next.phone = "Please enter a WhatsApp or phone number.";
    }
    if (!service) next.service = "Please select a service.";
    if (details.length < 10) {
      next.details = "Please share a bit more about your project.";
    }
    return next;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    // Honeypot
    if (String(form.get("company_website") || "").trim()) {
      setState("success");
      setMessage("Thank you. Your inquiry has been received.");
      return;
    }

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setState("error");
      setMessage("Please fix the highlighted fields and try again.");
      return;
    }

    setState("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: String(form.get("fullName") || "").trim(),
          businessName: String(form.get("businessName") || "").trim(),
          email: String(form.get("email") || "").trim(),
          phone: String(form.get("phone") || "").trim(),
          service: String(form.get("service") || "").trim(),
          budget: String(form.get("budget") || "").trim(),
          details: String(form.get("details") || "").trim(),
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        fallback?: string;
        error?: string;
      };

      if (res.ok && data.ok) {
        setState("success");
        setMessage(
          "Thank you — your project inquiry was received. Our team will contact you soon.",
        );
        formEl.reset();
        return;
      }

      if (data.fallback === "whatsapp") {
        const waMessage = [
          "Hello Jarcode Technology, I would like to discuss a software project.",
          `Name: ${String(form.get("fullName") || "").trim()}`,
          `Business: ${String(form.get("businessName") || "").trim() || "N/A"}`,
          `Email: ${String(form.get("email") || "").trim()}`,
          `Phone: ${String(form.get("phone") || "").trim()}`,
          `Service: ${String(form.get("service") || "").trim()}`,
          `Budget: ${String(form.get("budget") || "").trim() || "N/A"}`,
          `Details: ${String(form.get("details") || "").trim()}`,
        ].join("\n");

        setState("whatsapp");
        setMessage(
          "Email delivery is not configured yet. Continue on WhatsApp to send this inquiry now.",
        );
        window.open(getWhatsAppLink(waMessage), "_blank", "noopener,noreferrer");
        return;
      }

      setState("error");
      setMessage(
        data.error ||
          "Something went wrong. Please try WhatsApp or try again later.",
      );
    } catch {
      setState("error");
      setMessage(
        "Unable to reach the server. Please contact us on WhatsApp instead.",
      );
    }
  }

  const fieldClass =
    "input-field mt-1.5";

  return (
    <form
      onSubmit={onSubmit}
      className="relative premium-card p-5 sm:p-8"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor="fullName" className="text-sm font-medium text-text">
            Full Name <span className="text-violet-300">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            className={fieldClass}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
          />
          {errors.fullName ? (
            <p id="fullName-error" className="mt-1 text-xs text-red-300">
              {errors.fullName}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="businessName" className="text-sm font-medium text-text">
            Business Name <span className="text-text-dim">(optional)</span>
          </label>
          <input
            id="businessName"
            name="businessName"
            autoComplete="organization"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-text">
            Email Address <span className="text-violet-300">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={fieldClass}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email ? (
            <p id="email-error" className="mt-1 text-xs text-red-300">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="phone" className="text-sm font-medium text-text">
            WhatsApp / Phone Number <span className="text-violet-300">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            placeholder={siteConfig.contact.phoneDisplay}
            className={fieldClass}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone ? (
            <p id="phone-error" className="mt-1 text-xs text-red-300">
              {errors.phone}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="service" className="text-sm font-medium text-text">
            Required Service <span className="text-violet-300">*</span>
          </label>
          <select
            id="service"
            name="service"
            required
            defaultValue=""
            className={fieldClass}
            aria-invalid={!!errors.service}
          >
            <option value="" disabled>
              Select a service
            </option>
            {serviceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.service ? (
            <p className="mt-1 text-xs text-red-300">{errors.service}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="budget" className="text-sm font-medium text-text">
            Estimated Budget <span className="text-text-dim">(optional)</span>
          </label>
          <input
            id="budget"
            name="budget"
            className={fieldClass}
            placeholder="e.g. discuss after discovery"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="details" className="text-sm font-medium text-text">
            Project Details <span className="text-violet-300">*</span>
          </label>
          <textarea
            id="details"
            name="details"
            required
            rows={5}
            className={fieldClass}
            placeholder="Tell us about your goals, required features, and timeline."
            aria-invalid={!!errors.details}
          />
          {errors.details ? (
            <p className="mt-1 text-xs text-red-300">{errors.details}</p>
          ) : null}
        </div>

        {/* Honeypot — hidden from users */}
        <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden>
          <label htmlFor="company_website">Company Website</label>
          <input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center pb-16 sm:pb-0">
        <button
          type="submit"
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60 sm:!w-auto"
          disabled={state === "loading"}
        >
          {state === "loading" ? "Sending…" : "Send Project Inquiry"}
        </button>
        <a
          href={getWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary sm:!w-auto"
        >
          Chat on WhatsApp
        </a>
      </div>

      <div
        className="mt-4 min-h-[1.5rem] text-sm"
        role="status"
        aria-live="polite"
      >
        {message ? (
          <p
            className={
              state === "success" || state === "whatsapp"
                ? "text-emerald-300"
                : "text-red-300"
            }
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
