import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { openaiApiKey } from "@/lib/jarcode-ai/config";
import {
  buildIdentityImagePrompt,
  isIdentitySceneEdit,
  selectImageModel,
} from "@/lib/jarcode-ai/routing";
import {
  generatedImagePath,
  readUploadBytes,
  saveGeneratedImagePng,
} from "@/lib/jarcode-ai/uploads";

const SIZE_MAP: Record<string, "1024x1024" | "1024x1536" | "1536x1024"> = {
  "1:1": "1024x1024",
  "4:5": "1024x1536",
  "9:16": "1024x1536",
  "16:9": "1536x1024",
};

export type ImageGenerateResult =
  | {
      ok: true;
      imageUrl: string;
      imageDataUrl: string;
      imageId: string;
      reply: string;
      model: string;
      action: "generate" | "edit";
    }
  | { ok: false; error: string; detail?: string; status: number };

/** Real OpenAI Images API generate/edit — shared by workspace + floating chat. */
export async function generateOrEditImage(opts: {
  prompt: string;
  aspectRatio?: string;
  quality?: string;
  action?: "generate" | "edit";
  fileId?: string;
}): Promise<ImageGenerateResult> {
  const apiKey = openaiApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: "OpenAI API key is not configured on the server.",
      status: 503,
    };
  }

  const prompt = String(opts.prompt || "").trim();
  if (!prompt) {
    return { ok: false, error: "Please enter an image prompt.", status: 400 };
  }

  const fileId = String(opts.fileId || "");
  const loaded = fileId ? await readUploadBytes(fileId) : null;
  const hasImage = Boolean(loaded?.meta.isImage);

  let action: "generate" | "edit" =
    opts.action === "edit" || (opts.action !== "generate" && hasImage) ? "edit" : "generate";
  if (hasImage && isIdentitySceneEdit(prompt, true)) action = "edit";
  if (action === "edit" && !hasImage) {
    return {
      ok: false,
      error: "Upload a reference photo first to edit or place yourself in a scene.",
      status: 400,
    };
  }

  const model = selectImageModel(action);
  const size = SIZE_MAP[String(opts.aspectRatio || "1:1")] || "1024x1024";
  const qualityRaw = String(opts.quality || "high");
  const quality =
    qualityRaw === "low" || qualityRaw === "medium" || qualityRaw === "standard"
      ? qualityRaw === "standard"
        ? "medium"
        : (qualityRaw as "low" | "medium")
      : "high";

  const enhancedPrompt =
    action === "edit" && isIdentitySceneEdit(prompt, true)
      ? buildIdentityImagePrompt(prompt)
      : action === "edit"
        ? `${prompt}\n\nKeep photorealistic quality, natural lighting, balanced exposure, and correct proportions. Avoid distorted faces or hands.`
        : `${prompt}\n\nProfessional photography quality: natural lighting, balanced exposure, realistic shadows, sharp details, correct perspective.`;

  const client = new OpenAI({ apiKey });

  try {
    let b64 = "";
    if (action === "edit" && loaded) {
      const edited = await client.images.edit({
        model,
        image: await toFile(loaded.buf, loaded.meta.originalName, {
          type: loaded.meta.mime || "image/png",
        }),
        prompt: enhancedPrompt,
        size,
        quality: quality as "high" | "medium" | "low",
      });
      b64 = edited.data?.[0]?.b64_json || "";
    } else {
      const generated = await client.images.generate({
        model,
        prompt: enhancedPrompt,
        size,
        quality: quality as "high" | "medium" | "low",
        output_format: "png",
      });
      b64 = generated.data?.[0]?.b64_json || "";
    }

    if (!b64) {
      return {
        ok: false,
        error: "Image generation returned no image from OpenAI.",
        status: 502,
      };
    }

    const buf = Buffer.from(b64, "base64");
    const saved = await saveGeneratedImagePng(buf, action === "edit" ? "edited" : "generated");
    const imageUrl = generatedImagePath(saved.id);
    const reply =
      action === "edit"
        ? "Here’s your edited image (from your uploaded photo)."
        : "Here’s your generated image.";

    return {
      ok: true,
      imageUrl,
      imageDataUrl: `data:image/png;base64,${b64}`,
      imageId: saved.id,
      reply,
      model,
      action,
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    const safe =
      /quota|billing|insufficient/i.test(detail)
        ? "OpenAI billing/quota issue for image generation. Check billing on the OpenAI account."
        : /incorrect api key|invalid_api_key|401/i.test(detail)
          ? "OpenAI rejected the server API key for image generation."
          : /model|not found|deprecated|does not exist|unsupported/i.test(detail)
            ? `Image model unavailable (${model}). Set OPENAI_IMAGE_MODEL to a current GPT Image model such as gpt-image-2.6-flare.`
            : /safety|moderation|rejected/i.test(detail)
              ? "OpenAI safety filters blocked this image request. Try a different prompt or photo."
              : `Image generation failed: ${detail.slice(0, 180)}`;
    return { ok: false, error: safe, detail: detail.slice(0, 240), status: 502 };
  }
}
