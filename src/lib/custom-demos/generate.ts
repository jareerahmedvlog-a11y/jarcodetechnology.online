import OpenAI from "openai";
import { openaiApiKey, workspaceModel } from "@/lib/jarcode-ai/config";
import { sanitizeModules } from "@/lib/custom-demos/sanitize";
import type { CustomModuleDef } from "@/lib/custom-demos/types";

export type ProposeInput = {
  niche: string;
  businessName: string;
  businessType: string;
  description: string;
  requirements: string;
  extraInstructions: string;
  currency: string;
  country: string;
};

export async function proposeCustomDemoModules(input: ProposeInput): Promise<{
  modules: CustomModuleDef[];
  unsupportedNotes: string[];
  model: string;
  usage?: { inputTokens: number; outputTokens: number };
}> {
  const apiKey = openaiApiKey();
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured on the server.");
  }

  const model = workspaceModel();
  const client = new OpenAI({ apiKey });

  const system = `You design ERP demo module structures for JARCODE TECHNOLOGY.
Return ONLY valid JSON with this shape:
{
  "modules": [
    {
      "id": "kebab-case-id",
      "label": "Module Label",
      "description": "Short description",
      "fields": [
        { "key": "snake_or_camel", "label": "Field Label", "type": "text|email|tel|number|date|textarea|select", "required": true, "options": ["A","B"] }
      ]
    }
  ],
  "unsupported": ["features that need custom development"]
}
Rules:
- Do NOT include Dashboard or AI Assistant modules.
- 6 to 12 modules max, tailored to the business niche.
- Each module 3 to 8 fields using only allowed field types.
- select fields must include options.
- Prefer operational modules (records, billing, staff, inventory, reports as data lists).
- Never invent payment gateway or medical device integrations as functional modules; list those under unsupported.`;

  const user = `Business name: ${input.businessName}
Niche: ${input.niche}
Type: ${input.businessType}
Country: ${input.country}
Currency: ${input.currency}
Description: ${input.description}
Requirements: ${input.requirements}
Extra: ${input.extraInstructions}`;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = completion.choices[0]?.message?.content || "{}";
  let parsed: { modules?: unknown; unsupported?: unknown } = {};
  try {
    parsed = JSON.parse(content) as typeof parsed;
  } catch {
    parsed = {};
  }

  const { modules, unsupportedNotes } = sanitizeModules(parsed.modules);
  const extraUnsupported = Array.isArray(parsed.unsupported)
    ? parsed.unsupported.map((u) => String(u).slice(0, 160)).filter(Boolean)
    : [];

  return {
    modules,
    unsupportedNotes: [...unsupportedNotes, ...extraUnsupported].slice(0, 12),
    model,
    usage: {
      inputTokens: completion.usage?.prompt_tokens || 0,
      outputTokens: completion.usage?.completion_tokens || 0,
    },
  };
}
