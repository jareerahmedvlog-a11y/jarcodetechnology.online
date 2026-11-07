import { demoProducts } from "@/config/demos";
import { portfolioProjects, services, siteConfig } from "@/config/site";

export type SearchItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  group: string;
};

export const searchIndex: SearchItem[] = [
  {
    id: "home",
    title: "Home",
    description: siteConfig.tagline,
    href: "/",
    group: "Pages",
  },
  {
    id: "about",
    title: "About Us",
    description: "Technology that moves your business forward.",
    href: "/#about",
    group: "Pages",
  },
  {
    id: "services",
    title: "Services",
    description: "ERP, CRM, websites, mobile apps, and automation.",
    href: "/#services",
    group: "Pages",
  },
  {
    id: "work",
    title: "Our Work",
    description: "Ideas turned into digital products.",
    href: "/#work",
    group: "Pages",
  },
  {
    id: "demo",
    title: "Create Your Demo",
    description: "Explore free shared software demos.",
    href: "/create-your-demo",
    group: "Demos",
  },
  {
    id: "society-demo",
    title: demoProducts.society.title,
    description: demoProducts.society.description,
    href: demoProducts.society.href,
    group: "Demos",
  },
  {
    id: "hospital-demo",
    title: demoProducts.hospital.title,
    description: demoProducts.hospital.description,
    href: demoProducts.hospital.href,
    group: "Demos",
  },
  {
    id: "achievements",
    title: "Achievements",
    description: "959+ projects and company milestones.",
    href: "/#achievements",
    group: "Pages",
  },
  {
    id: "founder",
    title: "Founder",
    description: `${siteConfig.founder.name} — ${siteConfig.founder.title}`,
    href: "/#founder",
    group: "Pages",
  },
  {
    id: "contact",
    title: "Contact",
    description: "Send a project inquiry or chat on WhatsApp.",
    href: "/#contact",
    group: "Pages",
  },
  {
    id: "faq",
    title: "FAQ",
    description: "Common questions about services and projects.",
    href: "/#faq",
    group: "Pages",
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    description: "How we handle inquiry information.",
    href: "/privacy",
    group: "Legal",
  },
  {
    id: "terms",
    title: "Terms of Service",
    description: "Website terms and project engagement notes.",
    href: "/terms",
    group: "Legal",
  },
  ...services.map((service) => ({
    id: `service-${service.id}`,
    title: service.title,
    description: service.description,
    href: "/#services",
    group: "Services",
  })),
  ...portfolioProjects.map((project) => ({
    id: `work-${project.id}`,
    title: project.title,
    description: project.description,
    href: "/#work",
    group: "Portfolio",
  })),
];

export function searchSite(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return searchIndex
    .filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q),
    )
    .slice(0, 12);
}
