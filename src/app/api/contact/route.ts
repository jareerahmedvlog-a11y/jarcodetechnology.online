import { NextResponse } from "next/server";
import { createInquiry } from "@/lib/inquiries";

type ContactPayload = {
  fullName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  service?: string;
  budget?: string;
  details?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: ContactPayload;

  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const fullName = String(body.fullName || "").trim();
  const businessName = String(body.businessName || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const service = String(body.service || "").trim();
  const budget = String(body.budget || "").trim();
  const details = String(body.details || "").trim();

  if (
    fullName.length < 2 ||
    !isValidEmail(email) ||
    phone.length < 7 ||
    !service ||
    details.length < 10
  ) {
    return NextResponse.json(
      { ok: false, error: "Please complete all required fields correctly." },
      { status: 400 },
    );
  }

  if (
    fullName.length > 120 ||
    email.length > 200 ||
    phone.length > 40 ||
    details.length > 5000
  ) {
    return NextResponse.json(
      { ok: false, error: "One or more fields exceed the allowed length." },
      { status: 400 },
    );
  }

  try {
    await createInquiry({
      fullName,
      businessName: businessName || null,
      email,
      phone,
      service,
      budget: budget || null,
      details,
      source: "website",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not save your inquiry. Please try WhatsApp." },
      { status: 500 },
    );
  }

  // Optional extras — do not fail the request if these are missing/misconfigured
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

  try {
    if (webhook) {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          businessName: businessName || null,
          email,
          phone,
          service,
          budget: budget || null,
          details,
          submittedAt: new Date().toISOString(),
        }),
      });
    } else if (resendKey && toEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          reply_to: email,
          subject: `New project inquiry — ${service}`,
          text: [
            `Name: ${fullName}`,
            `Business: ${businessName || "N/A"}`,
            `Email: ${email}`,
            `Phone: ${phone}`,
            `Service: ${service}`,
            `Budget: ${budget || "N/A"}`,
            "",
            details,
          ].join("\n"),
        }),
      });
    }
  } catch {
    // Inquiry already saved for admin — ignore delivery side failures
  }

  return NextResponse.json({ ok: true });
}
