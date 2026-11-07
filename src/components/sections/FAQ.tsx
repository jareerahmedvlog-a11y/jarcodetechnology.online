"use client";

import { useId, useState } from "react";
import { faqs } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

function AccordionItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const buttonId = useId();

  return (
    <div className="premium-card">
      <h3>
        <button
          id={buttonId}
          type="button"
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[#101828]"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="font-display text-base font-semibold text-text sm:text-lg">
            {question}
          </span>
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-indigo-300 transition-transform",
              open && "rotate-45",
            )}
            aria-hidden
          >
            +
          </span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className="px-5 pb-5"
      >
        <p className="text-sm leading-relaxed text-text-muted sm:text-base">
          {answer}
        </p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section-light section-pad" aria-labelledby="faq-heading">
      <Container>
        <SectionHeading
          id="faq-heading"
          eyebrow="FAQ"
          title="Questions Customers Often Ask"
        />

        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((item, index) => (
            <AccordionItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              open={openIndex === index}
              onToggle={() =>
                setOpenIndex((current) => (current === index ? null : index))
              }
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
