import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { resetAllDemos, resetDemoDatabase } from "@/lib/demos/store";
import type { DemoProduct } from "@/lib/demos/types";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let product: DemoProduct | "all" = "all";
  try {
    const body = (await request.json()) as { product?: string };
    if (body.product === "society" || body.product === "hospital") {
      product = body.product;
    } else if (body.product && body.product !== "all") {
      return NextResponse.json({ ok: false, error: "Invalid product." }, { status: 400 });
    }
  } catch {
    // default all
  }

  if (product === "all") {
    const data = await resetAllDemos();
    return NextResponse.json({ ok: true, data });
  }

  const data = await resetDemoDatabase(product);
  return NextResponse.json({ ok: true, product, data });
}
