import { NextResponse } from "next/server";
import { adminCredentialsConfigured } from "@/lib/admin/credentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Safe diagnostics — does not reveal the password. */
export async function GET() {
  const info = adminCredentialsConfigured();
  return NextResponse.json({
    ok: true,
    emailConfigured: info.emailConfigured,
    passwordConfigured: info.passwordConfigured,
    passwordLength: info.passwordLength,
    emailMasked: info.emailMasked,
    ready: info.emailConfigured && info.passwordConfigured && info.passwordLength >= 8,
  });
}
