import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomDemoWorkspace } from "@/components/demos/CustomDemoWorkspace";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { loadCustomDemo } from "@/lib/custom-demos/store";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await loadCustomDemo(slug);
  if (!bundle) {
    return { title: "Demo Not Found" };
  }
  return {
    title: `${bundle.config.businessName} Demo`,
    description: `Interactive AI-generated ERP demo for ${bundle.config.niche}. Use fictional data only.`,
    alternates: { canonical: `/demo/${bundle.config.slug}` },
    robots: bundle.config.status === "published" ? undefined : { index: false, follow: false },
  };
}

export default async function CustomDemoPage({ params }: Props) {
  const { slug } = await params;
  const bundle = await loadCustomDemo(slug);
  if (!bundle) notFound();

  const admin = await isAdminAuthenticated();
  const allowed =
    bundle.config.status === "published" ||
    (admin &&
      ["draft", "unpublished", "suspended", "archived", "published"].includes(
        bundle.config.status,
      ));

  if (!allowed) notFound();

  return (
    <CustomDemoWorkspace
      initialConfig={bundle.config}
      initialData={bundle.data}
    />
  );
}
