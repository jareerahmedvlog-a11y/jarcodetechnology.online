import type { Metadata } from "next";
import { AiWorkspace } from "@/components/ai/AiWorkspace";

export const metadata: Metadata = {
  title: "AI by JARCODE TECHNOLOGY",
  description:
    "Clean ChatGPT-style AI chat by JARCODE TECHNOLOGY — ask anything, upload files, create images, and more.",
  alternates: { canonical: "/ai" },
};

export default function AiPage() {
  return <AiWorkspace />;
}
