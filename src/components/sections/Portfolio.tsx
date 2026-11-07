"use client";

import { useMemo, useState } from "react";
import {
  getWhatsAppLink,
  portfolioCategories,
  portfolioProjects,
  type PortfolioCategory,
} from "@/config/site";
import { PortfolioThumb } from "@/components/sections/PortfolioThumb";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

export function Portfolio() {
  const [active, setActive] = useState<PortfolioCategory>("All Projects");

  const filtered = useMemo(() => {
    if (active === "All Projects") return portfolioProjects;
    return portfolioProjects.filter((p) => p.category === active);
  }, [active]);

  return (
    <section id="work" className="section-light section-pad" aria-labelledby="work-heading">
      <Container>
        <SectionHeading
          id="work-heading"
          eyebrow="Our Work"
          title="Selected concepts & project placeholders"
          description="Items marked as design placeholders are awaiting real project assets. We do not invent client names or fake case studies."
        />

        <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Portfolio categories">
          {portfolioCategories.map((category) => {
            const selected = active === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={selected}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
                  selected
                    ? "border-[#101828] bg-[#101828] text-white"
                    : "border-[#101828]/10 bg-white text-[#475467] hover:border-[#101828]/25",
                )}
                onClick={() => setActive(category)}
              >
                {category}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="premium-card p-8 text-center text-[#475467]">
            No projects in this category yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <article key={project.id} className="premium-card overflow-hidden">
                <div className="relative">
                  <PortfolioThumb category={project.category} title={project.title} />
                  {project.isPlaceholder ? (
                    <span className="absolute top-3 left-3 z-10 rounded-md bg-[#101828]/85 px-2 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">
                      Design Placeholder
                    </span>
                  ) : null}
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold tracking-wide text-[#00A8CC] uppercase">
                    {project.category}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold text-[#101828]">
                    {project.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#475467]">{project.description}</p>
                  {project.technologies?.length ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <li
                          key={tech}
                          className="rounded-md border border-[#101828]/10 bg-[#F4F6FA] px-2 py-1 text-[11px] font-medium text-[#475467]"
                        >
                          {tech}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <a
                    href={getWhatsAppLink(
                      `Hello Jarcode Technology, I would like to discuss a project similar to: ${project.title}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex text-sm font-semibold text-[#8055FF]"
                  >
                    Discuss Similar Project →
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
