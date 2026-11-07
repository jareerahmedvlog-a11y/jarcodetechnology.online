import type { AiActor } from "@/lib/jarcode-ai/actor";
import { getDemoDatabase } from "@/lib/demos/store";
import { getTenantDatabase } from "@/lib/tenants/store";
import { listClients } from "@/lib/clients/store";
import { isValidCollection } from "@/config/demos";
import type { DemoProduct } from "@/lib/demos/types";

export const chatTools = [
  {
    type: "function" as const,
    function: {
      name: "open_page",
      description: "Suggest opening a JARCODE website page or demo for the user.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Site path such as /create-your-demo/hospital or /#services",
          },
          reason: { type: "string" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_authorized_records",
      description:
        "Search records the current user is authorized to see. Public users may only search public demo summaries.",
      parameters: {
        type: "object",
        properties: {
          collection: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
        required: ["collection"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "request_sensitive_action",
      description:
        "Request confirmation for a sensitive ERP action. Does NOT execute create/edit/delete/password/billing changes.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [
              "create_record",
              "edit_record",
              "delete_record",
              "change_password",
              "create_client",
              "change_billing",
            ],
          },
          details: { type: "string" },
        },
        required: ["action", "details"],
      },
    },
  },
];

const ALLOWED_PATHS = new Set([
  "/",
  "/#home",
  "/#about",
  "/#services",
  "/#work",
  "/#achievements",
  "/#founder",
  "/#contact",
  "/create-your-demo",
  "/create-your-demo/hospital",
  "/create-your-demo/society",
  "/create-your-demo/builder",
  "/login",
  "/erp",
  "/admin",
  "/privacy",
  "/terms",
]);

function sanitizePath(path: string) {
  const p = String(path || "").trim();
  if (!p.startsWith("/")) return null;
  if (p.includes("..") || p.includes("//")) return null;
  if (ALLOWED_PATHS.has(p)) return p;
  // allow hash variants already listed; block unknown admin APIs
  if (p.startsWith("/#") && p.length < 40) return p;
  return null;
}

async function loadAuthorizedDb(
  actor: AiActor,
  productHint?: DemoProduct,
): Promise<{ product: DemoProduct; db: Awaited<ReturnType<typeof getDemoDatabase>> } | null> {
  if (actor.role === "hospital_client") {
    return {
      product: "hospital",
      db: await getTenantDatabase(actor.tenantId, "hospital"),
    };
  }
  if (actor.role === "society_client") {
    return {
      product: "society",
      db: await getTenantDatabase(actor.tenantId, "society"),
    };
  }
  if (actor.role === "admin" || actor.role === "public") {
    const product: DemoProduct = productHint === "society" ? "society" : "hospital";
    return { product, db: await getDemoDatabase(product) };
  }
  return null;
}

export async function runApprovedTool(
  actor: AiActor,
  name: string,
  argsJson: string,
): Promise<{ result: unknown; clientAction?: { type: string; path?: string; message?: string } }> {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(argsJson || "{}") as Record<string, unknown>;
  } catch {
    return { result: { error: "Invalid tool arguments." } };
  }

  if (name === "open_page") {
    const path = sanitizePath(String(args.path || ""));
    if (!path) return { result: { error: "Path not allowed." } };
    if (path === "/erp" && actor.role === "public") {
      return {
        result: {
          error: "Private ERP requires client login.",
          loginPath: "/login",
        },
      };
    }
    if (path === "/admin" && actor.role !== "admin") {
      return { result: { error: "Admin area is restricted." } };
    }
    return {
      result: { ok: true, path, reason: String(args.reason || "") },
      clientAction: {
        type: "navigate",
        path,
        message: `Open ${path}`,
      },
    };
  }

  if (name === "request_sensitive_action") {
    return {
      result: {
        ok: false,
        requiresConfirmation: true,
        executed: false,
        message:
          "Sensitive actions are not auto-executed by AI. Use the authenticated ERP or Admin UI after confirmation.",
        action: args.action,
        details: String(args.details || "").slice(0, 500),
      },
      clientAction: {
        type: "confirm_required",
        message: `Confirmation required for ${String(args.action)}`,
      },
    };
  }

  if (name === "search_authorized_records") {
    const collection = String(args.collection || "").trim();
    const query = String(args.query || "").trim().toLowerCase();
    const limit = Math.min(20, Math.max(1, Number(args.limit) || 8));

    if (actor.role === "admin" && collection === "clients") {
      const clients = await listClients();
      const rows = clients
        .filter((c) =>
          !query
            ? true
            : [c.name, c.email, c.phone, c.erp, c.status].join(" ").toLowerCase().includes(query),
        )
        .slice(0, limit)
        .map((c) => ({
          name: c.name,
          email: c.email,
          erp: c.erp,
          status: c.status,
        }));
      return { result: { ok: true, collection: "clients", rows } };
    }

    const productHint =
      actor.role === "society_client" || collection.match(/resident|visitor|bill|house/i)
        ? "society"
        : "hospital";
    const loaded = await loadAuthorizedDb(actor, productHint);
    if (!loaded) return { result: { error: "Unauthorized." } };
    if (!isValidCollection(loaded.product, collection)) {
      return { result: { error: "Unknown or unauthorized collection." } };
    }
    if (actor.role === "public") {
      // Public: counts + redacted sample only
      const rows = loaded.db[collection] || [];
      return {
        result: {
          ok: true,
          environment: "public-demo",
          collection,
          count: rows.length,
          note: "Public demo is fictional and shared. Private fields are not fully exposed.",
          sample: rows.slice(0, Math.min(3, limit)).map((row) => {
            const copy: Record<string, string> = {};
            for (const [k, v] of Object.entries(row)) {
              if (["id", "createdAt", "updatedAt", "entryCode", "password"].includes(k)) continue;
              copy[k] = String(v).slice(0, 80);
            }
            return copy;
          }),
        },
      };
    }

    const rows = (loaded.db[collection] || []).filter((row) => {
      if (!query) return true;
      return Object.values(row).some((v) => String(v || "").toLowerCase().includes(query));
    });
    return {
      result: {
        ok: true,
        collection,
        count: rows.length,
        rows: rows.slice(0, limit).map((row) => {
          const { id, createdAt, updatedAt, ...rest } = row;
          return { id, ...rest };
        }),
      },
    };
  }

  return { result: { error: "Tool not allowed." } };
}
