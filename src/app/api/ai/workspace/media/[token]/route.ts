import { readUploadBytes } from "@/lib/jarcode-ai/uploads";
import { verifyMediaToken } from "@/lib/jarcode-ai/video/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

/** Temporary public media for video providers (Luma needs a fetchable image URL). */
export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const decoded = verifyMediaToken(decodeURIComponent(token));
  if (!decoded) {
    return Response.json({ ok: false, error: "Invalid or expired media token." }, { status: 403 });
  }
  if (!decoded.p.startsWith("upload:")) {
    return Response.json({ ok: false, error: "Unsupported media." }, { status: 400 });
  }
  const uploadId = decoded.p.slice("upload:".length);
  const loaded = await readUploadBytes(uploadId);
  if (!loaded?.meta.isImage) {
    return Response.json({ ok: false, error: "Image not found." }, { status: 404 });
  }

  return new Response(new Uint8Array(loaded.buf), {
    headers: {
      "Content-Type": loaded.meta.mime || "image/png",
      "Cache-Control": "private, max-age=300",
      "Content-Length": String(loaded.buf.length),
    },
  });
}
