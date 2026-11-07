import Link from "next/link";
import { getWhatsAppLink } from "@/config/site";
import { Container } from "@/components/ui/Container";

export function FinalCta() {
  return (
    <section className="section-pad" aria-labelledby="final-cta-heading">
      <Container>
        <div className="overflow-hidden rounded-[1.75rem] bg-[#101828] px-6 py-12 text-center sm:px-10 sm:py-14">
          <h2
            id="final-cta-heading"
            className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Ready to Transform Your Business?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#98A2B3] sm:text-lg">
            Let&apos;s build intelligent software solutions that help your business grow.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/#contact" className="btn-accent">
              Start Your Project
            </Link>
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Contact Our Team
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
