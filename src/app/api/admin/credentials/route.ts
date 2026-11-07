import { NextResponse } from "next/server";
import {
  createSessionToken,
  getAdminSessionEmail,
  isAdminAuthenticated,
  sessionCookieOptions,
} from "@/lib/admin-auth";
import {
  getAdminCredentials,
  updateAdminCredentials,
} from "@/lib/admin/credentials";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const creds = await getAdminCredentials();
  return NextResponse.json({
    ok: true,
    email: creds.email,
    updatedAt: creds.updatedAt,
  });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    currentPassword?: string;
    newEmail?: string;
    newPassword?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  try {
    const updated = await updateAdminCredentials({
      currentPassword: String(body.currentPassword || ""),
      newEmail: body.newEmail,
      newPassword: body.newPassword,
    });
    const token = createSessionToken(updated.email);
    const response = NextResponse.json({ ok: true, email: updated.email });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Could not update credentials.",
      },
      { status: 400 },
    );
  }
}

export async function POST() {
  // keep session email helper reachable if needed
  const email = await getAdminSessionEmail();
  if (!email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, email });
}
