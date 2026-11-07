import { resolveAiActor } from "@/lib/jarcode-ai/actor";
import { chatModel, realtimeModel, voiceMaxMinutes } from "@/lib/jarcode-ai/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await resolveAiActor();
  return Response.json({
    ok: true,
    role: actor.role,
    label: actor.label,
    models: {
      chat: chatModel(),
      realtime: realtimeModel(),
    },
    voiceMaxMinutes: voiceMaxMinutes(),
    privacy:
      "Microphone audio is processed for the live session and is not stored as raw recordings by JARCODE by default. Permanent OpenAI API keys never leave the server.",
  });
}
