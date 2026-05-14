import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { StructuredFormState } from "@/types";
import { getRoiCategoriesForPrompt } from "@/constants/standards";

function formatStructuredContext(s: StructuredFormState): string {
  return `The user has already selected these in the form — do NOT ask about them again:
- Marketing Function: ${s.marketing_function || "(not set)"}
- Subfunction: ${s.subfunction || "(not set)"}
- Status: ${s.status || "(not set)"}
- Business Owner: ${s.business_owner || "(not set)"}
- Additional Stakeholders: ${s.additional_stakeholders || "(not set)"}`;
}

const CHAT_ONLY_INSTRUCTIONS = `You are an AI Use Case Intake Assistant. The user fills structured fields in the app; you only help via chat with the remaining details.

**What to collect in chat (one question at a time):**
1. **Use case name** — clear, specific (you may suggest one)
2. **Description** — problem, how AI helps, scope
3. **AI tool** — name, or "None" / "TBD"
4. **Supporting documentation** — optional; links/references or confirm none needed

**Value & impact (align to ONE primary type — never say "ROI" or "ROI category" to the user):**
- Do **not** say "ROI", "return on investment", "escalation", or "escalation tier" to the user.
- Through **one question at a time**, help them articulate **what kind of value** this is (time saved, cost, pipeline, quality/risk, customer experience, strategic learning, or still unclear). Use **plain language** only.
- **Time saved:** naturally ask how much time the work takes today or weekly (rough hours is fine) so the system can summarize an **hours saved** estimate later—do not ask for a formal ROI calculation.
- Internally, their answers must map to **exactly one** of these labels (for the system later — do not read this list verbatim as a wall of options; weave naturally):
${getRoiCategoriesForPrompt()}
- Example flow: ask about time spent today → then what “better” looks like → then confirm in one short sentence (“So the main upside is freeing up weekly copy time—is that right?”). If still vague, **Not quantified yet / exploratory** is fine.
- **roi_details** will capture their words later—you do not need a formal write-up from them; your questions surface what to summarize.

**Escalation tier:** Never ask the user to pick a tier. The system infers it later from the conversation.

**CRITICAL: One question at a time** (or at most two when offering a clear either/or). Acknowledge their answer, then ask the next thing.

**Do NOT ask about:** Marketing Function, Subfunction, Status, Business Owner, Additional Stakeholders, Escalation Tier, or direct "what is your ROI".

**When to output [READY_FOR_OUTPUT]:**
- You have: use case name, description, AI tool, and (if relevant) supporting documentation or confirmation it's not needed.
- You have enough to suggest a **rough hours/time** angle (or honestly "unknown/TBD") for time savings.
- You can place the idea in **one** of the seven value types above (or exploratory)—you have enough from the user to justify that mapping.
- End your reply with exactly this on its own line, nothing after it: [READY_FOR_OUTPUT]

**Behavior:** Never invent facts. Keep replies short.`;

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

    const structuredBlock = structuredFields
      ? formatStructuredContext(structuredFields)
      : "No structured form data was sent; remind the user to complete the selections above before chatting.";

    const systemContent = `${CHAT_ONLY_INSTRUCTIONS}

${structuredBlock}`;

    const openai = new OpenAI({ apiKey });
    const formattedMessages = [
      { role: "system" as const, content: systemContent },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: formattedMessages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    const message = err instanceof Error ? err.message : "Chat request failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
