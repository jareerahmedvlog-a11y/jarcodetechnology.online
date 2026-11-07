import { NextResponse } from "next/server";
import {
  createSessionToken,
  sessionCookieOptions,
  validateAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email || "");
  const password = String(body.password || "");

  try {
    if (!(await validateAdminCredentials(email, password))) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const token = createSessionToken(email);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Login failed.";
    return NextResponse.json(
      {
        ok: false,
        error: /ADMIN_|AUTH_SESSION|credentials/i.test(msg)
          ? "Admin login is not configured on the server. Set ADMIN_EMAIL and ADMIN_PASSWORD in Vercel Environment Variables, then Redeploy."
          : "Unable to sign in. Please try again.",
      },
      { status: 503 },
    );
  }
}
