"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";

/** Hide the marketing footer on immersive AI chat. */
export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === "/ai" || pathname?.startsWith("/ai/")) return null;
  return <Footer />;
}
