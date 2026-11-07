import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const products = [
  {
    id: "hospital",
    title: "Hospital Management System",
    description:
      "A working Hospital Management demo covering clinical and administrative workflows. Explore modules with fictional sample data — private client ERPs stay separate.",
    href: "/create-your-demo/hospital",
    features: [
      "Patients Management",
      "Doctors Management",
      "Appointments",
      "Billing",
      "Pharmacy",
      "Reports",
      "AI Assistant",
    ],
    accent: "#00C2E8",
  },
  {
    id: "society",
    title: "Society Management System",
    description:
      "A working Society Office Management demo for residential operations, including visitor entry codes and collections workflows.",
    href: "/create-your-demo/society",
    features: [
      "Residents Management",
      "Properties Management",
      "Visitor Entry",
      "Secret Entry Codes",
      "Security Management",
      "Maintenance",
      "Billing and Payments",
    ],
    accent: "#8055FF",
  },
] as const;

function ProductPreview({ title, accent }: { title: string; accent: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#101828]/10 bg-white shadow-lg shadow-[#101828]/10">
      <div className="flex items-center gap-2 border-b border-[#101828]/08 bg-[#F8FAFC] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#F97066]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FDB022]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#32D583]" />
        <p className="ml-2 text-[11px] font-semibold text-[#667085]">{title} · Live demo UI</p>
      </div>
      <div className="grid grid-cols-[3.5rem_1fr]">
        <div className="space-y-1.5 border-r border-[#101828]/08 bg-[#F4F6FA] p-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-6 rounded-md"
              style={{ background: i === 1 ? accent : "rgba(16,24,40,0.06)" }}
            />
          ))}
        </div>
        <div className="space-y-2 p-3">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-[#101828]/08 bg-[#F8FAFC] p-2">
                <div className="h-1.5 w-8 rounded bg-[#D0D5DD]" />
                <div className="mt-2 h-3 w-10 rounded bg-[#101828]/80" />
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[#101828]/08 p-2">
            <div className="mb-2 h-1.5 w-20 rounded bg-[#D0D5DD]" />
            <div className="space-y-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-2">
                  <div className="h-2 flex-1 rounded bg-[#F2F4F7]" />
                  <div className="h-2 w-10 rounded bg-[#F2F4F7]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Solutions() {
  return (
    <section id="solutions" className="section-light section-pad" aria-labelledby="solutions-heading">
      <Container>
        <SectionHeading
          id="solutions-heading"
          eyebrow="Products"
          title="ERP platforms you can explore today"
          description="Open interactive demos of our Hospital and Society systems. Features listed below are present in the live demos."
        />

        <div className="space-y-8">
          {products.map((p, index) => (
            <article
              key={p.id}
              className="premium-card grid gap-8 p-6 lg:grid-cols-2 lg:items-center lg:p-8"
            >
              <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                <p
                  className="text-xs font-semibold tracking-[0.18em] uppercase"
                  style={{ color: p.accent }}
                >
                  ERP Product
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold text-[#101828] sm:text-3xl">
                  {p.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-[#475467]">{p.description}</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#344054]">
                      <span
                        className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: p.accent }}
                        aria-hidden
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={p.href} className="btn-primary mt-6">
                  Open Live Demo
                </Link>
              </div>
              <div className={index % 2 === 1 ? "lg:order-1" : undefined}>
                <ProductPreview title={p.title} accent={p.accent} />
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
