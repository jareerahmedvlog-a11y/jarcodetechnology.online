"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#000", color: "#f8fafc", fontFamily: "system-ui", padding: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>JARCODE TECHNOLOGY</h1>
        <p style={{ opacity: 0.8, marginBottom: 16 }}>
          The site hit a temporary problem. Please reload.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            background: "linear-gradient(135deg,#00d4ff,#7c5cff)",
            border: 0,
            borderRadius: 12,
            padding: "12px 18px",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
