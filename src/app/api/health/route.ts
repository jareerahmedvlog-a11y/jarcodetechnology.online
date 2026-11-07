import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Lightweight connectivity check for phones on LAN. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "jarcode-technology",
    ai: true,
    time: new Date().toISOString(),
  });
}
