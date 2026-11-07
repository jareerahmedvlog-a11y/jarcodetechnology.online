import Image from "next/image";
import Link from "next/link";
import { getWhatsAppLink, services, siteConfig } from "@/config/site";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const year = new Date().getFullYear();
  const productLinks = [
    { label: "Hospital Demo", href: "/create-your-demo/hospital" },
    { label: "Society Demo", href: "/create-your-demo/society" },
    { label: "Create Your Own Demo", href: "/create-your-demo/builder" },
    { label: "Create Demo", href: "/create-your-demo" },
    { label: "JARCODE AI", href: "/ai" },
    { label: "Client Login", href: "/login" },
  ];

  return (
    <footer className="border-t border-white/10 bg-[#080D18] pb-[calc(var(--mobile-nav-h)+0.25rem)] text-[#F8FAFC] xl:pb-0">
      <Container className="section-pad !pb-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src={siteConfig.logo.full}
              alt={siteConfig.logo.alt}
              width={88}
              height={88}
              className="h-20 w-20 rounded-full object-cover"
            />
            <p className="mt-4 font-display text-sm font-semibold">
              {siteConfig.name}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#98A2B3]">
              Custom ERP, websites, mobile apps, automation, and AI-assisted digital
              solutions for businesses in Pakistan and international markets.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-white">Services</h3>
            <ul className="mt-4 space-y-2">
              {services.slice(0, 6).map((s) => (
                <li key={s.id}>
                  <Link href="/#services" className="text-sm text-[#98A2B3] hover:text-white">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-white">Products</h3>
            <ul className="mt-4 space-y-2">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-[#98A2B3] hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-white">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-[#98A2B3]">
              <li>
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp: {siteConfig.contact.phoneDisplay}
                </a>
              </li>
              <li>{siteConfig.location.summary}</li>
              <li className="flex flex-wrap gap-3">
                <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Instagram
                </a>
                <a href={siteConfig.social.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  YouTube
                </a>
              </li>
              {[...siteConfig.nav, ...siteConfig.moreNav].slice(0, 4).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-[#667085] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {siteConfig.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
