import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function International() {
  return (
    <section className="section-pad" aria-labelledby="intl-heading">
      <Container>
        <div className="gradient-border overflow-hidden rounded-3xl">
          <div className="grid items-center gap-8 p-6 md:grid-cols-2 md:p-10">
            <div>
              <SectionHeading
                id="intl-heading"
                eyebrow="Presence"
                title="Digital Solutions Without Borders"
                description="From Pakistan to international markets, we help businesses explore digital solutions built around their goals."
                align="left"
              />
              <p className="text-sm text-text-muted">
                {siteConfig.location.summary} We collaborate remotely with
                clients wherever they operate — without inventing branch counts
                or unverified office addresses.
              </p>
            </div>

            <div
              className="rounded-2xl border border-border bg-[#0a1020] p-5"
              role="img"
              aria-label="Connected nodes illustrating Pakistan to Dubai and international markets"
            >
              <svg viewBox="0 0 420 240" className="h-auto w-full" aria-hidden>
                <circle cx="210" cy="120" r="95" fill="#0f172a" stroke="#1e293b" />
                <circle cx="210" cy="120" r="60" fill="none" stroke="#334155" strokeDasharray="3 5" />
                <line x1="150" y1="130" x2="260" y2="100" stroke="#6366f1" strokeOpacity="0.7" />
                <line x1="260" y1="100" x2="310" y2="70" stroke="#a855f7" strokeOpacity="0.5" />
                <line x1="150" y1="130" x2="110" y2="170" stroke="#3b82f6" strokeOpacity="0.5" />
                <circle cx="150" cy="130" r="7" fill="#3b82f6" />
                <circle cx="260" cy="100" r="6" fill="#a855f7" />
                <circle cx="310" cy="70" r="4" fill="#818cf8" />
                <circle cx="110" cy="170" r="4" fill="#60a5fa" />
                <text x="120" y="155" fill="#94a3b8" fontSize="11">
                  Karachi
                </text>
                <text x="268" y="95" fill="#94a3b8" fontSize="11">
                  Dubai
                </text>
                <text x="318" y="68" fill="#64748b" fontSize="10">
                  Global
                </text>
              </svg>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
