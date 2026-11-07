import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const capabilities = [
  "AI Chat",
  "Live Voice Assistant",
  "Image Generation",
  "Document Analysis",
  "General AI Assistance",
  "Website & file understanding",
] as const;

export function AiPromo() {
  return (
    <section id="ai-product" className="section-soft section-pad" aria-labelledby="ai-promo-heading">
      <Container>
        <div className="premium-card overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="p-6 sm:p-8 lg:p-10">
              <SectionHeading
                id="ai-promo-heading"
                align="left"
                eyebrow="JARCODE AI"
                title="An advanced assistant for work and learning"
                description="Chat, voice, images, and document analysis in a clean workspace — available on this website today."
              />
              <ul className="grid gap-2 sm:grid-cols-2">
                {capabilities.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm font-medium text-[#344054]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00A8CC]" aria-hidden />
                    {c}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-[#667085]">
                Video generation is available in the AI Plus menu when a Luma API key is
                configured on the server.
              </p>
              <Link href="/ai" className="btn-accent mt-6 inline-flex">
                Explore AI
              </Link>
            </div>

            <div className="border-t border-[#E5E7EB] bg-[#FAFBFD] p-6 sm:border-t-0 sm:border-l sm:p-8">
              <div className="mx-auto max-w-sm rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_10px_30px_-12px_rgba(17,24,39,0.14)]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#111827]">JARCODE AI</p>
                  <span className="rounded-full border border-[#E5E7EB] bg-[#F4F6F8] px-2 py-0.5 text-[10px] text-[#64748B]">
                    Workspace preview
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-[#E5E7EB] bg-[#F4F6F8] px-3 py-2 text-xs text-[#252B36]">
                    Summarize this project brief and list next steps.
                  </div>
                  <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-[#E5E7EB] bg-white px-3 py-2 text-xs leading-relaxed text-[#252B36]">
                    Here’s a concise summary and a practical checklist you can use with your team…
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-xs text-[#64748B]">
                  Ask anything…
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
