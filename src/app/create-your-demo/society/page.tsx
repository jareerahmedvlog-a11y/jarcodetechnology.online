import type { Metadata } from "next";
import { SocietyWorkspace } from "@/components/society/SocietyWorkspace";
import { emptyDemoDatabase } from "@/lib/demos/empty";
import { getDemoDatabase } from "@/lib/demos/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Society Office Management Demo",
  description:
    "Professional Housing Society Management Software demo by Jarcode Technology — visitors, billing, security, and more.",
  alternates: { canonical: "/create-your-demo/society" },
  robots: { index: true, follow: true },
};

async function loadInitial() {
  try {
    return await Promise.race([
      getDemoDatabase("society"),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
  } catch {
    return null;
  }
}

export default async function SocietyDemoPage() {
  const initialData = (await loadInitial()) ?? emptyDemoDatabase("society");

  return (
    <div className="demo-shell pb-16 pt-4">
      <SocietyWorkspace mode="public" initialData={initialData} />
    </div>
  );
}
