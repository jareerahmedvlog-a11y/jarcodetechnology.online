import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for the ${siteConfig.name} website.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="section-pad">
      <Container className="max-w-3xl">
        <p className="text-sm text-amber-200/90">
          Starter legal text — requires company-specific review before
          production use.
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold text-text sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-text-muted">
          Last updated: {new Date().getFullYear()}. By using this website, you
          agree to these terms.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-text-muted sm:text-base">
          <section>
            <h2 className="font-display text-xl font-semibold text-text">
              Website purpose
            </h2>
            <p className="mt-2">
              This site presents information about {siteConfig.name}, our
              services, and ways to contact us about potential projects. Content
              is for general information and does not create a binding project
              agreement by itself.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text">
              Project engagements
            </h2>
            <p className="mt-2">
              Scope, pricing, timelines, deliverables, and support terms are
              defined in a separate agreement or quotation for each project.
              Features are included based on agreed requirements.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text">
              Accuracy of information
            </h2>
            <p className="mt-2">
              We aim to keep website information accurate. Milestone figures and
              capability statements reflect company-provided information and are
              not presented as independently audited certifications unless
              explicitly stated.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text">
              Acceptable use
            </h2>
            <p className="mt-2">
              Do not misuse the contact form, attempt unauthorized access, or
              submit abusive or unlawful content.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text">
              Contact
            </h2>
            <p className="mt-2">
              Questions about these terms: WhatsApp {siteConfig.contact.phoneDisplay}.
            </p>
          </section>
        </div>

        <Link href="/" className="btn-secondary mt-10 inline-flex">
          Back to Home
        </Link>
      </Container>
    </div>
  );
}
