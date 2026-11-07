import type { Metadata, Viewport } from "next";
import { Manrope, Source_Sans_3 } from "next/font/google";
import { ClientAiShell } from "@/components/ai/ClientAiShell";
import { BackToTop } from "@/components/layout/BackToTop";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import "./globals.css";

const display = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: "JARCODE TECHNOLOGY",
  title: {
    default: "JARCODE TECHNOLOGY | ERP, Software, Web & Mobile App Development",
    template: "%s | JARCODE TECHNOLOGY",
  },
  description: siteConfig.description,
  keywords: [...siteConfig.seo.keywords],
  authors: [{ name: siteConfig.founder.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: "JARCODE TECHNOLOGY",
    title: "JARCODE TECHNOLOGY | ERP, Software, Web & Mobile App Development",
    description: siteConfig.description,
    images: [
      {
        url: "/images/logo.png",
        width: 512,
        height: 512,
        alt: siteConfig.logo.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JARCODE TECHNOLOGY | ERP, Software, Web & Mobile App Development",
    description: siteConfig.description,
    images: ["/images/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/logo-mark.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon-32x32.png"],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#080D18",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased has-mobile-nav">
        <JsonLd />
        <Header />
        <main className="flex-1 pb-[calc(var(--mobile-nav-h)+0.5rem)] xl:pb-0">
          {children}
        </main>
        <ConditionalFooter />
        <MobileBottomNav />
        <BackToTop />
        <WhatsAppFloat />
        <ClientAiShell />
      </body>
    </html>
  );
}
