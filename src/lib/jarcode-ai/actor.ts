import { getAdminSessionEmail, isAdminAuthenticated } from "@/lib/admin-auth";
import { getClientSession } from "@/lib/client-auth";
import type { ClientPublic } from "@/lib/clients/types";
import type { DemoProduct } from "@/lib/demos/types";

export type AiActor =
  | { role: "public"; label: "Public Visitor"; id: "public" }
  | { role: "admin"; label: "Administrator"; id: string; email: string }
  | {
      role: "hospital_client" | "society_client";
      label: string;
      id: string;
      tenantId: string;
      erp: DemoProduct;
      client: ClientPublic;
    };

export async function resolveAiActor(): Promise<AiActor> {
  if (await isAdminAuthenticated()) {
    const email = (await getAdminSessionEmail()) || "admin";
    return { role: "admin", label: "Administrator", id: email, email };
  }

  const client = await getClientSession();
  if (client) {
    if (client.erp === "hospital") {
      return {
        role: "hospital_client",
        label: client.name,
        id: client.id,
        tenantId: client.tenantId,
        erp: "hospital",
        client,
      };
    }
    return {
      role: "society_client",
      label: client.name,
      id: client.id,
      tenantId: client.tenantId,
      erp: "society",
      client,
    };
  }

  return { role: "public", label: "Public Visitor", id: "public" };
}

export function usageSubject(actor: AiActor) {
  if (actor.role === "admin") return `admin:${actor.id}`;
  if (actor.role === "public") return "public";
  return `client:${actor.tenantId}`;
}
