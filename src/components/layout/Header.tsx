"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { MobileSearch } from "@/components/layout/MobileSearch";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-[background,box-shadow,border-color] duration-200",
          scrolled
            ? "border-[#101828]/10 bg-white/95 shadow-sm backdrop-blur-md"
            : "border-transparent bg-white/90 backdrop-blur-sm",
        )}
      >
        <Container className="flex h-[var(--header-h)] items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
            <Image
              src={siteConfig.logo.mark}
              alt={siteConfig.logo.alt}
              width={40}
              height={40}
              className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
              priority
            />
            <span className="hidden min-w-0 font-display text-[15px] font-bold tracking-tight text-[#101828] sm:block">
              JARCODE <span className="font-semibold text-[#475467]">TECHNOLOGY</span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-0.5 xl:flex"
            aria-label="Primary"
          >
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold text-[#475467] transition-colors hover:bg-[#F4F6FA] hover:text-[#101828]"
              >
                {item.label}
              </Link>
            ))}

            <div className="relative" ref={moreRef}>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors",
                  moreOpen
                    ? "bg-[#F4F6FA] text-[#101828]"
                    : "text-[#475467] hover:bg-[#F4F6FA] hover:text-[#101828]",
                )}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                onClick={() => setMoreOpen((v) => !v)}
              >
                More
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                  <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                </svg>
              </button>
              {moreOpen ? (
                <div
                  role="menu"
                  className="absolute top-[calc(100%+0.4rem)] right-0 z-50 min-w-[11.5rem] overflow-hidden rounded-xl border border-[#101828]/10 bg-white py-1.5 shadow-xl shadow-[#101828]/10"
                >
                  {siteConfig.moreNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className="block px-3.5 py-2.5 text-sm font-medium text-[#344054] hover:bg-[#F4F6FA]"
                      onClick={() => setMoreOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-[#475467] hover:bg-[#F4F6FA] hover:text-[#101828]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19" strokeLinecap="round" />
              </svg>
              Login
            </Link>
            <Link
              href="/#contact"
              className="btn-primary !min-h-10 !w-auto !rounded-lg px-4 py-2 text-[13px]"
            >
              Get Started
            </Link>
          </div>

          <div className="flex items-center gap-2 xl:hidden">
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg border border-[#101828]/10 px-3 text-sm font-semibold text-[#101828]"
            >
              Login
            </Link>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#101828]/10 text-[#101828]"
              aria-label="Search website"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </Container>
      </header>

      <MobileSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
