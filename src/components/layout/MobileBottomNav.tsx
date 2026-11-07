"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { getWhatsAppLink, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type TabId = "home" | "services" | "demo" | "ai" | "more";

const moreLinks = [
  { label: "AI by JARCODE", href: "/ai", icon: "ai" },
  { label: "Client Login", href: "/login", icon: "user" },
  { label: "About Us", href: "/#about", icon: "about" },
  { label: "Our Work", href: "/#work", icon: "work" },
  { label: "Achievements", href: "/#achievements", icon: "trophy" },
  { label: "Founder", href: "/#founder", icon: "user" },
  { label: "FAQ", href: "/#faq", icon: "faq" },
  { label: "Society Demo", href: "/create-your-demo/society", icon: "demo" },
  { label: "Hospital Demo", href: "/create-your-demo/hospital", icon: "demo" },
  { label: "Create Your Own Demo", href: "/create-your-demo/builder", icon: "demo" },
  { label: "Privacy Policy", href: "/privacy", icon: "doc" },
  { label: "Terms of Service", href: "/terms", icon: "doc" },
] as const;

function IconHome({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconServices({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconDemo({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} aria-hidden>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
      <path d="M10 9.5v4l4-2-4-2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconContact({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} aria-hidden>
      <path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.6-4.3A8.5 8.5 0 1 1 21 12z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMore({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r={active ? 1.7 : 1.4} />
      <circle cx="12" cy="12" r={active ? 1.7 : 1.4} />
      <circle cx="19" cy="12" r={active ? 1.7 : 1.4} />
    </svg>
  );
}

function MoreIcon({ name }: { name: string }) {
  const common = "h-5 w-5 text-cyan-300";
  switch (name) {
    case "about":
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7h.01" strokeLinecap="round" /></svg>;
    case "work":
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
    case "trophy":
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H5a2 2 0 0 0 0 4h2M17 6h2a2 2 0 0 1 0 4h-2" strokeLinecap="round" /></svg>;
    case "user":
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.5" /><path d="M5 19a7 7 0 0 1 14 0" strokeLinecap="round" /></svg>;
    case "faq":
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.8 2.1c-.8.5-1.3 1-1.3 2M12 16h.01" strokeLinecap="round" /></svg>;
    case "demo":
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M10 9.5v4l4-2-4-2z" fill="currentColor" stroke="none" /></svg>;
    case "ai":
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3.5" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeLinecap="round" /></svg>;
    default:
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 4h10v16H7zM9 8h6M9 12h6M9 16h4" strokeLinecap="round" /></svg>;
  }
}

function resolveActive(pathname: string, hash: string): TabId {
  if (pathname.startsWith("/ai")) return "ai";
  if (pathname.startsWith("/create-your-demo")) return "demo";
  if (pathname === "/privacy" || pathname === "/terms" || pathname === "/login") return "more";
  if (pathname === "/" || pathname === "") {
    if (hash === "#services") return "services";
    if (
      hash === "#about" ||
      hash === "#work" ||
      hash === "#achievements" ||
      hash === "#founder" ||
      hash === "#faq" ||
      hash === "#contact"
    ) {
      return "more";
    }
    return "home";
  }
  return "more";
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetId = useId();
  const active = resolveActive(pathname, hash);

  useEffect(() => {
    const sync = () => setHash(window.location.hash || "");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname, hash]);

  useEffect(() => {
    document.body.style.overflow = moreOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  const tabs: Array<{
    id: TabId;
    label: string;
    href?: string;
    onClick?: () => void;
  }> = [
    { id: "home", label: "Home", href: "/" },
    { id: "services", label: "Services", href: "/#services" },
    { id: "demo", label: "Create Demo", href: "/create-your-demo" },
    { id: "ai", label: "AI", href: "/ai" },
    {
      id: "more",
      label: "More",
      onClick: () => setMoreOpen(true),
    },
  ];

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 xl:hidden"
        aria-label="Mobile primary"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto max-w-lg px-3 pb-2 pt-1">
          <div className="rounded-[1.35rem] border border-[#101828]/10 bg-white/95 shadow-[0_-8px_28px_rgba(16,24,40,0.12)] backdrop-blur-xl">
            <ul className="grid grid-cols-5 gap-0.5 px-1.5 py-1.5">
              {tabs.map((tab) => {
                const isActive = active === tab.id || (tab.id === "more" && moreOpen);
                const content = (
                  <>
                    <span
                      className={cn(
                        "relative inline-flex h-9 w-9 items-center justify-center rounded-xl",
                        (tab.id === "demo" || tab.id === "ai") &&
                          "bg-[#101828] text-white",
                        isActive && tab.id !== "demo" && tab.id !== "ai" && "bg-[#F4F6FA] text-[#00A8CC]",
                        !isActive && tab.id !== "demo" && tab.id !== "ai" && "text-[#667085]",
                      )}
                    >
                      {tab.id === "home" && <IconHome active={isActive} />}
                      {tab.id === "services" && <IconServices active={isActive} />}
                      {tab.id === "demo" && <IconDemo active={isActive} />}
                      {tab.id === "ai" && (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.2 : 1.8} aria-hidden>
                          <circle cx="12" cy="12" r="3.5" />
                          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeLinecap="round" />
                        </svg>
                      )}
                      {tab.id === "more" && <IconMore active={isActive} />}
                      {isActive ? (
                        <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-cyan-300" />
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 text-[10px] font-semibold tracking-wide",
                        isActive ? "text-[#101828]" : "text-[#667085]",
                        (tab.id === "demo" || tab.id === "ai") && "text-[#101828]",
                      )}
                    >
                      {tab.label}
                    </span>
                  </>
                );

                if (tab.href) {
                  return (
                    <li key={tab.id}>
                      <Link
                        href={tab.href}
                        onClick={() => setMoreOpen(false)}
                        className="flex min-h-14 touch-manipulation flex-col items-center justify-center rounded-2xl px-1 py-1 active:bg-white/5"
                        aria-current={isActive ? "page" : undefined}
                      >
                        {content}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={tab.id}>
                    <button
                      type="button"
                      onClick={tab.onClick}
                      className="flex min-h-14 w-full touch-manipulation flex-col items-center justify-center rounded-2xl px-1 py-1 active:bg-white/5"
                      aria-expanded={moreOpen}
                      aria-controls={sheetId}
                    >
                      {content}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-[60] xl:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 touch-manipulation"
            aria-label="Close more menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            id={sheetId}
            role="dialog"
            aria-modal="true"
            aria-label="More navigation"
            className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-hidden rounded-t-3xl border border-[#101828]/10 bg-white shadow-2xl"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="font-display text-base font-semibold text-text">More</p>
                <p className="text-xs text-text-muted">All remaining pages & links</p>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-xl border border-border text-text"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div
              className="overflow-y-auto overscroll-contain px-3 py-3"
              style={{ maxHeight: "calc(78vh - 5rem)" }}
            >
              <ul className="space-y-1">
                {moreLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className="flex min-h-12 touch-manipulation items-center gap-3 rounded-2xl px-3 py-3 text-text active:bg-white/10"
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                        <MoreIcon name={item.icon} />
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-3 grid gap-2 border-t border-border pt-3">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMoreOpen(false)}
                  className="flex min-h-12 touch-manipulation items-center justify-center rounded-2xl bg-[#25D366]/15 px-4 py-3 text-sm font-semibold text-[#128C7E]"
                >
                  Chat on WhatsApp
                </a>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={siteConfig.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMoreOpen(false)}
                    className="rounded-2xl border border-border px-3 py-3 text-center text-sm font-medium text-text-muted touch-manipulation"
                  >
                    Instagram
                  </a>
                  <a
                    href={siteConfig.social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMoreOpen(false)}
                    className="rounded-2xl border border-border px-3 py-3 text-center text-sm font-medium text-text-muted touch-manipulation"
                  >
                    YouTube
                  </a>
                </div>
                <Link
                  href="/#contact"
                  onClick={() => setMoreOpen(false)}
                  className="btn-primary mt-1 touch-manipulation text-center"
                >
                  Get a Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
