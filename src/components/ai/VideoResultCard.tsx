"use client";

type VideoMeta = {
  jobId: string;
  status: string;
  videoUrl?: string;
  durationSec?: number;
  resolution?: string;
  aspectRatio?: string;
  provider?: string;
  model?: string;
  error?: string;
};

export function VideoResultCard({
  meta,
  onRegenerate,
  onCreateAnother,
}: {
  meta: VideoMeta;
  onRegenerate?: () => void;
  onCreateAnother?: () => void;
}) {
  const busy = meta.status === "queued" || meta.status === "processing";

  return (
    <div className="mt-3 space-y-3">
      {busy ? (
        <div className="rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-muted)] px-4 py-6 text-center">
          <p className="animate-pulse text-sm text-[var(--ai-heading)]">
            Generating video… ({meta.status})
          </p>
          <p className="mt-1 text-xs text-[var(--ai-muted)]">
            You can keep chatting — this runs in the background.
          </p>
        </div>
      ) : null}

      {meta.status === "failed" || meta.status === "cancelled" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {meta.error || `Video ${meta.status}.`}
        </div>
      ) : null}

      {meta.status === "completed" && meta.videoUrl ? (
        <div className="overflow-hidden rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg)]">
          <video
            src={meta.videoUrl}
            controls
            playsInline
            className="max-h-[28rem] w-full bg-[#111827]"
            preload="metadata"
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-[11px] text-[var(--ai-muted)]">
            {meta.durationSec ? <span>{meta.durationSec}s</span> : null}
            {meta.resolution ? <span>{meta.resolution}</span> : null}
            {meta.aspectRatio ? <span>{meta.aspectRatio}</span> : null}
            {meta.provider ? <span>Provider: {meta.provider}</span> : null}
            {meta.model ? <span>{meta.model}</span> : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3 text-[11px] text-[var(--ai-muted)]">
        {meta.videoUrl ? (
          <a
            href={`${meta.videoUrl}${meta.videoUrl.includes("?") ? "&" : "?"}download=1`}
            className="ai-link"
            download
          >
            Download Video
          </a>
        ) : null}
        {onRegenerate ? (
          <button type="button" onClick={onRegenerate}>
            Regenerate Video
          </button>
        ) : null}
        {onCreateAnother ? (
          <button type="button" onClick={onCreateAnother}>
            Create Another Video
          </button>
        ) : null}
      </div>
    </div>
  );
}
