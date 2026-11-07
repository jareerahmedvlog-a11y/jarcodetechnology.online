import { getCollections } from "@/config/demos";
import type { DemoDatabase, DemoProduct } from "@/lib/demos/types";

/** Client-safe empty demo shell — never blocks the UI. */
export function emptyDemoDatabase(product: DemoProduct): DemoDatabase {
  const db: DemoDatabase = {};
  for (const collection of getCollections(product)) {
    db[collection.id] = [];
  }
  return db;
}
