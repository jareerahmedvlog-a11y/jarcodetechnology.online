import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/demos/rate-limit";
import {
  defaultCodeExpiry,
  generateEntryCode,
  verifyEntryCode,
  visitorStats,
} from "@/lib/society/visitors";
import {
  loadSocietyDb,
  resolveSocietyContext,
  societyCreate,
  societyUpdate,
} from "@/lib/society/resolve-db";

function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon"
  );
}

export async function GET() {
  const ctx = await resolveSocietyContext();
  const db = await loadSocietyDb(ctx);
  return NextResponse.json({
    ok: true,
    mode: ctx.mode,
    stats: visitorStats(db),
    visitors: db.visitors || [],
    walkIns: db.walkIns || [],
  });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit(`society-visitors:${ip}`, 40, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: `Too many requests. Retry in ${limited.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  let body: {
    action?: string;
    id?: string;
    code?: string;
    guardId?: string;
    data?: Record<string, string>;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const ctx = await resolveSocietyContext();
  const action = String(body.action || "");

  try {
    if (action === "register") {
      const data = { ...(body.data || {}) };
      const db = await loadSocietyDb(ctx);
      const code = generateEntryCode((db.visitors || []).map((v) => String(v.entryCode || "")));
      data.entryCode = code;
      data.codeExpiresAt = defaultCodeExpiry(
        data.expectedDate,
        data.expectedArrival,
      );
      if (!data.status) data.status = "Approved";
      const record = await societyCreate(ctx, "visitors", data);
      return NextResponse.json({
        ok: true,
        record,
        entryCode: code,
        message: "Visitor registered. Entry code generated.",
      });
    }

    if (action === "generate-code") {
      const id = String(body.id || "");
      if (!id) {
        return NextResponse.json({ ok: false, error: "Visitor id required." }, { status: 400 });
      }
      const db = await loadSocietyDb(ctx);
      const existing = (db.visitors || []).find((v) => v.id === id);
      if (!existing) {
        return NextResponse.json({ ok: false, error: "Visitor not found." }, { status: 404 });
      }
      const code = generateEntryCode(
        (db.visitors || [])
          .filter((v) => v.id !== id)
          .map((v) => String(v.entryCode || "")),
      );
      const record = await societyUpdate(ctx, "visitors", id, {
        entryCode: code,
        codeExpiresAt: defaultCodeExpiry(
          String(existing.expectedDate || ""),
          String(existing.expectedArrival || ""),
        ),
        status:
          existing.status === "Checked In" || existing.status === "Checked Out"
            ? String(existing.status)
            : "Approved",
      });
      return NextResponse.json({ ok: true, record, entryCode: code });
    }

    if (action === "verify") {
      const verifyLimit = rateLimit(`society-verify:${ip}`, 30, 60_000);
      if (!verifyLimit.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: `Too many verification attempts. Retry in ${verifyLimit.retryAfterSec}s.`,
          },
          { status: 429 },
        );
      }
      const db = await loadSocietyDb(ctx);
      const result = verifyEntryCode(db, String(body.code || ""));
      if (!result.ok) {
        return NextResponse.json({
          ok: false,
          code: result.code,
          error: result.message,
        });
      }
      return NextResponse.json({
        ok: true,
        message: "SUCCESSFULLY VERIFIED",
        visitor: {
          id: result.visitor.id,
          visitorName: result.visitor.visitorName,
          residentName: result.visitor.residentName,
          houseNo: result.visitor.houseNo,
          purpose: result.visitor.purpose,
          mobile: result.visitor.mobile,
          expectedDate: result.visitor.expectedDate,
          expectedArrival: result.visitor.expectedArrival,
          vehicle: result.visitor.vehicle,
          entryCode: result.visitor.entryCode,
          status: result.visitor.status,
        },
      });
    }

    if (action === "confirm-entry") {
      const id = String(body.id || "");
      const guardId = String(body.guardId || "gate-guard").trim() || "gate-guard";
      const db = await loadSocietyDb(ctx);
      const existing = (db.visitors || []).find((v) => v.id === id);
      if (!existing) {
        return NextResponse.json({ ok: false, error: "Visitor not found." }, { status: 404 });
      }
      if (existing.status === "Checked In") {
        return NextResponse.json({
          ok: false,
          error: "Entry Already Confirmed",
        });
      }
      const verify = verifyEntryCode(db, String(existing.entryCode || ""));
      if (!verify.ok) {
        return NextResponse.json({ ok: false, error: verify.message });
      }
      const now = new Date().toISOString();
      const record = await societyUpdate(ctx, "visitors", id, {
        status: "Checked In",
        checkedInAt: now,
        guardId,
      });
      return NextResponse.json({
        ok: true,
        record,
        message: "Visitor checked in.",
      });
    }

    if (action === "mark-exit") {
      const id = String(body.id || "");
      const guardId = String(body.guardId || "gate-guard").trim() || "gate-guard";
      const db = await loadSocietyDb(ctx);
      const existing = (db.visitors || []).find((v) => v.id === id);
      if (!existing) {
        return NextResponse.json({ ok: false, error: "Visitor not found." }, { status: 404 });
      }
      if (existing.status !== "Checked In") {
        return NextResponse.json({
          ok: false,
          error: "Visitor is not currently checked in.",
        });
      }
      const now = new Date();
      const inAt = existing.checkedInAt
        ? new Date(String(existing.checkedInAt)).getTime()
        : now.getTime();
      const durationMinutes = String(
        Math.max(1, Math.round((now.getTime() - inAt) / 60000)),
      );
      const record = await societyUpdate(ctx, "visitors", id, {
        status: "Checked Out",
        checkedOutAt: now.toISOString(),
        guardId,
        durationMinutes,
      });
      return NextResponse.json({
        ok: true,
        record,
        message: "Visitor checked out.",
      });
    }

    if (action === "revoke") {
      const id = String(body.id || "");
      const record = await societyUpdate(ctx, "visitors", id, {
        status: "Cancelled",
      });
      if (!record) {
        return NextResponse.json({ ok: false, error: "Visitor not found." }, { status: 404 });
      }
      return NextResponse.json({ ok: true, record, message: "Entry code revoked." });
    }

    if (action === "walk-in") {
      const data = { ...(body.data || {}) };
      if (!data.approvalStatus) data.approvalStatus = "Pending Approval";
      const record = await societyCreate(ctx, "walkIns", data);
      return NextResponse.json({ ok: true, record });
    }

    if (action === "approve-walk-in") {
      const id = String(body.id || "");
      const guardId = String(body.guardId || "office-admin");
      const db = await loadSocietyDb(ctx);
      const walk = (db.walkIns || []).find((v) => v.id === id);
      if (!walk) {
        return NextResponse.json({ ok: false, error: "Walk-in not found." }, { status: 404 });
      }
      const now = new Date().toISOString();
      const walkRecord = await societyUpdate(ctx, "walkIns", id, {
        approvalStatus: "Approved",
        approvedBy: guardId,
        enteredAt: now,
      });
      // Convert approved walk-in into a checked-in visitor history row
      const visitor = await societyCreate(ctx, "visitors", {
        visitorName: String(walk.visitorName || ""),
        mobile: String(walk.mobile || ""),
        purpose: String(walk.purpose || "Unexpected visit"),
        residentName: String(walk.residentName || "Resident"),
        houseNo: String(walk.houseNo || ""),
        category: "Other",
        expectedDate: now.slice(0, 10),
        expectedArrival: now.slice(11, 16),
        expectedDeparture: "",
        vehicle: "",
        status: "Checked In",
        entryCode: "",
        codeExpiresAt: "",
        checkedInAt: now,
        guardId,
        extraNote: "Walk-in visitor — approved at gate.",
      });
      return NextResponse.json({
        ok: true,
        record: walkRecord,
        visitor,
        message: "Walk-in approved and checked in.",
      });
    }

    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Visitor action failed.",
      },
      { status: 500 },
    );
  }
}
