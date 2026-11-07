import { NextResponse } from "next/server";
import {
  createSessionToken,
  sessionCookieOptions,
  validateAdminCredentials,
} from "@/lib/admin-auth";
import { adminCredentialsConfigured } from "@/lib/admin/credentials";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email || "");
  const password = String(body.password || "");
  const cfg = adminCredentialsConfigured();

  if (!cfg.emailConfigured || !cfg.passwordConfigured) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Admin login is not configured on Vercel. Add Environment Variables ADMIN_EMAIL and ADMIN_PASSWORD (Production), then Redeploy.",
      },
      { status: 503 },
    );
  }

  if (cfg.passwordLength < 8) {
    return NextResponse.json(
      {
        ok: false,
        error: "ADMIN_PASSWORD on the server must be at least 8 characters.",
      },
      { status: 503 },
    );
  }

  try {
    if (!(await validateAdminCredentials(email, password))) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid email or password. Server expects email like ${cfg.emailMasked || "ADMIN_EMAIL"}. Check Vercel Environment Variables.`,
        },
        { status: 401 },
      );
    }

    const token = createSessionToken(email);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Unable to sign in. Set ADMIN_EMAIL and ADMIN_PASSWORD in Vercel Environment Variables, then Redeploy.",
      },
      { status: 503 },
    );
  }
}
