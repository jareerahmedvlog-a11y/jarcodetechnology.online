import { buildHospitalAiContext } from "@/lib/hospital-ai/context";
import type { AiActor } from "@/lib/jarcode-ai/actor";
import { PUBLIC_SYSTEM_RULES, buildWebsiteKnowledge } from "@/lib/jarcode-ai/knowledge";
import { listClients } from "@/lib/clients/store";
import { getDemoDatabase } from "@/lib/demos/store";
import { getTenantDatabase } from "@/lib/tenants/store";
import { getAiUsageSummary } from "@/lib/jarcode-ai/usage";
import { societyDashboardStats, visitorStats, financeStats } from "@/lib/society/visitors";
import type { DemoDatabase } from "@/lib/demos/types";

function summarizeSociety(db: DemoDatabase) {
  return {
    dashboard: societyDashboardStats(db),
    visitors: visitorStats(db),
    finance: financeStats(db),
    counts: {
      societyInfo: (db.societyInfo || []).length,
      blocks: (db.blocks || []).length,
      houses: (db.houses || []).length,
      residents: (db.residents || []).length,
      visitors: (db.visitors || []).length,
      walkIns: (db.walkIns || []).length,
      bills: (db.bills || []).length,
      payments: (db.payments || []).length,
      complaints: (db.complaints || []).length,
      maintenance: (db.maintenance || []).length,
      parking: (db.parking || []).length,
      deliveries: (db.deliveries || []).length,
      notices: (db.notices || []).length,
    },
  };
}

export async function buildActorSystemPrompt(actor: AiActor) {
  const knowledge = buildWebsiteKnowledge();
  const parts: string[] = [
    PUBLIC_SYSTEM_RULES,
    `Current user role: ${actor.role} (${actor.label}).`,
    `Website knowledge JSON:\n${JSON.stringify(knowledge)}`,
  ];

  if (actor.role === "public") {
    parts.push(
      "Public mode: answer website/demo questions only. Refuse any request for private ERP records, client lists, passwords, or tenant data.",
    );
  }

  if (actor.role === "admin") {
    const clients = await listClients();
    const usage = await getAiUsageSummary();
    parts.push(
      "Admin mode: you may summarize client account metadata and AI usage. Never reveal password hashes or session secrets.",
      `Client accounts (public fields):\n${JSON.stringify(
        clients.map((c) => ({
          name: c.name,
          email: c.email,
          phone: c.phone,
          erp: c.erp,
          status: c.status,
          tenantId: c.tenantId,
          createdAt: c.createdAt,
          lastLoginAt: c.lastLoginAt,
        })),
      )}`,
      `AI usage summary:\n${JSON.stringify({
        month: usage.month,
        totalChatRequests: usage.totalChatRequests,
        totalVoiceSessions: usage.totalVoiceSessions,
        estimatedApiCostUsd: usage.estimatedApiCostUsd,
        monthlyBudgetUsd: usage.monthlyBudgetUsd,
        budgetUsedPercent: usage.budgetUsedPercent,
        alerts: usage.alerts,
      })}`,
    );
  }

  if (actor.role === "hospital_client") {
    const db = await getTenantDatabase(actor.tenantId, "hospital");
    parts.push(
      "Hospital client mode: answer ONLY from this client's hospital ERP snapshot. Never access society data or other tenants.",
      `Authorized hospital ERP snapshot:\n${JSON.stringify(buildHospitalAiContext(db))}`,
    );
  }

  if (actor.role === "society_client") {
    const db = await getTenantDatabase(actor.tenantId, "society");
    parts.push(
      "Society client mode: answer ONLY from this client's society ERP snapshot. Never access hospital data or other tenants.",
      `Authorized society ERP snapshot:\n${JSON.stringify(summarizeSociety(db))}`,
    );
  }

  // Public demos may be discussed at high level; only include demo stats for public/admin
  if (actor.role === "public" || actor.role === "admin") {
    const hospitalDemo = await getDemoDatabase("hospital");
    const societyDemo = await getDemoDatabase("society");
    parts.push(
      `Public Hospital demo summary (fictional shared demo):\n${JSON.stringify({
        patients: (hospitalDemo.patients || []).length,
        appointments: (hospitalDemo.appointments || []).length,
        doctors: (hospitalDemo.doctors || []).length,
      })}`,
      `Public Society demo summary (fictional shared demo):\n${JSON.stringify(summarizeSociety(societyDemo).counts)}`,
      "Remind users the public demos are fictional and shared — do not enter real personal data.",
    );
  }

  return parts.join("\n\n");
}
