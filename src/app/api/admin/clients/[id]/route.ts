import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  deleteClient,
  getClientById,
  resetClientPassword,
  updateClient,
} from "@/lib/clients/store";
import type { ClientStatus } from "@/lib/clients/types";
import type { DemoProduct } from "@/lib/demos/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) {
    return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
  }
  const { passwordHash: _p, ...publicClient } = client;
  return NextResponse.json({ ok: true, client: publicClient });
}

export async function PUT(request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    erp?: DemoProduct;
    status?: ClientStatus;
    action?: "reset-password" | "update";
    password?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  try {
    if (body.action === "reset-password") {
      const result = await resetClientPassword(id, body.password);
      if (!result) {
        return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
      }
      return NextResponse.json({
        ok: true,
        client: result.client,
        temporaryPassword: result.temporaryPassword,
      });
    }

    const client = await updateClient(id, {
      name: body.name,
      email: body.email,
      phone: body.phone,
      erp: body.erp,
      status: body.status,
    });
    if (!client) {
      return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, client });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Update failed.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteClient(id);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Client not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
