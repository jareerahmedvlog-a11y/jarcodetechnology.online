"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { searchSite } from "@/config/search";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileSearch({ open, onClose }: Props) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchSite(query), [query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] xl:hidden" role="dialog" aria-modal aria-labelledby={titleId}>
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close search"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 top-0 border-b border-border bg-[#07070c] p-4 pt-[max(1rem,env(safe-area-inset-top))] shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id={titleId} className="font-display text-base font-semibold text-text">
            Search Jarcode
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border text-text"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <label htmlFor="site-search" className="sr-only">
          Search
        </label>
        <input
          id="site-search"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Services, demos, portfolio…"
          className="w-full rounded-2xl border border-border bg-[#0a0a12] px-4 py-3.5 text-base text-text outline-none focus:border-cyan-400/50"
        />
        <div className="mt-3 max-h-[55vh] overflow-y-auto">
          {!query.trim() ? (
            <p className="px-1 py-3 text-sm text-text-muted">
              Search services, demos, portfolio, and pages.
            </p>
          ) : results.length === 0 ? (
            <p className="px-1 py-3 text-sm text-text-muted">No matches found.</p>
          ) : (
            <ul className="space-y-1 pb-2">
              {results.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "block rounded-2xl px-3 py-3 transition-colors hover:bg-white/5",
                    )}
                  >
                    <p className="text-[11px] font-semibold tracking-wide text-cyan-300 uppercase">
                      {item.group}
                    </p>
                    <p className="mt-0.5 font-medium text-text">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-text-muted">
                      {item.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
