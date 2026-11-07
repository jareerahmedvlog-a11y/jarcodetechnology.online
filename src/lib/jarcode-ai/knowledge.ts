import { faqs, services, siteConfig } from "@/config/site";

/** Grounded website facts for the assistant — no invented pricing. */
export function buildWebsiteKnowledge() {
  return {
    company: {
      name: siteConfig.name,
      legalName: siteConfig.legalName,
      tagline: siteConfig.tagline,
      description: siteConfig.description,
      founder: siteConfig.founder.name,
      location: siteConfig.location,
      phone: siteConfig.contact.phoneDisplay,
      whatsapp: siteConfig.contact.whatsappUrl,
      instagram: siteConfig.social.instagram,
      youtube: siteConfig.social.youtube,
      website: siteConfig.url,
    },
    navigation: [
      { label: "Home", path: "/" },
      { label: "About Us", path: "/#about" },
      { label: "Services", path: "/#services" },
      { label: "Our Work", path: "/#work" },
      { label: "Create Your Demo", path: "/create-your-demo" },
      { label: "Hospital Management Demo", path: "/create-your-demo/hospital" },
      { label: "Society Office Management Demo", path: "/create-your-demo/society" },
      {
        label: "Create Your Own Business Demo (AI)",
        path: "/create-your-demo/builder",
      },
      { label: "Client Login / ERP", path: "/login" },
      { label: "Contact", path: "/#contact" },
      { label: "Privacy", path: "/privacy" },
      { label: "Terms", path: "/terms" },
    ],
    services: services.map((s) => ({ id: s.id, title: s.title, description: s.description })),
    demos: [
      {
        id: "hospital",
        title: "Hospital Management System Demo",
        path: "/create-your-demo/hospital",
        summary:
          "Public fictional demo for hospital operations: patients, doctors, appointments, OPD, admissions, billing, pharmacy, and reports. Includes a Hospital demo AI assistant that only reads demo hospital data.",
      },
      {
        id: "society",
        title: "Society Office Management Software Demo",
        path: "/create-your-demo/society",
        summary:
          "Public fictional housing society demo: properties, residents, visitor entry codes, gate verification, billing, complaints, parking, deliveries, facilities, notices, and role-based modules.",
      },
      {
        id: "custom-ai",
        title: "Create Your Own Business Demo",
        path: "/create-your-demo/builder",
        summary:
          "AI-powered demo builder: visitors describe their business niche, JARCODE AI proposes ERP modules using the same OpenAI integration, then generates an interactive demo saved permanently under /demo/[slug]. Separate from production client ERPs.",
      },
    ],
    clientErp: {
      path: "/login",
      summary:
        "Authorized clients sign in at /login to open their private Client ERP at /erp. Hospital clients see hospital modules; Society clients see society modules. Public visitors cannot access private ERP records. Admin creates client accounts from the admin panel.",
    },
    pricingNote:
      "Exact pricing is project-based. Do not invent package prices. Direct visitors to WhatsApp or the contact form for a quotation.",
    faqs: faqs.map((f) => ({ q: f.question, a: f.answer })),
  };
}

export const PUBLIC_SYSTEM_RULES = `You are the JARCODE TECHNOLOGY website AI Assistant for Jarcode Technology (Karachi, Pakistan).

Languages: reply in the user's language when they use English, Urdu, Hindi, or Roman Urdu.

Rules:
- Use ONLY grounded website knowledge and authorized data provided in system context.
- Never invent pricing, client names, medical advice, or private ERP records.
- Public visitors must NEVER receive private client ERP data.
- Prefer short, clear answers. When helpful, include the exact website path to open (e.g. /create-your-demo/society).
- For quotations, direct users to WhatsApp +92 318 4429280 or the contact form.
- Never claim unlimited AI usage.
- Do not execute or invent SQL. Only use approved tools when available.
- If asked about Hospital or Society software, explain features accurately and offer demo links.
- For Client ERP access, explain /login and that accounts are issued by Jarcode admin.
- Image/video generation is routed by the server — never say you cannot create images or videos; the platform handles that via OpenAI Images and Luma.`;
