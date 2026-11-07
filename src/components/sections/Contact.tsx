import { getWhatsAppLink, siteConfig } from "@/config/site";
import { ContactForm } from "@/components/sections/ContactForm";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Contact() {
  return (
    <section id="contact" className="section-soft section-pad" aria-labelledby="contact-heading">
      <Container>
        <SectionHeading
          id="contact-heading"
          eyebrow="Contact"
          title="Let's build something great together"
          description="Share your project goals and we will follow up with next steps. WhatsApp is the fastest way to reach us."
        />

        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="premium-card h-fit p-6 sm:p-8">
            <h3 className="font-display text-xl font-semibold text-[#101828]">Direct Contact</h3>
            <ul className="mt-5 space-y-4 text-sm text-[#475467]">
              <li>
                <p className="text-[#667085]">WhatsApp / Phone</p>
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-base font-semibold text-[#101828]"
                >
                  {siteConfig.contact.phoneDisplay}
                </a>
              </li>
              <li>
                <p className="text-[#667085]">Location</p>
                <p className="mt-1 text-[#101828]">{siteConfig.location.summary}</p>
              </li>
              <li>
                <p className="text-[#667085]">Social</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <a
                    href={siteConfig.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#8055FF]"
                  >
                    Instagram
                  </a>
                  <a
                    href={siteConfig.social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#8055FF]"
                  >
                    YouTube
                  </a>
                </div>
              </li>
            </ul>
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-8 w-full"
            >
              Chat on WhatsApp
            </a>
          </aside>

          <ContactForm />
        </div>
      </Container>
    </section>
  );
}
