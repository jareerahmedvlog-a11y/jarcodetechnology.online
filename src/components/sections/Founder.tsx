import Image from "next/image";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Founder() {
  const { founder, logo } = siteConfig;

  return (
    <section id="founder" className="section-light section-pad" aria-labelledby="founder-heading">
      <Container>
        <SectionHeading id="founder-heading" eyebrow="Leadership" title="Meet our founder" />

        <a
          href={founder.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="premium-card group mx-auto grid max-w-4xl items-center gap-8 overflow-hidden p-6 sm:p-8 md:grid-cols-[auto_1fr] md:gap-10 md:p-10"
          aria-label={`${founder.name} — view Instagram profile`}
        >
          <div className="mx-auto shrink-0">
            <div className="relative mx-auto h-44 w-44 sm:h-52 sm:w-52">
              <div className="relative h-full w-full overflow-hidden rounded-full border border-[#101828]/10 shadow-lg">
                <Image
                  src={founder.image}
                  alt={founder.imageAlt}
                  fill
                  className="object-cover object-center"
                  sizes="224px"
                />
              </div>
            </div>
          </div>

          <div className="text-center md:text-left">
            <Image
              src={logo.mark}
              alt=""
              width={44}
              height={44}
              className="mx-auto h-11 w-11 rounded-full object-cover md:mx-0"
            />
            <h3 className="mt-4 font-display text-2xl font-bold text-[#101828] sm:text-3xl">
              {founder.name}
            </h3>
            <p className="mt-1 text-sm font-semibold text-[#8055FF] sm:text-base">{founder.title}</p>
            <p className="mt-4 text-sm leading-relaxed text-[#475467] sm:text-base">{founder.bio}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#00A8CC]">
              Follow on Instagram <span aria-hidden>↗</span>
            </span>
          </div>
        </a>
      </Container>
    </section>
  );
}
