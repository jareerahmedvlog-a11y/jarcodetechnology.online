import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { getTenantDatabase } from "@/lib/tenants/store";

export async function GET() {
  const client = await getClientSession();
  if (!client) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const data = await getTenantDatabase(client.tenantId, client.erp);
  return NextResponse.json({
    ok: true,
    product: client.erp,
    tenantId: client.tenantId,
    data,
  });
}
