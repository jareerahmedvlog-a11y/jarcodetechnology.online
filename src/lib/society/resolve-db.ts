import { getClientSession } from "@/lib/client-auth";
import type { DemoDatabase } from "@/lib/demos/types";
import {
  createDemoRecord,
  deleteDemoRecord,
  getDemoDatabase,
  updateDemoRecord,
} from "@/lib/demos/store";
import {
  createTenantRecord,
  deleteTenantRecord,
  getTenantDatabase,
  updateTenantRecord,
} from "@/lib/tenants/store";

export type SocietyDbContext =
  | { mode: "public"; tenantId?: undefined }
  | { mode: "tenant"; tenantId: string };

export async function resolveSocietyContext(): Promise<SocietyDbContext> {
  const client = await getClientSession();
  if (client && client.erp === "society" && client.status === "active") {
    return { mode: "tenant", tenantId: client.tenantId };
  }
  return { mode: "public" };
}

export async function loadSocietyDb(ctx: SocietyDbContext): Promise<DemoDatabase> {
  if (ctx.mode === "tenant") {
    return getTenantDatabase(ctx.tenantId, "society");
  }
  return getDemoDatabase("society");
}

export async function societyCreate(
  ctx: SocietyDbContext,
  collection: string,
  data: Record<string, string>,
) {
  if (ctx.mode === "tenant") {
    return createTenantRecord(ctx.tenantId, "society", collection, data);
  }
  return createDemoRecord("society", collection, data);
}

export async function societyUpdate(
  ctx: SocietyDbContext,
  collection: string,
  id: string,
  data: Record<string, string>,
) {
  if (ctx.mode === "tenant") {
    return updateTenantRecord(ctx.tenantId, "society", collection, id, data);
  }
  return updateDemoRecord("society", collection, id, data);
}

export async function societyDelete(
  ctx: SocietyDbContext,
  collection: string,
  id: string,
) {
  if (ctx.mode === "tenant") {
    return deleteTenantRecord(ctx.tenantId, "society", collection, id);
  }
  return deleteDemoRecord("society", collection, id);
}
