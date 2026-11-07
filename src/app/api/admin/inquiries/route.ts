import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createInquiry, listInquiries } from "@/lib/inquiries";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const inquiries = await listInquiries();
  return NextResponse.json({ ok: true, inquiries });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
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
    details.length < 5
  ) {
    return NextResponse.json(
      { ok: false, error: "Please complete required inquiry fields." },
      { status: 400 },
    );
  }

  const inquiry = await createInquiry({
    fullName,
    businessName: businessName || null,
    email,
    phone,
    service,
    budget: budget || null,
    details,
    source: "admin",
  });

  return NextResponse.json({ ok: true, inquiry });
}
