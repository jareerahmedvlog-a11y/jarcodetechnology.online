import { resolveAiActor, usageSubject } from "@/lib/jarcode-ai/actor";
import { maxUploadBytes } from "@/lib/jarcode-ai/config";
import { saveUploadBuffer } from "@/lib/jarcode-ai/uploads";
import { checkAiBudget } from "@/lib/jarcode-ai/usage";
import { rateLimit } from "@/lib/demos/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon"
  );
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`ai-upload:${ip}`, 20, 60_000);
  if (!limited.ok) {
    return Response.json(
      { ok: false, error: `Too many uploads. Retry in ${limited.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  const budget = await checkAiBudget("file");
  if (!budget.ok) {
    return Response.json({ ok: false, error: budget.reason }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ ok: false, error: "Invalid multipart form." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "Missing file." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const actor = await resolveAiActor();
    const meta = await saveUploadBuffer({
      originalName: file.name || "upload.bin",
      mime: file.type || "application/octet-stream",
      buffer: buf,
    });
    return Response.json({
      ok: true,
      file: {
        id: meta.id,
        name: meta.originalName,
        mime: meta.mime,
        size: meta.size,
        isImage: meta.isImage,
        isVideo: meta.isVideo,
      },
      subject: usageSubject(actor),
      maxUploadBytes: maxUploadBytes(),
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Upload failed.",
      },
      { status: 400 },
    );
  }
}
