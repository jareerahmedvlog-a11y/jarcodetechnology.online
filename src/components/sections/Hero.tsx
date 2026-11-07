import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/Container";

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-400/15 via-transparent to-violet-500/15 blur-2xl" aria-hidden />

      {/* Main ERP panel */}
      <div className="relative overflow-hidden rounded-2xl border border-[#101828]/10 bg-white shadow-[0_24px_60px_-24px_rgba(16,24,40,0.35)]">
        <div className="flex items-center justify-between border-b border-[#101828]/08 px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Plain img avoids optimizer/broken-icon glitches inside the mock panel */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={siteConfig.logo.mark}
              alt={siteConfig.logo.alt}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover ring-1 ring-[#101828]/10 bg-[#070B16]"
              decoding="async"
            />
            <div>
              <p className="text-xs font-bold text-[#101828]">JARCODE ERP</p>
              <p className="text-[10px] text-[#667085]">Operations overview</p>
            </div>
          </div>
          <span className="rounded-full bg-[#F4F6FA] px-2.5 py-1 text-[10px] font-semibold text-[#475467]">
            Product preview
          </span>
        </div>

        <div className="grid grid-cols-[4.5rem_1fr] sm:grid-cols-[5.5rem_1fr]">
          <aside className="border-r border-[#101828]/08 bg-[#F8FAFC] p-2.5">
            {["Home", "Patients", "Billing", "AI"].map((label, i) => (
              <div
                key={label}
                className={`mb-1 rounded-lg px-2 py-2 text-[10px] font-semibold ${
                  i === 0 ? "bg-[#101828] text-white" : "text-[#667085]"
                }`}
              >
                {label}
              </div>
            ))}
          </aside>

          <div className="space-y-3 p-3 sm:p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { t: "Modules", d: "ERP · Hospital · Society" },
                { t: "Access", d: "Role-based login" },
                { t: "AI", d: "Chat & Voice ready" },
              ].map((c) => (
                <div key={c.t} className="rounded-xl border border-[#101828]/08 bg-[#F4F6FA] px-2.5 py-2">
                  <p className="text-[9px] font-semibold tracking-wide text-[#667085] uppercase">{c.t}</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#101828] leading-snug">{c.d}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[#101828]/08 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold text-[#101828]">Workflow snapshot</p>
                <p className="text-[10px] text-[#667085]">Illustrative UI</p>
              </div>
              <div className="flex h-20 items-end gap-1.5">
                {[36, 52, 44, 68, 50, 74, 58, 80].map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t-md"
                    style={{
                      height: `${h}%`,
                      background:
                        i % 2 === 0
                          ? "linear-gradient(180deg,#00C2E8,#8055FF)"
                          : "#E4E7EC",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#101828]/08 p-2.5">
                <p className="text-[10px] font-semibold text-[#00A8CC]">Hospital</p>
                <p className="mt-1 text-[11px] leading-snug text-[#475467]">
                  Appointments, billing, pharmacy modules
                </p>
              </div>
              <div className="rounded-xl border border-[#101828]/08 p-2.5">
                <p className="text-[10px] font-semibold text-[#8055FF]">Society</p>
                <p className="mt-1 text-[11px] leading-snug text-[#475467]">
                  Residents, visitors, entry codes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI chip */}
      <div className="absolute -right-2 bottom-8 hidden rounded-xl border border-[#101828]/10 bg-white px-3 py-2 shadow-lg sm:block md:-right-4">
        <p className="text-[10px] font-bold text-[#101828]">JARCODE AI</p>
        <p className="text-[10px] text-[#667085]">Chat · Voice · Files</p>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="home"
      className="section-light relative overflow-hidden section-pad !pt-10 md:!pt-16"
      aria-labelledby="hero-heading"
    >
      <div className="surface-grid absolute inset-0" aria-hidden />
      <Container className="relative z-10 grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <div>
          <p className="mb-4 inline-flex items-center rounded-full border border-[#101828]/10 bg-[#F4F6FA] px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-[#475467] uppercase">
            Software · ERP · Digital Innovation
          </p>

          <h1
            id="hero-heading"
            className="font-display text-[2.05rem] leading-[1.12] font-bold tracking-tight text-balance text-[#101828] sm:text-4xl md:text-5xl lg:text-[3.15rem]"
          >
            Technology That Moves Your Business{" "}
            <span className="gradient-text">Forward.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#475467] sm:text-lg">
            We build intelligent software, powerful ERP systems, and digital
            experiences that help businesses operate smarter and grow faster.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/#solutions" className="btn-primary">
              Explore Our Solutions
            </Link>
            <Link href="/create-your-demo" className="btn-secondary">
              Explore Live Demos
            </Link>
          </div>
        </div>

        <DashboardPreview />
      </Container>
    </section>
  );
}
