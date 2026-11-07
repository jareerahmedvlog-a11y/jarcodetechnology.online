import { readUploadBytes } from "@/lib/jarcode-ai/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const loaded = await readUploadBytes(id);
  if (!loaded?.meta.isImage) {
    return Response.json({ ok: false, error: "Image not found." }, { status: 404 });
  }
  return new Response(new Uint8Array(loaded.buf), {
    headers: {
      "Content-Type": loaded.meta.mime || "image/png",
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${loaded.meta.originalName.replace(/"/g, "")}"`,
    },
  });
}
