import Link from "next/link";
import { getWhatsAppLink } from "@/config/site";
import { ServiceIcon } from "@/components/icons/ServiceIcons";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const showcase = [
  {
    id: "custom",
    title: "Custom Software Development",
    description:
      "Purpose-built platforms tailored to your operations, users, and growth plans — from discovery to delivery.",
    icon: "custom" as const,
    href: "/#contact",
    layout: "wide",
  },
  {
    id: "erp",
    title: "ERP Software Solutions",
    description:
      "Modular ERP systems for workflows, inventory, reporting, and day-to-day business control.",
    icon: "erp" as const,
    href: "/create-your-demo",
  },
  {
    id: "website",
    title: "Website Design & Development",
    description:
      "Fast, accessible websites with clear messaging and conversion-focused structure.",
    icon: "website" as const,
    href: "/#contact",
  },
  {
    id: "mobile",
    title: "Mobile Application Development",
    description:
      "Business-ready mobile experiences designed around real user journeys and performance.",
    icon: "mobile" as const,
    href: "/#contact",
  },
  {
    id: "ai",
    title: "AI Integration",
    description:
      "Chat, voice, document analysis, and intelligent assistance integrated into your products.",
    icon: "ai" as const,
    href: "/ai",
  },
  {
    id: "ecommerce",
    title: "E-commerce Development",
    description:
      "Storefronts and commerce workflows scoped to catalog, checkout, and operations needs.",
    icon: "ecommerce" as const,
    href: "/#contact",
  },
] as const;

export function Services() {
  const [lead, ...rest] = showcase;

  return (
    <section id="services" className="section-soft section-pad" aria-labelledby="services-heading">
      <Container>
        <SectionHeading
          id="services-heading"
          eyebrow="Services"
          title="Capabilities built for serious businesses"
          description="Clear offerings with scoped delivery — we design and build software that supports real operations."
        />

        <article className="premium-card mb-5 grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:items-center md:p-8">
          <div>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#101828] text-white">
              <ServiceIcon name={lead.icon} />
            </div>
            <h3 className="font-display text-2xl font-bold text-[#101828]">{lead.title}</h3>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[#475467]">
              {lead.description}
            </p>
            <Link href={lead.href} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#00A8CC]">
              Learn More <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="rounded-2xl border border-[#101828]/08 bg-[#F4F6FA] p-5">
            <p className="text-xs font-semibold tracking-wide text-[#667085] uppercase">Engagement model</p>
            <ul className="mt-3 space-y-2 text-sm text-[#344054]">
              <li>• Requirements-led scoping</li>
              <li>• Iterative delivery milestones</li>
              <li>• Secure client ERP access when required</li>
              <li>• Ongoing support options</li>
            </ul>
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((item, idx) => (
            <article
              key={item.id}
              className={`premium-card flex flex-col p-6 ${idx === 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F6FA] text-[#101828]">
                <ServiceIcon name={item.icon} />
              </div>
              <h3 className="font-display text-lg font-bold text-[#101828]">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#475467]">{item.description}</p>
              <a
                href={
                  item.href.startsWith("/#") || item.href.startsWith("/ai") || item.href.startsWith("/create")
                    ? item.href
                    : getWhatsAppLink(`Hello Jarcode Technology, I would like to discuss ${item.title}.`)
                }
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#8055FF]"
                {...(item.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                Learn More <span aria-hidden>→</span>
              </a>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
