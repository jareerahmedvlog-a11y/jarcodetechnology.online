import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const pillars = [
  {
    title: "Scoped delivery",
    text: "Requirements, milestones, and acceptance criteria agreed before build.",
  },
  {
    title: "Secure access",
    text: "Client ERP login, role-aware workspaces, and private tenant data separation.",
  },
  {
    title: "Modern stack",
    text: "Contemporary web architecture with maintainable TypeScript applications.",
  },
  {
    title: "AI-ready products",
    text: "Chat, voice, and document assistance available as product capabilities.",
  },
] as const;

export function Certificate() {
  const projects = siteConfig.stats.find((s) => s.id === "projects");

  return (
    <section id="achievements" className="section-soft section-pad" aria-labelledby="certificate-heading">
      <Container>
        <SectionHeading
          id="certificate-heading"
          eyebrow="Trust & Delivery"
          title="How we earn confidence"
          description="We focus on verifiable process and product quality. Company milestones are presented transparently — not as third-party certifications."
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <article key={p.title} className="premium-card p-5">
              <h3 className="font-display text-base font-bold text-[#101828]">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#475467]">{p.text}</p>
            </article>
          ))}
        </div>

        {projects?.value ? (
          <div className="premium-card mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[#667085] uppercase">
                Company-provided milestone
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-[#101828]">
                {projects.value}
                {projects.suffix} software projects & digital solutions
              </p>
              <p className="mt-2 max-w-xl text-sm text-[#475467]">
                Internal milestone figure provided by JARCODE TECHNOLOGY — not an external award or ISO claim.
              </p>
            </div>
            <Link href="/#contact" className="btn-primary shrink-0">
              Start a Conversation
            </Link>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
