import { randomUUID } from "crypto";
import { slugify } from "@/lib/custom-demos/sanitize";
import type {
  CustomDemoBundle,
  CustomDemoData,
  CustomDemoRecord,
  CustomModuleDef,
} from "@/lib/custom-demos/types";
import {
  persistDeleteBundle,
  persistListIndex,
  persistLoadBundle,
  persistSaveBundle,
} from "@/lib/custom-demos/persistence";

export async function listCustomDemoIndex() {
  return persistListIndex();
}

export async function loadCustomDemo(idOrSlug: string) {
  return persistLoadBundle(idOrSlug);
}

export async function saveCustomDemo(bundle: CustomDemoBundle) {
  return persistSaveBundle(bundle);
}

export async function deleteCustomDemo(id: string) {
  await persistDeleteBundle(id);
}

export async function uniqueSlug(base: string) {
  const index = await persistListIndex();
  let slug = slugify(base);
  if (!index.some((e) => e.slug === slug)) return slug;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${slug}-${i}`.slice(0, 56);
    if (!index.some((e) => e.slug === candidate)) return candidate;
  }
  return `${slug}-${randomUUID().slice(0, 8)}`;
}

export function emptyDataForModules(modules: CustomModuleDef[]): CustomDemoData {
  const data: CustomDemoData = {};
  for (const m of modules) data[m.id] = [];
  return data;
}

export function seedSampleData(modules: CustomModuleDef[]): CustomDemoData {
  const data = emptyDataForModules(modules);
  const now = new Date().toISOString();
  for (const mod of modules) {
    const rows: CustomDemoRecord[] = [];
    for (let i = 1; i <= 3; i += 1) {
      const row: CustomDemoRecord = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      for (const field of mod.fields) {
        if (field.type === "number") row[field.key] = String(10 * i);
        else if (field.type === "date") row[field.key] = now.slice(0, 10);
        else if (field.type === "email") row[field.key] = `demo${i}@example.com`;
        else if (field.type === "tel") row[field.key] = `0300-00000${i}`;
        else if (field.type === "select") row[field.key] = field.options?.[0] || "Active";
        else if (field.type === "textarea")
          row[field.key] = `Fictional sample note ${i} for ${mod.label}.`;
        else row[field.key] = `Sample ${field.label} ${i}`;
      }
      rows.push(row);
    }
    data[mod.id] = rows;
  }
  return data;
}

export async function createCustomDemoRecord(
  demoId: string,
  moduleId: string,
  values: Record<string, string>,
) {
  const bundle = await loadCustomDemo(demoId);
  if (!bundle) throw new Error("Demo not found.");
  const mod = bundle.config.modules.find((m) => m.id === moduleId);
  if (!mod) throw new Error("Module not found.");
  const now = new Date().toISOString();
  const record: CustomDemoRecord = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...values,
  };
  bundle.data[moduleId] = [record, ...(bundle.data[moduleId] || [])];
  bundle.config.updatedAt = now;
  await saveCustomDemo(bundle);
  return record;
}

export async function updateCustomDemoRecord(
  demoId: string,
  moduleId: string,
  recordId: string,
  values: Record<string, string>,
) {
  const bundle = await loadCustomDemo(demoId);
  if (!bundle) throw new Error("Demo not found.");
  const rows = bundle.data[moduleId] || [];
  const idx = rows.findIndex((r) => r.id === recordId);
  if (idx < 0) throw new Error("Record not found.");
  const now = new Date().toISOString();
  rows[idx] = {
    ...rows[idx],
    ...values,
    id: recordId,
    createdAt: rows[idx].createdAt,
    updatedAt: now,
  };
  bundle.data[moduleId] = rows;
  bundle.config.updatedAt = now;
  await saveCustomDemo(bundle);
  return rows[idx];
}

export async function deleteCustomDemoRecord(
  demoId: string,
  moduleId: string,
  recordId: string,
) {
  const bundle = await loadCustomDemo(demoId);
  if (!bundle) throw new Error("Demo not found.");
  bundle.data[moduleId] = (bundle.data[moduleId] || []).filter((r) => r.id !== recordId);
  bundle.config.updatedAt = new Date().toISOString();
  await saveCustomDemo(bundle);
}
