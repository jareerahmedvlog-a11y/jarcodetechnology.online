import { promises as fs } from "fs";
import path from "path";
import {
  chatDailyLimit,
  estimateChatCostUsd,
  estimateImageCostUsd,
  estimateVideoCostUsd,
  estimateVoiceMinuteCostUsd,
  fileDailyLimit,
  imageDailyLimit,
  monthlyBudgetUsd,
  searchDailyLimit,
  videoDailyLimit,
  videoMonthlyLimit,
  videoPerUserDailyLimit,
  voiceDailyLimit,
} from "@/lib/jarcode-ai/config";

export type AiUsageKind =
  | "chat"
  | "voice_session"
  | "image"
  | "file"
  | "web_search"
  | "video";

export type AiUsageEvent = {
  id: string;
  at: string;
  kind: AiUsageKind;
  subject: string;
  role: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  durationMinutes?: number;
  durationSec?: number;
  provider?: string;
  success?: boolean;
  estimatedUsd: number;
  firstTokenMs?: number;
  totalMs?: number;
  failed?: boolean;
};

type SubjectBucket = {
  chat: number;
  voice: number;
  image: number;
  file: number;
  search: number;
  video: number;
  videoSeconds: number;
  estimatedUsd: number;
  minutes: number;
};

type UsageStore = {
  month: string;
  day: string;
  estimatedSpendUsd: number;
  chatRequests: number;
  voiceSessions: number;
  voiceMinutes: number;
  imageGenerations: number;
  fileAnalysis: number;
  webSearches: number;
  videoGenerations: number;
  videoSuccess: number;
  videoFailed: number;
  videoSeconds: number;
  videoSpendUsd: number;
  inputTokens: number;
  outputTokens: number;
  chatLatencyCount: number;
  chatFirstTokenMsSum: number;
  chatTotalMsSum: number;
  failedRequests: number;
  dayChat: number;
  dayVoice: number;
  dayImage: number;
  dayFile: number;
  daySearch: number;
  dayVideo: number;
  bySubject: Record<string, SubjectBucket>;
  byModel: Record<string, { count: number; estimatedUsd: number }>;
  bySubjectDayVideo: Record<string, { day: string; count: number }>;
  events: AiUsageEvent[];
  alertsFired: { "50"?: boolean; "80"?: boolean; "100"?: boolean };
  monthlyBudgetOverride?: number;
};

const FILE = path.join(process.cwd(), "data", "ai", "usage.json");

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}
function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function emptySubject(): SubjectBucket {
  return {
    chat: 0,
    voice: 0,
    image: 0,
    file: 0,
    search: 0,
    video: 0,
    videoSeconds: 0,
    estimatedUsd: 0,
    minutes: 0,
  };
}

function emptyStore(): UsageStore {
  return {
    month: monthKey(),
    day: dayKey(),
    estimatedSpendUsd: 0,
    chatRequests: 0,
    voiceSessions: 0,
    voiceMinutes: 0,
    imageGenerations: 0,
    fileAnalysis: 0,
    webSearches: 0,
    videoGenerations: 0,
    videoSuccess: 0,
    videoFailed: 0,
    videoSeconds: 0,
    videoSpendUsd: 0,
    inputTokens: 0,
    outputTokens: 0,
    chatLatencyCount: 0,
    chatFirstTokenMsSum: 0,
    chatTotalMsSum: 0,
    failedRequests: 0,
    dayChat: 0,
    dayVoice: 0,
    dayImage: 0,
    dayFile: 0,
    daySearch: 0,
    dayVideo: 0,
    bySubject: {},
    byModel: {},
    bySubjectDayVideo: {},
    events: [],
    alertsFired: {},
  };
}

async function readStore(): Promise<UsageStore> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return { ...emptyStore(), ...(JSON.parse(raw) as UsageStore) };
  } catch {
    return emptyStore();
  }
}

async function writeStore(data: UsageStore) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}

async function roll(store: UsageStore): Promise<UsageStore> {
  const month = monthKey();
  const day = dayKey();
  if (store.month !== month) {
    const next = emptyStore();
    if (store.monthlyBudgetOverride) next.monthlyBudgetOverride = store.monthlyBudgetOverride;
    await writeStore(next);
    return next;
  }
  if (store.day !== day) {
    store.day = day;
    store.dayChat = 0;
    store.dayVoice = 0;
    store.dayImage = 0;
    store.dayFile = 0;
    store.daySearch = 0;
    store.dayVideo = 0;
    await writeStore(store);
  }
  return store;
}

export function getBudget(store: UsageStore) {
  return store.monthlyBudgetOverride && store.monthlyBudgetOverride > 0
    ? store.monthlyBudgetOverride
    : monthlyBudgetUsd();
}

export function usageAlerts(store: UsageStore) {
  const budget = getBudget(store);
  const pct = budget > 0 ? (store.estimatedSpendUsd / budget) * 100 : 0;
  const alerts: string[] = [];
  if (pct >= 100) alerts.push("100% monthly AI budget reached");
  else if (pct >= 80) alerts.push("80% monthly AI budget used");
  else if (pct >= 50) alerts.push("50% monthly AI budget used");
  return { pct: Number(pct.toFixed(1)), alerts, budget };
}

export async function checkAiBudget(
  kind: "chat" | "voice" | "image" | "file" | "web_search" | "video" = "chat",
  subject?: string,
) {
  let store = await roll(await readStore());
  const budget = getBudget(store);
  if (store.estimatedSpendUsd >= budget) {
    return {
      ok: false as const,
      reason: `Monthly AI budget of $${budget} has been reached. Usage is limited — not unlimited.`,
      store,
    };
  }
  if (kind === "chat" && store.dayChat >= chatDailyLimit()) {
    return {
      ok: false as const,
      reason: `Daily chat limit (${chatDailyLimit()}) reached. Try again tomorrow.`,
      store,
    };
  }
  if (kind === "voice" && store.dayVoice >= voiceDailyLimit()) {
    return {
      ok: false as const,
      reason: `Daily voice session limit (${voiceDailyLimit()}) reached.`,
      store,
    };
  }
  if (kind === "image" && store.dayImage >= imageDailyLimit()) {
    return {
      ok: false as const,
      reason: `Daily image generation limit (${imageDailyLimit()}) reached.`,
      store,
    };
  }
  if (kind === "file" && store.dayFile >= fileDailyLimit()) {
    return {
      ok: false as const,
      reason: `Daily file analysis limit (${fileDailyLimit()}) reached.`,
      store,
    };
  }
  if (kind === "web_search" && store.daySearch >= searchDailyLimit()) {
    return {
      ok: false as const,
      reason: `Daily web search limit (${searchDailyLimit()}) reached.`,
      store,
    };
  }
  if (kind === "video") {
    if (store.dayVideo >= videoDailyLimit()) {
      return {
        ok: false as const,
        reason: `Daily video generation limit (${videoDailyLimit()}) reached.`,
        store,
      };
    }
    if (store.videoGenerations >= videoMonthlyLimit()) {
      return {
        ok: false as const,
        reason: `Monthly video generation limit (${videoMonthlyLimit()}) reached.`,
        store,
      };
    }
    if (subject) {
      const day = dayKey();
      const entry = store.bySubjectDayVideo[subject];
      const used = entry && entry.day === day ? entry.count : 0;
      if (used >= videoPerUserDailyLimit()) {
        return {
          ok: false as const,
          reason: `Per-user daily video limit (${videoPerUserDailyLimit()}) reached.`,
          store,
        };
      }
    }
  }
  return { ok: true as const, store, budget };
}

function bumpSubject(store: UsageStore, subject: string, patch: Partial<SubjectBucket>) {
  const cur = { ...emptySubject(), ...(store.bySubject[subject] || {}) };
  store.bySubject[subject] = {
    chat: cur.chat + (patch.chat || 0),
    voice: cur.voice + (patch.voice || 0),
    image: cur.image + (patch.image || 0),
    file: cur.file + (patch.file || 0),
    search: cur.search + (patch.search || 0),
    video: cur.video + (patch.video || 0),
    videoSeconds: Number((cur.videoSeconds + (patch.videoSeconds || 0)).toFixed(2)),
    estimatedUsd: Number((cur.estimatedUsd + (patch.estimatedUsd || 0)).toFixed(5)),
    minutes: Number((cur.minutes + (patch.minutes || 0)).toFixed(2)),
  };
}

function bumpModel(store: UsageStore, model: string, usd: number) {
  const cur = store.byModel[model] || { count: 0, estimatedUsd: 0 };
  store.byModel[model] = {
    count: cur.count + 1,
    estimatedUsd: Number((cur.estimatedUsd + usd).toFixed(5)),
  };
}

function markAlerts(store: UsageStore) {
  const { pct } = usageAlerts(store);
  if (pct >= 50) store.alertsFired["50"] = true;
  if (pct >= 80) store.alertsFired["80"] = true;
  if (pct >= 100) store.alertsFired["100"] = true;
}

function pushEvent(store: UsageStore, event: AiUsageEvent) {
  store.events.unshift(event);
  store.events = store.events.slice(0, 500);
  markAlerts(store);
}

export async function recordChatUsage(opts: {
  subject: string;
  role: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  usedSearch?: boolean;
  usedFile?: boolean;
  firstTokenMs?: number;
  totalMs?: number;
  failed?: boolean;
}) {
  const check = await checkAiBudget("chat");
  if (!check.ok) return check.store;
  const store = check.store;
  // Backward-compatible defaults for older usage.json files
  store.chatLatencyCount = store.chatLatencyCount || 0;
  store.chatFirstTokenMsSum = store.chatFirstTokenMsSum || 0;
  store.chatTotalMsSum = store.chatTotalMsSum || 0;
  store.failedRequests = store.failedRequests || 0;

  const usd = opts.failed
    ? 0
    : estimateChatCostUsd(opts.inputTokens, opts.outputTokens);
  store.chatRequests += 1;
  store.dayChat += 1;
  if (!opts.failed) {
    store.inputTokens += opts.inputTokens;
    store.outputTokens += opts.outputTokens;
    store.estimatedSpendUsd = Number((store.estimatedSpendUsd + usd).toFixed(5));
  } else {
    store.failedRequests += 1;
  }
  if (typeof opts.totalMs === "number" && opts.totalMs >= 0) {
    store.chatLatencyCount += 1;
    store.chatTotalMsSum += opts.totalMs;
    if (typeof opts.firstTokenMs === "number" && opts.firstTokenMs >= 0) {
      store.chatFirstTokenMsSum += opts.firstTokenMs;
    }
  }
  const subjectPatch: Partial<SubjectBucket> = { chat: 1, estimatedUsd: usd };
  if (opts.usedSearch) {
    store.webSearches += 1;
    store.daySearch += 1;
    subjectPatch.search = 1;
  }
  if (opts.usedFile) {
    store.fileAnalysis += 1;
    store.dayFile += 1;
    subjectPatch.file = 1;
  }
  bumpSubject(store, opts.subject, subjectPatch);
  bumpModel(store, opts.model, usd);
  pushEvent(store, {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    kind: "chat",
    subject: opts.subject,
    role: opts.role,
    model: opts.model,
    inputTokens: opts.inputTokens,
    outputTokens: opts.outputTokens,
    estimatedUsd: usd,
    firstTokenMs: opts.firstTokenMs,
    totalMs: opts.totalMs,
    failed: opts.failed,
  });
  await writeStore(store);
  return store;
}

export async function recordVoiceUsage(opts: {
  subject: string;
  role: string;
  model: string;
  durationMinutes: number;
}) {
  const check = await checkAiBudget("voice");
  if (!check.ok) return check.store;
  const store = check.store;
  const minutes = Math.max(0.1, opts.durationMinutes);
  const usd = estimateVoiceMinuteCostUsd(minutes);
  store.voiceSessions += 1;
  store.dayVoice += 1;
  store.voiceMinutes = Number((store.voiceMinutes + minutes).toFixed(2));
  store.estimatedSpendUsd = Number((store.estimatedSpendUsd + usd).toFixed(5));
  bumpSubject(store, opts.subject, { voice: 1, minutes, estimatedUsd: usd });
  bumpModel(store, opts.model, usd);
  pushEvent(store, {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    kind: "voice_session",
    subject: opts.subject,
    role: opts.role,
    model: opts.model,
    durationMinutes: minutes,
    estimatedUsd: usd,
  });
  await writeStore(store);
  return store;
}

export async function recordImageUsage(opts: {
  subject: string;
  role: string;
  model: string;
}) {
  const check = await checkAiBudget("image");
  if (!check.ok) return check.store;
  const store = check.store;
  const usd = estimateImageCostUsd();
  store.imageGenerations += 1;
  store.dayImage += 1;
  store.estimatedSpendUsd = Number((store.estimatedSpendUsd + usd).toFixed(5));
  bumpSubject(store, opts.subject, { image: 1, estimatedUsd: usd });
  bumpModel(store, opts.model, usd);
  pushEvent(store, {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    kind: "image",
    subject: opts.subject,
    role: opts.role,
    model: opts.model,
    estimatedUsd: usd,
  });
  await writeStore(store);
  return store;
}

export async function recordVideoUsage(opts: {
  subject: string;
  ownerKey?: string;
  role: string;
  model: string;
  provider: string;
  durationSec: number;
  quality: string;
  success: boolean;
  estimatedUsd?: number;
}) {
  const perUserKey = opts.ownerKey || opts.subject;
  const check = await checkAiBudget("video", perUserKey);
  const store = check.store;
  const usd =
    opts.estimatedUsd ??
    estimateVideoCostUsd(opts.durationSec, opts.quality);
  store.videoGenerations += 1;
  store.dayVideo += 1;
  if (opts.success) {
    store.videoSuccess += 1;
    store.videoSeconds = Number((store.videoSeconds + opts.durationSec).toFixed(2));
  } else {
    store.videoFailed += 1;
  }
  // Charge estimate on attempt (provider may bill failed/moderated jobs)
  store.videoSpendUsd = Number((store.videoSpendUsd + usd).toFixed(5));
  store.estimatedSpendUsd = Number((store.estimatedSpendUsd + usd).toFixed(5));
  const day = dayKey();
  const prev = store.bySubjectDayVideo[perUserKey];
  store.bySubjectDayVideo[perUserKey] = {
    day,
    count: prev && prev.day === day ? prev.count + 1 : 1,
  };
  bumpSubject(store, opts.subject, {
    video: 1,
    videoSeconds: opts.success ? opts.durationSec : 0,
    estimatedUsd: usd,
  });
  bumpModel(store, `${opts.provider}:${opts.model}`, usd);
  pushEvent(store, {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    kind: "video",
    subject: opts.subject,
    role: opts.role,
    model: opts.model,
    durationSec: opts.durationSec,
    provider: opts.provider,
    success: opts.success,
    estimatedUsd: usd,
  });
  await writeStore(store);
  return store;
}

export async function getAiUsageSummary() {
  const store = await roll(await readStore());
  const alert = usageAlerts(store);
  const latencyCount = store.chatLatencyCount || 0;
  const avgFirst =
    latencyCount > 0
      ? Math.round((store.chatFirstTokenMsSum || 0) / latencyCount)
      : 0;
  const avgTotal =
    latencyCount > 0 ? Math.round((store.chatTotalMsSum || 0) / latencyCount) : 0;

  return {
    month: store.month,
    day: store.day,
    totalChatRequests: store.chatRequests,
    totalVoiceSessions: store.voiceSessions,
    voiceSessionDurationMinutes: store.voiceMinutes,
    totalImageGenerations: store.imageGenerations,
    totalFileAnalysis: store.fileAnalysis,
    totalWebSearches: store.webSearches,
    totalVideoGenerations: store.videoGenerations,
    videoSuccessful: store.videoSuccess,
    videoFailed: store.videoFailed,
    videoDurationSeconds: store.videoSeconds,
    videoProvider: "luma",
    estimatedVideoSpendUsd: store.videoSpendUsd,
    inputTokens: store.inputTokens,
    outputTokens: store.outputTokens,
    failedRequests: store.failedRequests || 0,
    avgFirstTokenMs: avgFirst,
    avgCompletedResponseMs: avgTotal,
    estimatedApiCostUsd: store.estimatedSpendUsd,
    monthlyBudgetUsd: alert.budget,
    budgetUsedPercent: alert.pct,
    alerts: alert.alerts,
    alertsFired: store.alertsFired,
    usageByCustomer: store.bySubject,
    usageByModel: store.byModel,
    recentEvents: store.events.slice(0, 50),
    limits: {
      chatDaily: chatDailyLimit(),
      voiceDaily: voiceDailyLimit(),
      imageDaily: imageDailyLimit(),
      fileDaily: fileDailyLimit(),
      searchDaily: searchDailyLimit(),
      videoDaily: videoDailyLimit(),
      videoMonthly: videoMonthlyLimit(),
      videoPerUserDaily: videoPerUserDailyLimit(),
      dayChatUsed: store.dayChat,
      dayVoiceUsed: store.dayVoice,
      dayImageUsed: store.dayImage,
      dayFileUsed: store.dayFile,
      daySearchUsed: store.daySearch,
      dayVideoUsed: store.dayVideo,
    },
  };
}

export async function setMonthlyBudgetOverride(usd: number) {
  const store = await roll(await readStore());
  store.monthlyBudgetOverride = Math.max(1, Number(usd.toFixed(2)));
  await writeStore(store);
  return getAiUsageSummary();
}
