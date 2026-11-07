import { hospitalCollections } from "@/config/demos";
import type { DemoDatabase, DemoRecord } from "@/lib/demos/types";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseAmount(value: unknown) {
  const n = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function summarizeCollection(id: string, rows: DemoRecord[]) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const base = {
    module: id,
    count: safeRows.length,
    records: safeRows.map((row) => {
      const { id: _id, createdAt, updatedAt, ...fields } = row;
      return fields;
    }),
  };

  if (id === "appointments") {
    const today = todayIsoDate();
    const todayRows = safeRows.filter((row) => String(row.date || "") === today);
    return {
      ...base,
      todayCount: todayRows.length,
      todayAppointments: todayRows.map((row) => ({
        patient: row.patient,
        doctor: row.doctor,
        date: row.date,
        time: row.time,
        status: row.status,
      })),
      byStatus: countBy(safeRows, "status"),
    };
  }

  if (id === "admissions") {
    const admitted = safeRows.filter(
      (row) => String(row.status || "").toLowerCase() === "admitted",
    );
    return {
      ...base,
      currentlyAdmitted: admitted.length,
      admittedPatients: admitted.map((row) => ({
        patient: row.patient,
        ward: row.ward,
        doctor: row.doctor,
        admitDate: row.admitDate,
        status: row.status,
      })),
      byStatus: countBy(safeRows, "status"),
    };
  }

  if (id === "billing") {
    const total = safeRows.reduce((sum, row) => sum + parseAmount(row.amount), 0);
    const paid = safeRows
      .filter((row) => String(row.status || "").toLowerCase() === "paid")
      .reduce((sum, row) => sum + parseAmount(row.amount), 0);
    return {
      ...base,
      totalBillingAmount: total,
      paidAmount: paid,
      unpaidOrPartialAmount: total - paid,
      byStatus: countBy(safeRows, "status"),
    };
  }

  if (id === "pharmacy") {
    return {
      ...base,
      medicines: safeRows.map((row) => ({
        medicine: row.medicine,
        sku: row.sku,
        quantity: row.quantity,
        expiry: row.expiry,
        status: row.status,
      })),
      byStatus: countBy(safeRows, "status"),
    };
  }

  if (id === "departments") {
    return {
      ...base,
      departments: safeRows.map((row) => ({
        name: row.name,
        head: row.head,
        floor: row.floor,
        beds: row.beds,
        status: row.status,
      })),
    };
  }

  if (id === "patients") {
    return {
      ...base,
      byGender: countBy(safeRows, "gender"),
    };
  }

  if (id === "doctors") {
    return {
      ...base,
      bySpecialty: countBy(safeRows, "specialty"),
      byStatus: countBy(safeRows, "status"),
    };
  }

  if (id === "opd") {
    return {
      ...base,
      byStatus: countBy(safeRows, "status"),
    };
  }

  return base;
}

function countBy(rows: DemoRecord[], key: string) {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const label = String(row[key] || "Unknown");
    out[label] = (out[label] || 0) + 1;
  }
  return out;
}

/** Build a read-only Hospital Demo snapshot for the AI (no secrets). */
export function buildHospitalAiContext(db: DemoDatabase) {
  const modules: Record<string, ReturnType<typeof summarizeCollection>> = {};
  for (const collection of hospitalCollections) {
    modules[collection.id] = summarizeCollection(
      collection.id,
      db[collection.id] || [],
    );
  }

  const patients = db.patients || [];
  const appointments = db.appointments || [];
  const admissions = db.admissions || [];
  const billing = db.billing || [];

  return {
    environment: "JARCODE TECHNOLOGY — Public Hospital Management Demo",
    access: "READ_ONLY",
    generatedAt: new Date().toISOString(),
    today: todayIsoDate(),
    quickStats: {
      registeredPatients: patients.length,
      doctors: (db.doctors || []).length,
      appointmentsTotal: appointments.length,
      appointmentsToday: appointments.filter(
        (row) => String(row.date || "") === todayIsoDate(),
      ).length,
      currentlyAdmitted: admissions.filter(
        (row) => String(row.status || "").toLowerCase() === "admitted",
      ).length,
      totalBillingAmount: billing.reduce(
        (sum, row) => sum + parseAmount(row.amount),
        0,
      ),
      pharmacyItems: (db.pharmacy || []).length,
      departments: (db.departments || []).length,
      opdVisits: (db.opd || []).length,
      reports: (db.reports || []).length,
    },
    modules,
  };
}

export const HOSPITAL_AI_SYSTEM_PROMPT = `You are the JARCODE TECHNOLOGY Hospital Management AI Assistant for a PUBLIC SHARED DEMO.

Rules you must follow:
1. Answer ONLY using the Hospital Demo database snapshot provided in the user message.
2. If the snapshot does not contain enough data, say you do not have that information in the demo database. Do not invent patients, doctors, medicines, amounts, or appointments.
3. This is a demonstration with fictional sample data. Remind users not to enter real medical or personal information when relevant.
4. You have READ-ONLY access. Never claim you created, updated, or deleted records. Never offer to change the database.
5. Do not discuss Society Management. Do not reveal API keys, env vars, credentials, file paths, or system internals.
6. Be concise, professional, and helpful. Prefer short bullet points for lists and clear numbers for counts/totals.
7. When asked about "today", use the "today" date field from the snapshot.
8. Currency amounts can be shown as plain numbers from the demo (assume local currency units unless labeled).`;
