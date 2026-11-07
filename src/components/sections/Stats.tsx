"use client";

import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

function useCountUp(target: number, enabled: boolean, duration = 1400) {
  const [value, setValue] = useState(enabled ? 0 : target);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (reduced.current) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled, target, duration]);

  return value;
}

function StatCard({
  label,
  description,
  value,
  suffix,
  note,
  prominent,
  visible,
}: {
  label: string;
  description?: string;
  value: number | null;
  suffix?: string;
  note?: string;
  prominent?: boolean;
  visible: boolean;
}) {
  const counted = useCountUp(value ?? 0, visible && value !== null);

  return (
    <article
      className={cn(
        "gradient-border rounded-2xl p-6",
        prominent && "md:col-span-2 lg:col-span-1 ring-1 ring-indigo-400/20",
      )}
    >
      {value !== null ? (
        <p
          className={cn(
            "font-display font-bold tracking-tight",
            prominent ? "text-4xl sm:text-5xl gradient-text" : "text-3xl text-text",
          )}
          aria-label={`${value}${suffix || ""} ${label}`}
        >
          <span aria-hidden>
            {counted}
            {suffix}
          </span>
        </p>
      ) : (
        <div
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue/20 to-violet/20 text-indigo-300"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
          </svg>
        </div>
      )}
      <h3 className="mt-2 text-lg font-semibold text-text">{label}</h3>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-text-muted">{description}</p>
      ) : null}
      {note ? (
        <p className="mt-3 text-xs text-text-dim">{note}</p>
      ) : null}
    </article>
  );
}

export function Stats() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="achievements-stats"
      className="relative section-pad"
      aria-labelledby="stats-heading"
    >
      <Container>
        <SectionHeading
          id="stats-heading"
          eyebrow="Company Milestones"
          title="Achievements Built Through Delivery"
          description="Figures below reflect company-provided milestones and capabilities. They are not independently audited certifications."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {siteConfig.stats.map((stat) => (
            <StatCard
              key={stat.id}
              label={stat.label}
              description={"description" in stat ? stat.description : undefined}
              value={stat.value}
              suffix={"suffix" in stat ? stat.suffix : undefined}
              note={"note" in stat ? stat.note : undefined}
              prominent={"prominent" in stat ? stat.prominent : false}
              visible={visible}
            />
          ))}
        </div>

        <div className="gradient-border mt-10 overflow-hidden rounded-3xl p-6 md:p-8">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-2xl font-bold text-text">
                Worldwide Reach
              </h3>
              <p className="mt-3 text-text-muted">
                From Pakistan to international markets — including digital
                operations extending to Dubai — we help businesses explore
                digital solutions built around their goals.
              </p>
            </div>
            <div
              className="relative mx-auto aspect-[2/1] w-full max-w-md rounded-2xl border border-border bg-[#0a1020] p-4"
              role="img"
              aria-label="Stylized world map highlighting Pakistan and Dubai"
            >
              <svg viewBox="0 0 400 200" className="h-full w-full" aria-hidden>
                <ellipse cx="200" cy="100" rx="160" ry="78" fill="#0f172a" stroke="#1e293b" />
                <path
                  d="M80 110 C140 70, 220 70, 280 95 C310 108, 340 100, 355 90"
                  stroke="url(#line)"
                  strokeWidth="1.5"
                  fill="none"
                  strokeDasharray="4 4"
                />
                <defs>
                  <linearGradient id="line" x1="80" y1="90" x2="355" y2="90">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <circle cx="195" cy="105" r="5" fill="#3b82f6" />
                <circle cx="230" cy="95" r="4" fill="#a855f7" />
                <text x="175" y="130" fill="#94a3b8" fontSize="10">
                  Pakistan
                </text>
                <text x="236" y="88" fill="#94a3b8" fontSize="10">
                  Dubai
                </text>
              </svg>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
