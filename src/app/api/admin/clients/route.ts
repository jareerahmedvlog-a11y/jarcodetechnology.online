import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createClient, listClients } from "@/lib/clients/store";
import type { DemoProduct } from "@/lib/demos/types";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const clients = await listClients();
  return NextResponse.json({ ok: true, clients });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    email?: string;
    phone?: string;
    erp?: DemoProduct;
    password?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await createClient({
      name: String(body.name || ""),
      email: String(body.email || ""),
      phone: String(body.phone || ""),
      erp: body.erp as DemoProduct,
      password: body.password,
    });
    return NextResponse.json({
      ok: true,
      client: result.client,
      temporaryPassword: result.temporaryPassword,
      message:
        "Client ERP system created. Share the temporary password securely with the client.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Could not create client.",
      },
      { status: 400 },
    );
  }
}
