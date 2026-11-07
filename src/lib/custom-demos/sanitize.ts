import {
  ALLOWED_FIELD_TYPES,
  type CustomFieldDef,
  type CustomFieldType,
  type CustomModuleDef,
} from "@/lib/custom-demos/types";

export function slugify(input: string) {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "business-demo";
}

export function sanitizeKey(raw: string, fallback: string) {
  const key = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return key || fallback;
}

export function sanitizeModuleId(raw: string, fallback: string) {
  const id = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return id || fallback;
}

function sanitizeField(raw: unknown, index: number): CustomFieldDef | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const key = sanitizeKey(String(obj.key || ""), `field_${index + 1}`);
  const label = String(obj.label || key).trim().slice(0, 80) || key;
  const typeRaw = String(obj.type || "text") as CustomFieldType;
  const type = ALLOWED_FIELD_TYPES.includes(typeRaw) ? typeRaw : "text";
  const field: CustomFieldDef = {
    key,
    label,
    type,
    required: Boolean(obj.required),
  };
  if (type === "select") {
    const options = Array.isArray(obj.options)
      ? obj.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 12)
      : ["Active", "Inactive"];
    field.options = options.length ? options : ["Active", "Inactive"];
  }
  if (obj.placeholder) field.placeholder = String(obj.placeholder).slice(0, 120);
  return field;
}

export function sanitizeModules(raw: unknown): {
  modules: CustomModuleDef[];
  unsupportedNotes: string[];
} {
  const unsupportedNotes: string[] = [];
  const list = Array.isArray(raw) ? raw : [];
  const modules: CustomModuleDef[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < list.length && modules.length < 14; i += 1) {
    const item = list[i];
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    let id = sanitizeModuleId(String(obj.id || obj.label || ""), `module-${i + 1}`);
    if (id === "dashboard" || id === "ai-assistant") {
      unsupportedNotes.push(`Skipped reserved module id "${id}".`);
      continue;
    }
    if (seen.has(id)) id = `${id}-${modules.length + 1}`;
    seen.add(id);

    const label = String(obj.label || id).trim().slice(0, 60) || id;
    const description = String(obj.description || `${label} records`).slice(0, 200);
    const fieldsRaw = Array.isArray(obj.fields) ? obj.fields : [];
    const fields = fieldsRaw
      .map((f, fi) => sanitizeField(f, fi))
      .filter((f): f is CustomFieldDef => Boolean(f))
      .slice(0, 10);

    if (!fields.length) {
      fields.push(
        { key: "name", label: "Name", type: "text", required: true },
        { key: "status", label: "Status", type: "select", required: true, options: ["Active", "Inactive"] },
        { key: "notes", label: "Notes", type: "textarea" },
      );
    }

    // Ensure at least one required name-like field
    if (!fields.some((f) => f.required)) fields[0].required = true;

    modules.push({ id, label, description, fields });
  }

  if (!modules.length) {
    modules.push({
      id: "records",
      label: "Records",
      description: "General business records",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "category", label: "Category", type: "text" },
        { key: "status", label: "Status", type: "select", required: true, options: ["Active", "Pending", "Closed"] },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
    });
    unsupportedNotes.push("AI returned no usable modules — applied a generic Records module.");
  }

  return { modules, unsupportedNotes };
}
