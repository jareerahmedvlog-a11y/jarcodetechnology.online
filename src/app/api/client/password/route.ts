import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/client-auth";
import { changeClientPassword } from "@/lib/clients/store";

export async function PUT(request: Request) {
  const session = await getClientSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  try {
    const client = await changeClientPassword(
      session.id,
      String(body.currentPassword || ""),
      String(body.newPassword || ""),
    );
    return NextResponse.json({
      ok: true,
      client: {
        id: client.id,
        email: client.email,
        mustChangePassword: client.mustChangePassword,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Could not change password.",
      },
      { status: 400 },
    );
  }
}
