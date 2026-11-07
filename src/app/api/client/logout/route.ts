import { NextResponse } from "next/server";
import { clearClientSessionCookieOptions } from "@/lib/client-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearClientSessionCookieOptions());
  return response;
}
