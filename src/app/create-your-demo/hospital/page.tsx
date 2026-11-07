import type { Metadata } from "next";
import { DemoWorkspace } from "@/components/demos/DemoWorkspace";
import { emptyDemoDatabase } from "@/lib/demos/empty";
import { getDemoDatabase } from "@/lib/demos/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hospital Management System Demo",
  description:
    "Try Jarcode Technology Hospital Management System in a shared public demo environment.",
  alternates: { canonical: "/create-your-demo/hospital" },
  robots: { index: true, follow: true },
};

async function loadInitial() {
  try {
    return await Promise.race([
      getDemoDatabase("hospital"),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
  } catch {
    return null;
  }
}

export default async function HospitalDemoPage() {
  const initialData = (await loadInitial()) ?? emptyDemoDatabase("hospital");

  return (
    <div className="demo-shell pb-16 pt-4">
      <DemoWorkspace product="hospital" initialData={initialData} />
    </div>
  );
}
