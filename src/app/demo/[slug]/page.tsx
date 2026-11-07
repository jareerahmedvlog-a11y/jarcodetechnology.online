import type { Metadata } from "next";
import { CustomDemoClientLoader } from "@/components/demos/CustomDemoClientLoader";
import { CustomDemoWorkspace } from "@/components/demos/CustomDemoWorkspace";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { loadCustomDemo } from "@/lib/custom-demos/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await loadCustomDemo(slug);
  if (!bundle) {
    return { title: "Demo", robots: { index: false, follow: false } };
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

  if (bundle) {
    const admin = await isAdminAuthenticated();
    const allowed =
      bundle.config.status === "published" ||
      (admin &&
        ["draft", "unpublished", "suspended", "archived", "published"].includes(
          bundle.config.status,
        ));
    if (allowed) {
      return (
        <CustomDemoWorkspace
          initialConfig={bundle.config}
          initialData={bundle.data}
        />
      );
    }
  }

  // Avoid hard 404 after create on serverless — client recovers from cache/API.
  return <CustomDemoClientLoader slug={slug} />;
}
