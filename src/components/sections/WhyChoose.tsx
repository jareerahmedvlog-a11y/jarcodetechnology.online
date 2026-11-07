import { whyChoose } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function WhyChoose() {
  return (
    <section className="section-light section-pad" aria-labelledby="why-heading">
      <Container>
        <SectionHeading
          id="why-heading"
          eyebrow="Why JARCODE"
          title="A technology partner for your next idea"
          description="Solutions are planned around each customer's goals, workflow, budget, and requirements — without promising guaranteed results unless explicitly offered."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {whyChoose.map((item, index) => (
            <article key={item.title} className="premium-card p-6">
              <p className="font-display text-sm font-bold text-[#00A8CC]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-display text-lg font-semibold text-[#101828]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#475467]">{item.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
