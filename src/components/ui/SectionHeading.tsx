import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  id,
  tone = "light",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
  id?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        "mb-10 md:mb-12",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl text-left",
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "mb-3 text-xs font-semibold tracking-[0.2em] uppercase sm:text-sm",
            tone === "dark" ? "text-cyan-300" : "text-[#00A8CC]",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className={cn(
          "font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl",
          tone === "dark" ? "text-white" : "text-[#101828]",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            tone === "dark" ? "text-[#98A2B3]" : "text-[#475467]",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
