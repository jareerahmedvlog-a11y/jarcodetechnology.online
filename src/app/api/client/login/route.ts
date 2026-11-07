import { NextResponse } from "next/server";
import {
  clientSessionCookieOptions,
  createClientSessionToken,
} from "@/lib/client-auth";
import { authenticateClient } from "@/lib/clients/store";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const client = await authenticateClient(
    String(body.email || ""),
    String(body.password || ""),
  );
  if (!client) {
    return NextResponse.json(
      { ok: false, error: "Invalid email or password, or account is not active." },
      { status: 401 },
    );
  }

  const token = createClientSessionToken(client);
  const response = NextResponse.json({
    ok: true,
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      erp: client.erp,
      mustChangePassword: client.mustChangePassword,
    },
    redirectTo: "/erp",
  });
  response.cookies.set(clientSessionCookieOptions(token));
  return response;
}
