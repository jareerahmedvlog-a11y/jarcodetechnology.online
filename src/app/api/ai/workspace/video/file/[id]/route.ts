import { loadVideoJob, readVideoBuffer } from "@/lib/jarcode-ai/video/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";

  const job = await loadVideoJob(id);
  if (!job || job.status !== "completed" || !job.localPath) {
    return Response.json({ ok: false, error: "Video not available." }, { status: 404 });
  }
  // Unguessable access token is the authorization (cookie may be absent on <video> range requests)
  if (!token || token !== job.accessToken) {
    return Response.json({ ok: false, error: "Invalid download token." }, { status: 403 });
  }

  if (new Date(job.expiresAt).getTime() < Date.now()) {
    return Response.json({ ok: false, error: "This video has expired." }, { status: 410 });
  }

  const buf = await readVideoBuffer(job);
  if (!buf) {
    return Response.json({ ok: false, error: "Video file missing." }, { status: 404 });
  }

  const download = url.searchParams.get("download") === "1";
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(buf.length),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": download
        ? `attachment; filename="jarcode-ai-${job.id.slice(0, 8)}.mp4"`
        : `inline; filename="jarcode-ai-${job.id.slice(0, 8)}.mp4"`,
    },
  });
}
