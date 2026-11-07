/**
 * Central site configuration — update company details, links, and content here.
 */

export const siteConfig = {
  name: "Jarcode Technology",
  legalName: "Jarcode Technology",
  tagline: "Transforming Ideas Into Technology.",
  founder: {
    name: "Jareer Ahmed",
    title: "Founder & CEO — Jarcode Technology",
    bio: "Jareer Ahmed founded Jarcode Technology with a vision to help businesses transform their ideas into practical digital solutions. His focus is on technology, entrepreneurship, software innovation, and building digital products that address real business needs.",
    image: "/images/founder.png",
    imageAlt: "Jareer Ahmed, Founder and CEO of Jarcode Technology",
    instagram: "https://www.instagram.com/jareerahmed01/",
  },
  description:
    "Jarcode Technology delivers custom ERP and CRM systems, website development, mobile applications, business automation, and software solutions from Karachi, Pakistan, serving businesses in local and international markets.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://jarcodetechnology.com",
  location: {
    city: "Karachi",
    country: "Pakistan",
    presence: "Dubai",
    summary:
      "Based in Karachi, Pakistan, with digital operations extending to Dubai.",
  },
  contact: {
    phoneDisplay: "+92 318 4429280",
    phoneE164: "923184429280",
    whatsappUrl: "https://wa.me/923184429280",
    whatsappPrefill:
      "Hello Jarcode Technology, I would like to discuss a software project.",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  },
  social: {
    instagram: "https://www.instagram.com/jarcodetechnology/",
    youtube: "https://www.youtube.com/@jarcodethechnology",
  },
  logo: {
    full: "/images/logo.png",
    mark: "/images/logo-mark.png",
    alt: "Jarcode Technology logo",
  },
  stats: [
    {
      id: "projects",
      value: 959,
      suffix: "+",
      label: "Projects / Software Solutions",
      note: "Company-provided milestone",
      prominent: true,
    },
    {
      id: "reach",
      value: null,
      label: "Worldwide Reach",
      description: "Serving businesses across local and international markets",
    },
    {
      id: "solutions",
      value: null,
      label: "Multiple Digital Solutions",
      description: "ERP, CRM, web, mobile, automation, and more",
    },
    {
      id: "innovation",
      value: null,
      label: "Business-Focused Innovation",
      description: "Technology planned around real operational needs",
    },
  ],
  /** Primary desktop nav — keep short labels to avoid wrap */
  nav: [
    { label: "Home", href: "/#home" },
    { label: "Services", href: "/#services" },
    { label: "Solutions", href: "/#solutions" },
    { label: "Our Work", href: "/#work" },
    { label: "Create Demo", href: "/create-your-demo" },
    { label: "AI", href: "/ai" },
  ],
  /** Secondary links under More */
  moreNav: [
    { label: "About Us", href: "/#about" },
    { label: "Achievements", href: "/#achievements" },
    { label: "Founder", href: "/#founder" },
    { label: "Contact", href: "/#contact" },
    { label: "FAQ", href: "/#faq" },
  ],
  seo: {
    title:
      "JARCODE TECHNOLOGY | ERP, Software, Web & Mobile App Development",
    titleTemplate: "%s | JARCODE TECHNOLOGY",
    keywords: [
      "Jarcode Technology",
      "Software development company in Karachi",
      "ERP software development Pakistan",
      "Custom ERP solutions",
      "CRM development services",
      "Website development company Karachi",
      "Mobile app development Pakistan",
      "Custom business software",
      "Business automation solutions",
      "Software development for international businesses",
    ],
  },
} as const;

export const services = [
  {
    id: "erp",
    title: "Custom ERP Development",
    description:
      "Build tailored Enterprise Resource Planning software to help businesses organize workflows, operations, reporting, and business processes.",
    icon: "erp",
  },
  {
    id: "crm",
    title: "CRM Solutions",
    description:
      "Develop customer relationship management solutions tailored to client requirements — scoped to each project's needs.",
    icon: "crm",
  },
  {
    id: "website",
    title: "Website Development",
    description:
      "Create modern, responsive, SEO-friendly corporate websites, business websites, landing pages, and web applications.",
    icon: "website",
  },
  {
    id: "mobile",
    title: "Mobile App Development",
    description:
      "Develop user-friendly mobile applications for Android and iOS according to project requirements.",
    icon: "mobile",
  },
  {
    id: "custom",
    title: "Custom Software Development",
    description:
      "Build software designed around specific business processes, operational requirements, and project goals.",
    icon: "custom",
  },
  {
    id: "automation",
    title: "Business Automation",
    description:
      "Help businesses reduce repetitive manual work by digitizing workflows and connecting relevant business processes.",
    icon: "automation",
  },
  {
    id: "ecommerce",
    title: "E-commerce Solutions",
    description:
      "Build online shopping experiences with product catalogs, shopping carts, checkout integrations, and order workflows where required.",
    icon: "ecommerce",
  },
  {
    id: "ai",
    title: "AI and Modern Technology",
    description:
      "Explore AI-powered features, intelligent automation, and modern digital tools based on the customer's needs.",
    icon: "ai",
  },
  {
    id: "uiux",
    title: "UI/UX and Web Applications",
    description:
      "Design intuitive user experiences and interactive web applications with a focus on usability, accessibility, and performance.",
    icon: "uiux",
  },
] as const;

export const portfolioCategories = [
  "All Projects",
  "ERP Systems",
  "CRM Solutions",
  "Websites",
  "Mobile Apps",
  "Custom Software",
  "Automation",
] as const;

export type PortfolioCategory = (typeof portfolioCategories)[number];

/**
 * Placeholder portfolio items — replace with real projects and images.
 * Never invent client names or live URLs.
 */
export const portfolioProjects = [
  {
    id: "placeholder-erp",
    title: "Operations ERP Concept",
    category: "ERP Systems" as PortfolioCategory,
    description:
      "Design placeholder for a modular ERP covering inventory, reporting, and workflow tracking. Replace with a real project.",
    image: "/images/portfolio/erp.svg",
    technologies: ["Next.js", "Node.js", "PostgreSQL"],
    isPlaceholder: true,
  },
  {
    id: "placeholder-crm",
    title: "Client Pipeline CRM",
    category: "CRM Solutions" as PortfolioCategory,
    description:
      "Design placeholder for a CRM focused on leads, follow-ups, and customer records. Replace with a real project.",
    image: "/images/portfolio/crm.svg",
    technologies: ["React", "API Integration"],
    isPlaceholder: true,
  },
  {
    id: "placeholder-web",
    title: "Corporate Website Concept",
    category: "Websites" as PortfolioCategory,
    description:
      "Design placeholder for a responsive corporate website with clear messaging and inquiry conversion. Replace with a real project.",
    image: "/images/portfolio/website.svg",
    technologies: ["Next.js", "Tailwind CSS"],
    isPlaceholder: true,
  },
  {
    id: "placeholder-mobile",
    title: "Business Mobile App Concept",
    category: "Mobile Apps" as PortfolioCategory,
    description:
      "Design placeholder for an Android/iOS business app interface. Replace with a real project.",
    image: "/images/portfolio/mobile.svg",
    technologies: ["React Native", "REST API"],
    isPlaceholder: true,
  },
  {
    id: "placeholder-custom",
    title: "Custom Workflow Platform",
    category: "Custom Software" as PortfolioCategory,
    description:
      "Design placeholder for software built around unique operational processes. Replace with a real project.",
    image: "/images/portfolio/custom.svg",
    technologies: ["TypeScript", "Cloud Hosting"],
    isPlaceholder: true,
  },
  {
    id: "placeholder-auto",
    title: "Process Automation Concept",
    category: "Automation" as PortfolioCategory,
    description:
      "Design placeholder for digitized workflows that reduce repetitive manual work. Replace with a real project.",
    image: "/images/portfolio/automation.svg",
    technologies: ["Integrations", "Automation Tools"],
    isPlaceholder: true,
  },
] as const;

export const values = [
  {
    title: "Innovation",
    description: "Modern solutions designed around business needs.",
  },
  {
    title: "Reliability",
    description: "Performance-focused, maintainable software.",
  },
  {
    title: "Scalability",
    description: "Digital products designed to grow with the business.",
  },
] as const;

export const whyChoose = [
  {
    title: "Customized Solutions",
    description:
      "Every engagement is planned around your goals, workflows, budget, and requirements.",
  },
  {
    title: "Modern Technology",
    description:
      "We use contemporary stacks and practices suited to the project's scope and longevity.",
  },
  {
    title: "Responsive Design",
    description:
      "Interfaces are built to work clearly across phones, tablets, and desktops.",
  },
  {
    title: "Performance-Focused Development",
    description:
      "We prioritize load speed, usability, and maintainable architecture.",
  },
  {
    title: "Business-Oriented Approach",
    description:
      "Features are aligned to operational outcomes — not technology for its own sake.",
  },
  {
    title: "Ongoing Support Options",
    description:
      "Maintenance and support can be included where agreed for your project scope.",
  },
] as const;

export const processSteps = [
  {
    step: 1,
    title: "Discovery",
    description: "Understand the business, audience, and project goals.",
  },
  {
    step: 2,
    title: "Planning",
    description: "Define the scope, features, technology, and milestones.",
  },
  {
    step: 3,
    title: "Design",
    description: "Create the interface and user experience.",
  },
  {
    step: 4,
    title: "Development",
    description: "Build the software or digital product.",
  },
  {
    step: 5,
    title: "Testing",
    description:
      "Test functionality, usability, responsiveness, and performance.",
  },
  {
    step: 6,
    title: "Launch",
    description:
      "Deploy the approved project and provide the agreed handover or support.",
  },
] as const;

export const serviceOptions = [
  "ERP Development",
  "CRM Solutions",
  "Website Development",
  "Mobile App Development",
  "Custom Software",
  "Business Automation",
  "E-commerce",
  "AI Solutions",
  "Other",
] as const;

export const faqs = [
  {
    question: "What services does Jarcode Technology offer?",
    answer:
      "We offer custom ERP and CRM development, website and mobile app development, custom software, business automation, e-commerce solutions, AI-assisted features where suitable, and UI/UX for web applications. Exact deliverables depend on your project requirements.",
  },
  {
    question: "Can you develop a custom ERP system for my business?",
    answer:
      "Yes. We design and build ERP solutions tailored to your workflows, reporting needs, and operational processes. Scope, modules, and timeline are defined after discovery.",
  },
  {
    question: "Do you build websites and mobile applications?",
    answer:
      "Yes. We build responsive websites, web applications, and mobile apps for Android and iOS according to project goals and technical requirements.",
  },
  {
    question: "Can you develop software according to my requirements?",
    answer:
      "Absolutely. Custom software is planned around your specific processes, integrations, and success criteria — features are included based on agreed scope, not assumed by default.",
  },
  {
    question: "How can I request a project quotation?",
    answer:
      "Use the inquiry form on this website, tap Chat on WhatsApp, or message us at +92 318 4429280. Share your goals, required features, and any timelines so we can prepare a relevant quotation.",
  },
  {
    question: "Do you work with international customers?",
    answer:
      "Yes. We are based in Karachi, Pakistan, with digital operations extending to Dubai, and we work with businesses in local and international markets.",
  },
  {
    question: "How long does a software project take?",
    answer:
      "Timelines depend on scope, complexity, integrations, and feedback cycles. After discovery and planning, we share a realistic milestone schedule for your specific project.",
  },
  {
    question: "What information should I provide before starting?",
    answer:
      "Helpful details include business goals, target users, must-have features, preferred platforms, existing tools to integrate, budget range if available, and any examples you like.",
  },
  {
    question: "Do you offer maintenance and support?",
    answer:
      "Yes — ongoing maintenance and support options can be included where agreed. Coverage, response expectations, and duration are defined in the project agreement.",
  },
  {
    question: "How can I contact your team?",
    answer:
      "WhatsApp is the fastest option: +92 318 4429280. You can also submit the project inquiry form or follow Jarcode Technology on Instagram and YouTube.",
  },
] as const;

export function getWhatsAppLink(message?: string) {
  const text = encodeURIComponent(
    message || siteConfig.contact.whatsappPrefill,
  );
  return `${siteConfig.contact.whatsappUrl}?text=${text}`;
}
