import { promises as fs } from "fs";
import path from "path";
import { dataRoot } from "@/lib/data-root";

type UsageFile = {
  month: string; // YYYY-MM
  estimatedSpendUsd: number;
  day: string; // YYYY-MM-DD
  dayRequests: number;
};

const FILE = dataRoot("demos", "hospital-ai-usage.json");

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

async function readUsage(): Promise<UsageFile> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return JSON.parse(raw) as UsageFile;
  } catch {
    return {
      month: monthKey(),
      estimatedSpendUsd: 0,
      day: dayKey(),
      dayRequests: 0,
    };
  }
}

async function writeUsage(data: UsageFile) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function checkHospitalAiBudget() {
  const monthlyBudget = Number(process.env.OPENAI_MONTHLY_BUDGET_USD || "10");
  const dailyLimit = Number(process.env.OPENAI_CHAT_DAILY_LIMIT || "80");
  let usage = await readUsage();
  const month = monthKey();
  const day = dayKey();

  if (usage.month !== month) {
    usage = { month, estimatedSpendUsd: 0, day, dayRequests: 0 };
    await writeUsage(usage);
  } else if (usage.day !== day) {
    usage = { ...usage, day, dayRequests: 0 };
    await writeUsage(usage);
  }

  if (usage.estimatedSpendUsd >= monthlyBudget) {
    return {
      ok: false as const,
      reason: `Monthly AI demo budget of $${monthlyBudget} has been reached. Try again next month or raise OPENAI_MONTHLY_BUDGET_USD.`,
    };
  }

  if (usage.dayRequests >= dailyLimit) {
    return {
      ok: false as const,
      reason: `Daily demo chat limit (${dailyLimit}) reached. Please try again tomorrow.`,
    };
  }

  return { ok: true as const, usage, monthlyBudget, dailyLimit };
}

/** Rough cost estimate for gpt-4o-mini-class chat (~$0.01 per request ceiling). */
export async function recordHospitalAiUsage(estimatedUsd = 0.01) {
  const check = await checkHospitalAiBudget();
  if (!check.ok) return;
  const usage = check.usage;
  usage.dayRequests += 1;
  usage.estimatedSpendUsd = Number(
    (usage.estimatedSpendUsd + estimatedUsd).toFixed(4),
  );
  await writeUsage(usage);
}
