"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CreateDemoStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY || document.documentElement.scrollTop;
      setVisible(y > 320);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 flex justify-center px-3 transition-all duration-300",
        // Clear mobile bottom nav (~4.5rem) + safe area
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
      aria-hidden={!visible}
    >
      <Link
        href="/create-your-demo/builder"
        className={cn(
          "pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full border border-[#101828]/12 bg-[#101828] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20",
          "hover:bg-[#1D2939] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A8CC]",
          !visible && "pointer-events-none",
        )}
        tabIndex={visible ? 0 : -1}
      >
        <span className="truncate">Have a Different Business? Create Your Own Demo →</span>
      </Link>
    </div>
  );
}
