import { NextResponse } from "next/server";
import { getCollections, isValidCollection } from "@/config/demos";
import { rateLimit } from "@/lib/demos/rate-limit";
import { createDemoRecord } from "@/lib/demos/store";
import type { DemoProduct } from "@/lib/demos/types";

function isProduct(value: string): value is DemoProduct {
  return value === "society" || value === "hospital";
}

function sanitize(
  product: DemoProduct,
  collection: string,
  body: Record<string, unknown>,
) {
  const def = getCollections(product).find((item) => item.id === collection);
  if (!def) return null;

  const data: Record<string, string> = {};
  for (const field of def.fields) {
    const value = String(body[field.key] ?? "").trim();
    if (field.required && !value) {
      return { error: `${field.label} is required.` };
    }
    if (value.length > 2000) {
      return { error: `${field.label} is too long.` };
    }
    data[field.key] = value;
  }
  return { data };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ product: string; collection: string }> },
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local";
  const limited = rateLimit(`demo-write:${ip}`, 40, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please wait." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const { product, collection } = await context.params;
  if (!isProduct(product) || !isValidCollection(product, collection)) {
    return NextResponse.json({ ok: false, error: "Invalid demo path." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const cleaned = sanitize(product, collection, body);
  if (!cleaned || "error" in cleaned) {
    return NextResponse.json(
      { ok: false, error: cleaned?.error || "Invalid data." },
      { status: 400 },
    );
  }

  const record = await createDemoRecord(product, collection, cleaned.data);
  return NextResponse.json({ ok: true, record });
}
