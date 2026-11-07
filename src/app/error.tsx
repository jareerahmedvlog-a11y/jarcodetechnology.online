"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-text">Page could not load</h1>
      <p className="text-sm text-text-muted">
        Something went wrong while opening this page. Your data is safe — try again.
      </p>
      <button type="button" className="btn-primary !w-auto" onClick={() => reset()}>
        Try again
      </button>
      <a href="/" className="text-sm text-cyan-300">
        Go to Home
      </a>
    </div>
  );
}
