import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";

export async function GET() {
  const client = await getClientSession();
  if (!client) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      erp: client.erp,
      tenantId: client.tenantId,
      mustChangePassword: client.mustChangePassword,
      status: client.status,
    },
  });
}
