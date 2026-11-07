import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteInquiry } from "@/lib/inquiries";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
  }

  const removed = await deleteInquiry(id);
  if (!removed) {
    return NextResponse.json({ ok: false, error: "Inquiry not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
