import Link from "next/link";
import { values } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function About() {
  return (
    <section id="about" className="section-navy section-pad" aria-labelledby="about-heading">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <SectionHeading
              id="about-heading"
              tone="dark"
              align="left"
              eyebrow="About JARCODE TECHNOLOGY"
              title="Software craftsmanship with business clarity"
              description="We help organizations turn operational needs into reliable digital systems — ERP platforms, websites, mobile apps, automation, and AI-assisted workflows."
            />
            <div className="space-y-4 text-base leading-relaxed text-[#98A2B3]">
              <p>
                Our mission is practical: deliver technology that improves how teams
                work, how customers are served, and how leaders see the business.
              </p>
              <p>
                Based in Karachi with digital reach beyond Pakistan, we approach every
                engagement with scoped requirements, transparent milestones, and
                maintainable architecture.
              </p>
            </div>
            <Link href="/#contact" className="btn-accent mt-8 inline-flex">
              Talk to Our Team
            </Link>
          </div>

          <div className="grid gap-3">
            {values.map((value) => (
              <article
                key={value.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <h3 className="font-display text-lg font-semibold text-white">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#98A2B3]">{value.description}</p>
              </article>
            ))}
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-display text-lg font-semibold text-white">Client commitment</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#98A2B3]">
                Private ERP environments for clients, public demos for evaluation, and
                clear separation between sample data and production accounts.
              </p>
            </article>
          </div>
        </div>
      </Container>
    </section>
  );
}
