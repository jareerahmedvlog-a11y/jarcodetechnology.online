type ThumbProps = {
  category: string;
  title: string;
};

const accents: Record<string, string> = {
  "ERP Systems": "from-cyan-400/30 via-blue-500/20 to-violet-500/30",
  "CRM Solutions": "from-violet-400/30 via-fuchsia-500/20 to-cyan-400/20",
  Websites: "from-blue-400/30 via-indigo-500/20 to-purple-500/30",
  "Mobile Apps": "from-fuchsia-400/30 via-violet-500/20 to-cyan-400/25",
  "Custom Software": "from-cyan-300/25 via-indigo-400/25 to-violet-500/30",
  Automation: "from-indigo-400/30 via-cyan-400/20 to-fuchsia-500/25",
};

function MockUi({ category }: { category: string }) {
  if (category === "Mobile Apps") {
    return (
      <div className="mx-auto flex h-full items-center justify-center">
        <div className="h-[78%] w-[34%] rounded-[1.25rem] border border-white/15 bg-black/50 p-2 shadow-xl">
          <div className="h-full rounded-xl bg-gradient-to-b from-white/10 to-white/5 p-2">
            <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-white/20" />
            <div className="mb-2 h-2 w-2/3 rounded bg-cyan-300/70" />
            <div className="mb-2 h-16 rounded-lg bg-white/10" />
            <div className="h-10 rounded-lg bg-violet-400/40" />
          </div>
        </div>
      </div>
    );
  }

  if (category === "Automation") {
    return (
      <div className="flex h-full items-center justify-center gap-3 px-6">
        {["In", "Flow", "Out"].map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-4 text-center">
              <div className="mx-auto mb-2 h-2 w-8 rounded bg-gradient-to-r from-cyan-300 to-violet-400" />
              <p className="text-[10px] text-white/70">{label}</p>
            </div>
            {i < 2 ? (
              <span className="text-cyan-300/70" aria-hidden>
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-red-400/80" />
        <span className="h-2 w-2 rounded-full bg-amber-400/80" />
        <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
        <span className="ml-2 h-2 flex-1 rounded bg-white/10" />
      </div>
      <div className="grid flex-1 grid-cols-3 gap-2">
        <div className="rounded-lg bg-black/35 p-2">
          <div className="mb-2 h-1.5 w-10 rounded bg-cyan-300/70" />
          <div className="space-y-1.5">
            <div className="h-1.5 w-full rounded bg-white/10" />
            <div className="h-1.5 w-4/5 rounded bg-white/10" />
            <div className="h-1.5 w-3/5 rounded bg-white/10" />
          </div>
        </div>
        <div className="col-span-2 grid grid-rows-2 gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-black/35 p-2">
              <div className="h-1.5 w-8 rounded bg-violet-300/70" />
              <div className="mt-2 h-6 rounded bg-white/10" />
            </div>
            <div className="rounded-lg bg-black/35 p-2">
              <div className="h-1.5 w-8 rounded bg-fuchsia-300/70" />
              <div className="mt-2 h-6 rounded bg-white/10" />
            </div>
          </div>
          <div className="flex items-end gap-1 rounded-lg bg-black/35 p-2">
            {[40, 65, 48, 80, 55, 90, 70].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-cyan-400/50 to-violet-500/80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortfolioThumb({ category, title }: ThumbProps) {
  const gradient = accents[category] || accents["Custom Software"];

  return (
    <div
      className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${gradient}`}
      role="img"
      aria-label={`${title} preview`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,212,255,0.18),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(192,38,255,0.16),transparent_40%)]" />
      <div className="absolute inset-3 rounded-xl border border-white/10 bg-[#07070c]/75 backdrop-blur-sm">
        <MockUi category={category} />
      </div>
    </div>
  );
}
