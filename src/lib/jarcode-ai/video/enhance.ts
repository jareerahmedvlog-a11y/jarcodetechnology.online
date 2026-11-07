import OpenAI from "openai";
import { openaiApiKey, workspaceModel } from "@/lib/jarcode-ai/config";

/** Use OpenAI to expand a short user idea into a cinematic video prompt for Luma. */
export async function enhanceVideoPrompt(opts: {
  prompt: string;
  mode: "text" | "image";
  aspectRatio: string;
  durationSec: number;
}) {
  const key = openaiApiKey();
  if (!key) return opts.prompt;

  const client = new OpenAI({ apiKey: key });
  const system = `You improve prompts for AI video generation (Luma Dream Machine).
Return ONLY the improved prompt text — no quotes, no markdown, no preamble.
Keep under 1200 characters.
Include camera motion, lighting, mood, subject clarity, and pacing.
Preserve the user's intent and brand/product details.
Aspect ratio: ${opts.aspectRatio}. Duration: ~${opts.durationSec}s.
${opts.mode === "image" ? "This is IMAGE-TO-VIDEO: keep the reference subject's identity and framing; describe motion and camera only." : "This is TEXT-TO-VIDEO."}`;

  try {
    const res = await client.chat.completions.create({
      model: workspaceModel(),
      temperature: 0.5,
      max_tokens: 500,
      messages: [
        { role: "system", content: system },
        { role: "user", content: opts.prompt.slice(0, 2000) },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim();
    return text && text.length > 20 ? text.slice(0, 4000) : opts.prompt;
  } catch {
    return opts.prompt;
  }
}
