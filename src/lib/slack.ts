import type { UseCaseOutput } from "@/types";

const MAX_TEXT = 38000;

function safeLine(s: string | undefined, max = 4000): string {
  const raw = (s ?? "").replace(/\r\n/g, "\n").trim();
  const single = raw.replace(/\n+/g, " ");
  return single.length <= max ? single || "—" : `${single.slice(0, max)}…`;
}

type SimilarIdea = { id: string; use_case: string; similarity: number };

export function buildSlackText(data: UseCaseOutput, meta?: { id?: string; similarIdeas?: SimilarIdea[] }): string {
  const lines: string[] = [
    "NEW AI USE CASE INTAKE",
    meta?.id ? `Record: ${meta.id}` : "",
    "─────────────────────",
    "",
    `Use case: ${safeLine(data.use_case, 2000)}`,
    `Marketing function: ${safeLine(data.marketing_function)}`,
    `Subfunction: ${safeLine(data.subfunction)}`,
    `Status: ${safeLine(data.status)}`,
    `Business owner: ${safeLine(data.business_owner)}`,
    `AI tool: ${safeLine(data.ai_tool)}`,
    `Escalation tier: ${safeLine(data.escalation_tier)}`,
    `Hours saved (estimate): ${safeLine(data.hours_saved)}`,
    `Additional stakeholders: ${safeLine(data.additional_stakeholders)}`,
    `Supporting documentation: ${safeLine(data.supporting_documentation)}`,
    "",
    `Description:`,
    safeLine(data.description, 8000),
    "",
    `ROI: ${safeLine(data.roi, 2000)}`,
    "",
    `ROI details (submitter narrative):`,
    safeLine(data.roi_details, 8000),
  ].filter((l) => l !== "");

  if (data.missing_info?.length) {
    lines.push("", "Missing / flagged:");
    for (const m of data.missing_info) {
      lines.push(`- ${safeLine(m, 500)}`);
    }
  }

  if (meta?.similarIdeas?.length) {
    lines.push("", "⚠️ Submitted despite similar ideas already existing:");
    for (const s of meta.similarIdeas) {
      lines.push(`- ${safeLine(s.use_case, 300)} (${Math.round(s.similarity * 100)}% similar, id: ${s.id})`);
    }
  }

  let text = lines.join("\n");
  if (text.length > MAX_TEXT) {
    text = `${text.slice(0, MAX_TEXT - 20)}\n…(truncated)`;
  }
  return text;
}

export function normalizeWebhookUrl(
  raw: string | undefined
): { ok: true; url: string } | { ok: false; message: string } {
  if (!raw?.trim()) {
    return { ok: false, message: "SLACK_WEBHOOK_URL is empty." };
  }
  const url = raw.trim().replace(/^["']|["']$/g, "");
  if (!url.startsWith("https://hooks.slack.com/services/")) {
    return {
      ok: false,
      message:
        "SLACK_WEBHOOK_URL must start with https://hooks.slack.com/services/",
    };
  }
  const path = url.replace("https://hooks.slack.com/services/", "");
  const parts = path.split("/").filter(Boolean);
  if (parts.length !== 3) {
    return {
      ok: false,
      message: "Webhook URL looks incomplete (expected three path segments).",
    };
  }
  return { ok: true, url };
}

export async function postSlackUseCase(
  data: UseCaseOutput,
  meta?: { id?: string; similarIdeas?: SimilarIdea[] }
): Promise<{ ok: true } | { ok: false; message: string; detail?: string }> {
  const webhookCheck = normalizeWebhookUrl(process.env.SLACK_WEBHOOK_URL);
  if (!webhookCheck.ok) {
    return { ok: false, message: webhookCheck.message };
  }
  const text = buildSlackText(data, meta);
  try {
    const res = await fetch(webhookCheck.url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ text }),
    });
    const responseText = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        message: "Slack rejected the request.",
        detail: responseText,
      };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      message: msg,
      detail: e instanceof Error ? e.stack : undefined,
    };
  }
}
