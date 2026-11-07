import type { Metadata } from "next";
import Link from "next/link";
import { demoProducts } from "@/config/demos";
import { Container } from "@/components/ui/Container";
import { DemoWarning } from "@/components/demos/DemoWarning";
import { CreateDemoStickyCta } from "@/components/demos/CreateDemoStickyCta";
import { PublicMadeDemos } from "@/components/demos/PublicMadeDemos";

export const metadata: Metadata = {
  title: "Create Your Demo",
  description:
    "Explore Jarcode Technology software demos — Hospital, Society, or create your own AI-powered business ERP demo.",
  alternates: { canonical: "/create-your-demo" },
};

export default function CreateYourDemoPage() {
  return (
    <div className="section-soft section-pad pb-28 md:pb-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#00A8CC] uppercase">
            Interactive Software Demos
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-balance text-[#101828] sm:text-4xl lg:text-5xl">
            Explore our software — create your free demo
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#475467] sm:text-lg">
            Experience how JARCODE TECHNOLOGY software works. Try ready-made demos or build a
            customized ERP demo for your own business with AI.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <DemoWarning />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="premium-card flex flex-col p-6 sm:p-8">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F6FA] text-[#8055FF]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#101828]">
              {demoProducts.society.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[#475467] sm:text-base">
              {demoProducts.society.description}
            </p>
            <ul className="mt-5 space-y-1.5 text-sm text-[#667085]">
              {demoProducts.society.collections.slice(0, 5).map((item) => (
                <li key={item.id}>• {item.label}</li>
              ))}
              <li>• Reports and more modules inside the demo</li>
            </ul>
            <Link href={demoProducts.society.href} className="btn-primary mt-7">
              Explore Society Demo
            </Link>
          </article>

          <article className="premium-card flex flex-col p-6 sm:p-8">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F6FA] text-[#00A8CC]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M3 21h18M7 21V9h10v12M10 12h4M12 10v4M9 3h6v4H9z" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold text-[#101828]">
              {demoProducts.hospital.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-[#475467] sm:text-base">
              {demoProducts.hospital.description}
            </p>
            <ul className="mt-5 space-y-1.5 text-sm text-[#667085]">
              {demoProducts.hospital.collections.slice(0, 5).map((item) => (
                <li key={item.id}>• {item.label}</li>
              ))}
              <li>• Billing, pharmacy, reports and more</li>
            </ul>
            <Link href={demoProducts.hospital.href} className="btn-primary mt-7">
              Explore Hospital Demo
            </Link>
          </article>

          <article className="premium-card relative flex flex-col overflow-hidden border-[#00A8CC]/25 p-6 sm:p-8 lg:col-span-2">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,168,204,0.12),transparent_55%)]"
              aria-hidden
            />
            <div className="relative">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#00A8CC] uppercase">
                Premium · AI-Powered
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-[#101828] sm:text-3xl">
                Create Your Own Business Demo
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#475467] sm:text-base">
                Can&apos;t find a demo for your business? Create your own customized ERP demo
                using AI — describe your niche, choose modules, and open an interactive demo
                with a permanent shared URL.
              </p>
              <ul className="mt-5 grid gap-1.5 text-sm text-[#667085] sm:grid-cols-2">
                <li>• AI module suggestions for your niche</li>
                <li>• Editable features &amp; custom modules</li>
                <li>• Interactive forms, tables &amp; dashboard</li>
                <li>• Saved permanently in the central database</li>
              </ul>
              <Link href="/create-your-demo/builder" className="btn-primary mt-7 inline-flex">
                Create My Business Demo
              </Link>
            </div>
          </article>
        </div>

        <PublicMadeDemos />
      </Container>
      <CreateDemoStickyCta />
    </div>
  );
}
