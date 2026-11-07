import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/demos/rate-limit";
import { getDemoDatabase } from "@/lib/demos/store";
import type { DemoProduct } from "@/lib/demos/types";

function isProduct(value: string): value is DemoProduct {
  return value === "society" || value === "hospital";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ product: string }> },
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";
  const limited = rateLimit(`demo-get:${ip}`, 240, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please wait." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const { product } = await context.params;
  if (!isProduct(product)) {
    return NextResponse.json({ ok: false, error: "Unknown demo." }, { status: 404 });
  }

  const data = await getDemoDatabase(product);
  return NextResponse.json({
    ok: true,
    product,
    data,
    updatedAt: new Date().toISOString(),
  });
}
