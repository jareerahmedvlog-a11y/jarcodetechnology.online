import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CustomDemoBuilder } from "@/components/demos/CustomDemoBuilder";
import { DemoWarning } from "@/components/demos/DemoWarning";

export const metadata: Metadata = {
  title: "Create Your Own Business Demo",
  description:
    "Describe your business and let JARCODE AI build a customized interactive ERP software demo.",
  alternates: { canonical: "/create-your-demo/builder" },
};

export default function CustomDemoBuilderPage() {
  return (
    <div className="section-soft section-pad">
      <Container>
        <div className="mx-auto mb-6 max-w-3xl">
          <DemoWarning />
        </div>
        <CustomDemoBuilder />
      </Container>
    </div>
  );
}
