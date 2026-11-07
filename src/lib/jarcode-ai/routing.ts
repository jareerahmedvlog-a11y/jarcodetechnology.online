import {
  capableChatModel,
  fastChatModel,
  imageEditModel,
  imageModel,
} from "@/lib/jarcode-ai/config";

export type AnswerStyle = "default" | "short" | "detailed" | "steps" | "easy" | "exam";

export type RequestComplexity = "simple" | "complex" | "image" | "study";

export type MediaIntent = "image" | "video" | null;

/** Normalize typos / spacing so "CREAT IMAG" still routes to image generation. */
function normalizeMediaText(message: string) {
  let t = String(message || "")
    .toLowerCase()
    .replace(/[_*#`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const fixes: Array<[RegExp, string]> = [
    [/\bcreat(?:e|ing|es)?\b/g, "create"],
    [/\bgen(?:e)?rat(?:e|ing|es|ion)?\b/g, "generate"],
    [/\bimag(?:e|es|ing)?\b/g, "image"],
    [/\bpict(?:u)?r(?:e|es)?\b/g, "picture"],
    [/\bphot(?:o|os|ograph|ographs)?\b/g, "photo"],
    [/\bposter?s?\b/g, "poster"],
    [/\bthumb(?:nail|nal)?s?\b/g, "thumbnail"],
    [/\bbanner?s?\b/g, "banner"],
    [/\badvert(?:isement|isment|ise)?s?\b/g, "advertisement"],
    [/\bback\s*ground\b/g, "background"],
    [/\bcinemat(?:ic|ick)?\b/g, "cinematic"],
    [/\bportrai?t?s?\b/g, "portrait"],
  ];
  for (const [re, rep] of fixes) t = t.replace(re, rep);
  return t;
}

function compactAlpha(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Detect create/edit image or generate video intents from plain chat text. */
export function detectMediaIntent(
  message: string,
  opts?: { hasImageAttachment?: boolean },
): MediaIntent {
  const raw = String(message || "").trim();
  if (!raw) return null;
  const text = normalizeMediaText(raw);
  const compact = compactAlpha(text);

  // Prefer video when both could match (e.g. "animate this image into a video")
  const video =
    /\b(create|generate|make|produce|render|animate)\b.{0,60}\b(video|reel|clip|commercial|promo(tional)?\s+video|cinematic\s+video)\b/i.test(
      text,
    ) ||
    /\b(text[- ]to[- ]video|image[- ]to[- ]video|convert .{0,40} (into|to) (a )?video|animate (my |this |the )?(photo|picture|image|photograph))\b/i.test(
      text,
    ) ||
    /\b(10|5|9)[-\s]?second\b.{0,40}\bvideo\b/i.test(text) ||
    /creat\w{0,6}video|generat\w{0,6}video|make\w{0,4}video|texttovideo|imagetovideo/.test(
      compact,
    );
  if (video) return "video";

  const imageNoun =
    /\b(image|picture|photo|photograph|poster|thumbnail|banner|advertisement|ad\b|flyer|artwork|illustration|logo|infographic|cover|wallpaper|selfie)\b/i;
  const imageVerb =
    /\b(create|generate|make|draw|design|produce|render|paint|sketch|illustrate|visualize|visualise|craft)\b/i;
  const fuzzyImage =
    /creat\w{0,6}imag|generat\w{0,6}imag|make\w{0,6}imag|make\w{0,6}pict|make\w{0,6}photo|draw\w{0,6}pict|draw\w{0,6}imag|design\w{0,6}poster|design\w{0,6}banner|makethumbnail|createposter|createbanner|createadvert/.test(
      compact,
    );

  const image =
    fuzzyImage ||
    (imageVerb.test(text) && imageNoun.test(text)) ||
    /\b(i want|i need|can you|please|help me)\b.{0,40}\b(image|picture|photo|photograph|poster|thumbnail|banner|artwork|illustration|logo)\b/i.test(
      text,
    ) ||
    /\b(an?|the)\s+(image|picture|photo|photograph|poster|thumbnail|banner|artwork|illustration)\s+(of|for|with|showing|in|that)\b/i.test(
      text,
    ) ||
    /\b(edit|change|replace|remove|upscale|retouch|enhance|fix|improve)\b.{0,50}\b(image|picture|photo|photograph|background|portrait)\b/i.test(
      text,
    ) ||
    /\b(change|replace|swap|remove)\b.{0,30}\bbackground\b/i.test(text) ||
    /\b(make|put|place)\s+me\b/i.test(text) ||
    /\bme\b.{0,40}\b(stand|standing|sit|sitting|beside|next to|in front of|wearing)\b/i.test(
      text,
    ) ||
    /\b(place|put|stand|standing|sitting)\b.{0,40}\b(me|myself)\b/i.test(text) ||
    /\b(using (this|my|the) (photo|picture|image|photograph)|from my (photo|picture|image|selfie))\b/i.test(
      text,
    ) ||
    /\b(draw|paint|sketch|illustrate)\b\s+(a|an|the|my|this)\b/i.test(text) ||
    /\b(professional|cinematic|studio)\s+(portrait|photo|photograph|image|shot)\b/i.test(text) ||
    /\b(instagram|youtube)\s+(poster|thumbnail|ad|advertisement|banner)\b/i.test(text);

  if (image) return "image";

  // Uploaded photo + transformative instruction → image edit (not vision Q&A)
  if (opts?.hasImageAttachment) {
    const visionQa =
      /\b(what('s| is| are)|who is|who are|describe|explain|read|ocr|transcribe|summariz|how many|count|identify|tell me about|analyze|analyse)\b/i.test(
        text,
      ) &&
      !/\b(make|create|generate|edit|change|put|place|transform|background|portrait|cinematic|beside|in front)\b/i.test(
        text,
      );
    const transform =
      /\b(new scene|luxury|car|office|background|beside|in front of|wearing|transform|portrait|studio|cinematic|edit|change|place|put|make me|stand|sitting|professional|poster|instagram|replace|remove|enhance|retouch|eating|food|scene)\b/i.test(
        text,
      ) ||
      /\b(me|myself|my (photo|picture|image|face|selfie)|this (photo|picture|image)|using this|person is)\b/i.test(
        text,
      );
    if (!visionQa && transform) return "image";
  }

  return null;
}

export function classifyChatRequest(opts: {
  message: string;
  hasFiles?: boolean;
  hasUrl?: boolean;
  answerStyle?: AnswerStyle;
  mode?: string;
}): RequestComplexity {
  const msg = opts.message.trim();
  if (opts.hasFiles || opts.hasUrl) return "complex";
  if (opts.mode === "study") return "study";
  if (
    opts.answerStyle === "detailed" ||
    opts.answerStyle === "steps" ||
    opts.answerStyle === "exam"
  ) {
    return "complex";
  }

  const lower = msg.toLowerCase();
  const complexHints =
    /\b(analyze|compare|critique|research|prove|derive|debug|architect|refactor|long|detailed|chapter|document|essay|thesis|step[- ]by[- ]step|explain why|how does .+ work)\b/i.test(
      msg,
    ) || msg.length > 420;
  const studyHints =
    /\b(mcq|homework|exam|textbook|revision|summary of|summarize (this|the)|fill in the blank|important questions|practice test)\b/i.test(
      msg,
    );
  if (studyHints) return "study";
  if (complexHints) return "complex";

  const simpleHints =
    /^(what is|who is|define|translate|convert|calculate|solve|meaning of|synonym|antonym)\b/i.test(
      lower,
    ) ||
    /^\d[\d\s+\-*/().%x×÷^=]+$/.test(msg.replace(/,/g, "")) ||
    msg.length < 120;
  if (simpleHints) return "simple";
  return msg.length > 220 ? "complex" : "simple";
}

export function selectChatModel(complexity: RequestComplexity) {
  if (complexity === "simple") return fastChatModel();
  return capableChatModel();
}

export function selectImageModel(action: "generate" | "edit") {
  return action === "edit" ? imageEditModel() : imageModel();
}

export function shouldAutoWebSearch(message: string, explicit?: boolean) {
  if (explicit === true) return true;
  if (explicit === false) return false;
  return /\b(latest|today|current|news|202[4-9]|who won|stock price|live score|breaking)\b/i.test(
    message,
  );
}

export function answerStyleInstruction(style?: AnswerStyle) {
  switch (style) {
    case "short":
      return "Answer style: Short Answer — concise and direct (a few sentences or bullets). Keep accuracy.";
    case "detailed":
      return "Answer style: Detailed Explanation — thorough coverage with examples and clear structure.";
    case "steps":
      return "Answer style: Step-by-Step — numbered steps, show working for maths/science.";
    case "easy":
      return "Answer style: Easy Explanation — simple everyday English or Roman Urdu if the user writes that way; define hard words briefly.";
    case "exam":
      return "Answer style: Short Exam Answer — concise points suitable for school exams; include key terms.";
    default:
      return "Answer style: Balanced — clear and useful; expand only when the question needs depth.";
  }
}

/** Detect photo→scene identity edit intent from prompt + attached image. */
export function isIdentitySceneEdit(prompt: string, hasImage: boolean) {
  if (!hasImage) return false;
  return /\b(me|my (photo|picture|face|image|selfie)|using (this|the|my) (photo|image|picture)|put me|place me|make me|transform me|standing|sitting|wearing|beside|next to|in front of|background|scene)\b/i.test(
    prompt,
  );
}

export function buildIdentityImagePrompt(userPrompt: string) {
  return `${userPrompt.trim()}

CRITICAL IDENTITY & PHOTOGRAPHY CONSTRAINTS:
- Treat the uploaded photograph as the primary visual reference for the person.
- Preserve recognizable facial identity: facial structure, eyes, nose, lips, jawline, skin tone, and distinctive features.
- Preserve the original hairstyle unless the user explicitly requests a change.
- Do not change apparent age or turn the person into a different-looking individual.
- Avoid heavy beautification, artificial skin smoothing, distorted features, blurry eyes, or wrong proportions.
- Match lighting on the face/body to the new environment; use natural facial lighting, balanced exposure, realistic shadows, and professional composition.
- Change only the requested scene, clothing, background, or pose.`;
}
