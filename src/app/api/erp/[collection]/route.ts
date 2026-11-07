import { NextResponse } from "next/server";
import { isValidCollection } from "@/config/demos";
import { getClientSession } from "@/lib/client-auth";
import { rateLimit } from "@/lib/demos/rate-limit";
import { createTenantRecord } from "@/lib/tenants/store";

type Params = { params: Promise<{ collection: string }> };

export async function POST(request: Request, { params }: Params) {
  const client = await getClientSession();
  if (!client) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`erp-write:${client.id}`, 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: `Too many writes. Retry in ${limited.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const { collection } = await params;
  if (!isValidCollection(client.erp, collection)) {
    return NextResponse.json({ ok: false, error: "Invalid collection." }, { status: 400 });
  }

  let body: Record<string, string>;
  try {
    body = (await request.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "id" || key === "createdAt" || key === "updatedAt") continue;
    data[key] = String(value ?? "");
  }

  const record = await createTenantRecord(
    client.tenantId,
    client.erp,
    collection,
    data,
  );
  return NextResponse.json({ ok: true, record });
}
