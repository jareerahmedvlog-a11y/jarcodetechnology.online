import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${siteConfig.name}. How we handle inquiry and contact information.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="section-pad">
      <Container className="prose-invert max-w-3xl">
        <p className="text-sm text-amber-200/90">
          Starter legal text — requires company-specific review before
          production use.
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold text-text sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-text-muted">
          Last updated: {new Date().getFullYear()}. This page explains how{" "}
          {siteConfig.name} handles information submitted through this website.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-text-muted sm:text-base">
          <section>
            <h2 className="font-display text-xl font-semibold text-text">
              Information we collect
            </h2>
            <p className="mt-2">
              When you submit a project inquiry, we may collect your name,
              business name, email address, phone/WhatsApp number, selected
              service, optional budget notes, and project details you choose to
              share.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text">
              How we use information
            </h2>
            <p className="mt-2">
              Inquiry details are used only to respond to your request, prepare
              quotations, and communicate about potential or active projects. We
              do not publish submitted contact details publicly.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text">
              Sharing
            </h2>
            <p className="mt-2">
              We do not sell personal information. Delivery providers (such as
              an email or form webhook service you configure) may process
              messages solely to transmit inquiries to our team.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text">
              Retention
            </h2>
            <p className="mt-2">
              We retain inquiry information only as long as needed for business
              communication and record-keeping related to your request, unless a
              longer period is required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text">
              Contact
            </h2>
            <p className="mt-2">
              For privacy questions, contact us via WhatsApp at{" "}
              {siteConfig.contact.phoneDisplay}.
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
