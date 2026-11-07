"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomDemoWorkspace } from "@/components/demos/CustomDemoWorkspace";
import type { CustomDemoBundle } from "@/lib/custom-demos/types";

const storageKey = (slug: string) => `jarcode-custom-demo:${slug}`;

export function stashCustomDemoBundle(bundle: CustomDemoBundle) {
  try {
    sessionStorage.setItem(storageKey(bundle.config.slug), JSON.stringify(bundle));
    sessionStorage.setItem(storageKey(bundle.config.id), JSON.stringify(bundle));
  } catch {
    /* ignore quota */
  }
}

type Props = { slug: string };

export function CustomDemoClientLoader({ slug }: Props) {
  const [bundle, setBundle] = useState<CustomDemoBundle | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const cached = sessionStorage.getItem(storageKey(slug));
        if (cached) {
          const parsed = JSON.parse(cached) as CustomDemoBundle;
          if (!cancelled) setBundle(parsed);
        }
      } catch {
        /* ignore */
      }

      try {
        const res = await fetch(
          `/api/custom-demos?slug=${encodeURIComponent(slug)}`,
          { cache: "no-store" },
        );
        const json = (await res.json()) as {
          ok?: boolean;
          bundle?: CustomDemoBundle;
        };
        if (json.ok && json.bundle) {
          stashCustomDemoBundle(json.bundle);
          if (!cancelled) setBundle(json.bundle);
          return;
        }
      } catch {
        /* ignore */
      }

      if (!cancelled) {
        setFailed((prev) => {
          // keep showing cached bundle if we already have one
          return prev;
        });
        setBundle((current) => {
          if (current) return current;
          setFailed(true);
          return null;
        });
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (bundle) {
    return (
      <CustomDemoWorkspace
        initialConfig={bundle.config}
        initialData={bundle.data}
      />
    );
  }

  if (failed) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-sm font-semibold tracking-wide text-[#667085] uppercase">
          Demo not found
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold text-[#101828]">
          This demo link is unavailable
        </h1>
        <p className="mt-3 text-[#475467]">
          Create a new demo from the builder. On Vercel, add Blob storage so demos
          stay available for every visitor.
        </p>
        <Link href="/create-your-demo/builder" className="btn-primary mt-8 inline-flex">
          Create Your Demo
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="animate-pulse text-[#667085]">Loading demo…</p>
    </main>
  );
}
