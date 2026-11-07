export function openaiApiKey() {
  return process.env.OPENAI_API_KEY?.trim() || "";
}

export function chatModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

/** Fast model for ordinary questions (configurable). */
export function fastChatModel() {
  return (
    process.env.OPENAI_FAST_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini"
  );
}

/** Capable model for complex reasoning / files / study (configurable). */
export function capableChatModel() {
  return (
    process.env.OPENAI_CAPABLE_MODEL?.trim() ||
    process.env.OPENAI_WORKSPACE_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o"
  );
}

/** Model used with Responses API tools (web search / files / vision). */
export function workspaceModel() {
  return capableChatModel();
}

/** Fast everyday GPT Image model (Image API). Do not use retired gpt-image-1 / DALL·E. */
export function imageModel() {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2.6-flare";
}

/** Higher-precision GPT Image model for edits / identity-sensitive work. */
export function imageEditModel() {
  return (
    process.env.OPENAI_IMAGE_EDIT_MODEL?.trim() ||
    process.env.OPENAI_IMAGE_MODEL?.trim() ||
    "gpt-image-2.6-sunburst"
  );
}

export function historyMessageLimit() {
  const n = Number(process.env.OPENAI_HISTORY_MESSAGES || "10");
  return Number.isFinite(n) && n > 2 ? Math.min(24, Math.floor(n)) : 10;
}

export function simpleMaxOutputTokens() {
  const n = Number(process.env.OPENAI_SIMPLE_MAX_TOKENS || "700");
  return Number.isFinite(n) && n > 100 ? Math.floor(n) : 700;
}

export function complexMaxOutputTokens() {
  const n = Number(process.env.OPENAI_COMPLEX_MAX_TOKENS || "2200");
  return Number.isFinite(n) && n > 200 ? Math.floor(n) : 2200;
}

export function realtimeModel() {
  return process.env.OPENAI_REALTIME_MODEL?.trim() || "gpt-realtime";
}

export function realtimeVoice() {
  return process.env.OPENAI_REALTIME_VOICE?.trim() || "alloy";
}

export function monthlyBudgetUsd() {
  const n = Number(process.env.OPENAI_MONTHLY_BUDGET_USD || "25");
  return Number.isFinite(n) && n > 0 ? n : 25;
}

export function chatDailyLimit() {
  const n = Number(process.env.OPENAI_CHAT_DAILY_LIMIT || "120");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 120;
}

export function voiceDailyLimit() {
  const n = Number(process.env.OPENAI_VOICE_DAILY_LIMIT || "40");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 40;
}

export function voiceMaxMinutes() {
  const n = Number(process.env.OPENAI_VOICE_MAX_MINUTES || "20");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 20;
}

export function imageDailyLimit() {
  const n = Number(process.env.OPENAI_IMAGE_DAILY_LIMIT || "20");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 20;
}

export function fileDailyLimit() {
  const n = Number(process.env.OPENAI_FILE_DAILY_LIMIT || "40");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 40;
}

export function searchDailyLimit() {
  const n = Number(process.env.OPENAI_SEARCH_DAILY_LIMIT || "40");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 40;
}

export function maxUploadBytes() {
  const mb = Number(process.env.OPENAI_MAX_UPLOAD_MB || "20");
  const n = Number.isFinite(mb) && mb > 0 ? mb : 20;
  return Math.floor(n * 1024 * 1024);
}

export function estimateChatCostUsd(inputTokens: number, outputTokens: number) {
  const inCost = (inputTokens / 1_000_000) * 0.15;
  const outCost = (outputTokens / 1_000_000) * 0.6;
  return Number(Math.max(0.002, inCost + outCost).toFixed(5));
}

export function estimateVoiceMinuteCostUsd(minutes: number) {
  return Number(Math.max(0.01, minutes * 0.06).toFixed(5));
}

export function estimateImageCostUsd() {
  return Number(process.env.OPENAI_IMAGE_COST_USD || "0.04");
}

/** Dedicated video provider — never reuse OpenAI key unless that provider accepts it. */
export function videoGenerationApiKey() {
  return process.env.VIDEO_GENERATION_API_KEY?.trim() || "";
}

export function videoProvider() {
  const p = (process.env.VIDEO_PROVIDER || "luma").trim().toLowerCase();
  return p === "luma" ? "luma" : "luma";
}

export function videoModel() {
  return process.env.VIDEO_MODEL?.trim() || "ray-2";
}

export function videoFlashModel() {
  return process.env.VIDEO_FLASH_MODEL?.trim() || "ray-flash-2";
}

export function videoDailyLimit() {
  const n = Number(process.env.VIDEO_DAILY_LIMIT || "8");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 8;
}

export function videoMonthlyLimit() {
  const n = Number(process.env.VIDEO_MONTHLY_LIMIT || "40");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 40;
}

export function videoPerUserDailyLimit() {
  const n = Number(process.env.VIDEO_PER_USER_DAILY_LIMIT || "3");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
}

/** Estimated USD per second of output (Luma Ray 2 ~$0.10/s ballpark). */
export function estimateVideoCostUsd(durationSec: number, quality: string) {
  const base = Number(process.env.VIDEO_COST_PER_SECOND_USD || "0.10");
  const mult = quality === "highest" ? 1.5 : quality === "high" ? 1.2 : 0.7;
  const rate = (Number.isFinite(base) && base > 0 ? base : 0.1) * mult;
  return Number(Math.max(0.05, durationSec * rate).toFixed(4));
}

export function videoPublicBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    "https://jarcodetechnology.online"
  );
}

export function videoRetentionHours() {
  const n = Number(process.env.VIDEO_RETENTION_HOURS || "168");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 168;
}
