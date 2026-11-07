import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAiUsageSummary, setMonthlyBudgetOverride } from "@/lib/jarcode-ai/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  const summary = await getAiUsageSummary();
  return Response.json({ ok: true, summary });
}

export async function PUT(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  let body: { monthlyBudgetUsd?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  const usd = Number(body.monthlyBudgetUsd);
  if (!Number.isFinite(usd) || usd < 1 || usd > 10000) {
    return Response.json(
      { ok: false, error: "monthlyBudgetUsd must be between 1 and 10000." },
      { status: 400 },
    );
  }
  const summary = await setMonthlyBudgetOverride(usd);
  return Response.json({ ok: true, summary });
}
