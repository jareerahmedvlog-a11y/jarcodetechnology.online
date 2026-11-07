import { randomInt } from "crypto";
import type { DemoDatabase, DemoRecord } from "@/lib/demos/types";

export function generateEntryCode(existing?: Iterable<string>) {
  // JAR-###### — crypto random, not sequential
  const taken = new Set(
    [...(existing || [])].map((c) => String(c || "").toUpperCase()).filter(Boolean),
  );
  for (let i = 0; i < 40; i++) {
    const code = `JAR-${randomInt(100000, 999999)}`;
    if (!taken.has(code)) return code;
  }
  return `JAR-${randomInt(100000, 999999)}-${randomInt(10, 99)}`;
}

export function defaultCodeExpiry(expectedDate?: string, expectedArrival?: string) {
  // Expire end of expected visit day, or +12h from now
  const base = expectedDate ? new Date(`${expectedDate}T23:59:59`) : new Date();
  if (!expectedDate) base.setHours(base.getHours() + 12);
  if (expectedArrival && expectedDate) {
    // keep end-of-day expiry for simplicity
  }
  return base.toISOString();
}

export function visitorStats(db: DemoDatabase) {
  const visitors = db.visitors || [];
  const walkIns = db.walkIns || [];
  const today = new Date().toISOString().slice(0, 10);

  const isToday = (iso?: string) =>
    Boolean(iso && String(iso).slice(0, 10) === today);

  const todayVisitors = visitors.filter(
    (v) => v.expectedDate === today || isToday(v.checkedInAt) || isToday(v.createdAt),
  );

  return {
    totalToday: todayVisitors.length,
    expected: visitors.filter(
      (v) =>
        v.expectedDate === today &&
        ["Pending", "Approved"].includes(String(v.status || "")),
    ).length,
    currentlyInside: visitors.filter((v) => v.status === "Checked In").length,
    checkedOut: visitors.filter(
      (v) => v.status === "Checked Out" && isToday(v.checkedOutAt),
    ).length,
    pendingApprovals:
      visitors.filter((v) => v.status === "Pending").length +
      walkIns.filter((v) => v.approvalStatus === "Pending Approval").length,
    rejected: visitors.filter((v) => v.status === "Rejected").length,
    expired: visitors.filter((v) => v.status === "Expired").length,
  };
}

export function financeStats(db: DemoDatabase) {
  const bills = db.bills || [];
  const payments = db.payments || [];
  const num = (v: unknown) => {
    const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const totalBilling = bills.reduce((s, b) => s + num(b.amount), 0);
  const totalPaid = payments.reduce((s, p) => s + num(p.amount), 0);
  const outstanding = bills
    .filter((b) => ["Pending", "Partial", "Overdue"].includes(String(b.status)))
    .reduce((s, b) => s + num(b.amount), 0);
  const overdue = bills
    .filter((b) => b.status === "Overdue")
    .reduce((s, b) => s + num(b.amount), 0);

  return { totalBilling, totalPaid, outstanding, overdue, invoiceCount: bills.length };
}

export type VerifyResult =
  | { ok: true; visitor: DemoRecord }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "EXPIRED"
        | "USED"
        | "CANCELLED"
        | "ALREADY_CONFIRMED"
        | "INVALID";
      message: string;
    };

export function findVisitorByCode(db: DemoDatabase, code: string): DemoRecord | null {
  const normalized = code.trim().toUpperCase();
  return (
    (db.visitors || []).find(
      (v) => String(v.entryCode || "").toUpperCase() === normalized,
    ) || null
  );
}

export function verifyEntryCode(db: DemoDatabase, code: string): VerifyResult {
  const visitor = findVisitorByCode(db, code);
  if (!visitor) {
    return { ok: false, code: "NOT_FOUND", message: "INVALID ENTRY CODE" };
  }

  const status = String(visitor.status || "");
  if (status === "Cancelled") {
    return { ok: false, code: "CANCELLED", message: "Visit Cancelled" };
  }
  if (status === "Checked Out") {
    return { ok: false, code: "USED", message: "Code Already Used" };
  }
  if (status === "Checked In") {
    return {
      ok: false,
      code: "ALREADY_CONFIRMED",
      message: "Entry Already Confirmed",
    };
  }
  if (status === "Expired" || status === "Rejected") {
    return {
      ok: false,
      code: status === "Expired" ? "EXPIRED" : "INVALID",
      message: status === "Expired" ? "Code Expired" : "INVALID ENTRY CODE",
    };
  }

  const expires = visitor.codeExpiresAt
    ? new Date(String(visitor.codeExpiresAt)).getTime()
    : NaN;
  if (Number.isFinite(expires) && Date.now() > expires) {
    return { ok: false, code: "EXPIRED", message: "Code Expired" };
  }

  if (!["Pending", "Approved"].includes(status)) {
    return { ok: false, code: "INVALID", message: "INVALID ENTRY CODE" };
  }

  return { ok: true, visitor };
}

export function societyDashboardStats(db: DemoDatabase) {
  const v = visitorStats(db);
  const f = financeStats(db);
  return {
    totalProperties: (db.houses || []).length,
    registeredResidents: (db.residents || []).length,
    visitorsToday: v.totalToday,
    visitorsInside: v.currentlyInside,
    pendingVisitorApprovals: v.pendingApprovals,
    monthlyCollection: f.totalPaid,
    outstandingPayments: f.outstanding,
    openComplaints: (db.complaints || []).filter((c) =>
      ["New", "Assigned", "In Progress"].includes(String(c.status)),
    ).length,
    maintenanceRequests: (db.maintenance || []).filter((m) =>
      ["Open", "Scheduled", "In Progress"].includes(String(m.status)),
    ).length,
    registeredVehicles: (db.parking || []).length,
    finance: f,
    visitors: v,
  };
}
