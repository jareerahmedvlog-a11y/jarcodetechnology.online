import { DEMO_WARNING } from "@/config/demos";

export function DemoWarning() {
  return (
    <div
      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900"
      role="note"
    >
      {DEMO_WARNING}
    </div>
  );
}
