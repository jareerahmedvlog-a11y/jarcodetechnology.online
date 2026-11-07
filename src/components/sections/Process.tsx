import { processSteps } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Process() {
  return (
    <section className="section-soft section-pad" aria-labelledby="process-heading">
      <Container>
        <SectionHeading
          id="process-heading"
          eyebrow="How We Work"
          title="Our development process"
          description="A clear path from discovery to launch, adapted to each project's scope."
        />

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processSteps.map((step) => (
            <li key={step.step} className="premium-card p-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#101828] text-sm font-bold text-white">
                {step.step}
              </span>
              <h3 className="mt-4 font-display font-semibold text-[#101828]">{step.title}</h3>
              <p className="mt-2 text-sm text-[#475467]">{step.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
