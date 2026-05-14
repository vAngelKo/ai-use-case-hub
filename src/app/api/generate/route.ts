import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { StructuredFormState } from "@/types";
import {
  ESCALATION_TIER_CRITERIA_FOR_MODEL,
  getRoiCategoriesForPrompt,
  ROI_VALUE_CATEGORIES,
} from "@/constants/standards";

const DEFAULT_ROI_FALLBACK =
  "Not quantified yet / exploratory — idea stage; value TBD";

const ESCALATION_GUIDANCE = `Infer **escalation_tier** from the full conversation (the user was never asked to choose a tier).

${ESCALATION_TIER_CRITERIA_FOR_MODEL}`;

const ROI_GUIDANCE = `Infer **roi** and **roi_details** from the conversation.

**roi** (required): Must be **exactly one** of the following strings — character-for-character, no shortening:
${getRoiCategoriesForPrompt()}

Pick the **single best** match from what the user said. If nothing fits, use: Not quantified yet / exploratory — idea stage; value TBD

**roi_details** (required): 2–5 sentences in the **user's voice / substance**—what they actually described: concrete signals (time, volume, risk, who benefits), expected upside, caveats. This is what they see on review; make it readable and faithful. Use "N/A" only when the conversation truly lacks substance.`;

const HOURS_GUIDANCE = `**hours_saved** (required): Short plain-language estimate from the conversation (e.g. "~5 hrs/week for the team", "~2 hrs per campaign", "TBD — not discussed"). Use "N/A" only if time was not discussed at all. Never invent specific numbers the user did not imply.`;

const OUTPUT_SCHEMA = `You must respond with ONLY valid JSON in this exact shape (no markdown, no code fence):
{
  "marketing_function": "",
  "subfunction": "",
  "use_case": "",
  "ai_tool": "",
  "description": "",
  "supporting_documentation": "",
  "additional_stakeholders": "",
  "escalation_tier": "",
  "roi": "",
  "roi_details": "",
  "hours_saved": "",
  "status": "",
  "business_owner": "",
  "missing_info": [],
  "suggested_follow_up_questions": []
}

The client will **overwrite** these from the form (use "" placeholders): marketing_function, subfunction, status, business_owner, additional_stakeholders.

You must **infer from the conversation** (required):
- use_case, description, ai_tool, supporting_documentation
- **escalation_tier** — ${ESCALATION_GUIDANCE}
- **roi**, **roi_details** — ${ROI_GUIDANCE}
- **hours_saved** — ${HOURS_GUIDANCE}

Rules:
- Set marketing_function, subfunction, status, business_owner, additional_stakeholders to "" — server merges form.
- missing_info: gaps only for fields you cannot reasonably infer.
- suggested_follow_up_questions: optional 0–2 if something critical is missing.
- All string fields must be strings; arrays must be string arrays.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY is not set" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { messages, structuredFields } = body as {
      messages: { role: string; content: string }[];
      structuredFields?: StructuredFormState;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const openai = new OpenAI({ apiKey });
    const formNote = structuredFields
      ? `Form selections (merge these exact values for the listed keys):\n${JSON.stringify(structuredFields, null, 2)}`
      : "No structuredFields provided.";

    const systemContent = `You are an AI Use Case Intake Assistant. Build the structured use case from the conversation and form.

${formNote}

${OUTPUT_SCHEMA}`;

    const formattedMessages = [
      { role: "system" as const, content: systemContent },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
      {
        role: "user" as const,
        content: "Output the use case as JSON only, no other text.",
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: formattedMessages,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const data = JSON.parse(cleaned) as Record<string, unknown>;

    const requiredKeys = [
      "marketing_function",
      "subfunction",
      "use_case",
      "description",
      "status",
      "business_owner",
      "ai_tool",
      "supporting_documentation",
      "additional_stakeholders",
      "escalation_tier",
      "roi",
      "roi_details",
      "hours_saved",
      "missing_info",
      "suggested_follow_up_questions",
    ];
    const result: Record<string, unknown> = {};
    for (const key of requiredKeys) {
      const v = data[key];
      if (key === "missing_info" || key === "suggested_follow_up_questions") {
        result[key] = Array.isArray(v) ? v : [];
      } else {
        result[key] = typeof v === "string" ? v : "";
      }
    }

    if (structuredFields) {
      result.marketing_function = structuredFields.marketing_function;
      result.subfunction = structuredFields.subfunction;
      result.status = structuredFields.status;
      result.business_owner = structuredFields.business_owner;
      result.additional_stakeholders = structuredFields.additional_stakeholders;
    }

    const roiStr = typeof result.roi === "string" ? result.roi.trim() : "";
    const roiValid = (ROI_VALUE_CATEGORIES as readonly string[]).includes(roiStr);
    if (!roiValid) {
      const partial = (ROI_VALUE_CATEGORIES as readonly string[]).find(
        (c) =>
          roiStr &&
          (c.startsWith(roiStr) ||
            roiStr.startsWith(c.split(" —")[0] ?? ""))
      );
      result.roi = partial ?? DEFAULT_ROI_FALLBACK;
    }

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Generate API error:", err);
    const message =
      err instanceof Error ? err.message : "Generate request failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
