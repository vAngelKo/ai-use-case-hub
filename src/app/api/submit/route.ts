import { NextRequest } from "next/server";
import OpenAI from "openai";
import { insertLocalIdea, useLocalIdeasStore } from "@/lib/local-ideas-store";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { postSlackUseCase } from "@/lib/slack";
import { resolveSubmitterFromBody } from "@/lib/submitter";
import type { UseCaseOutput } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(useCase: UseCaseOutput): Promise<number[] | null> {
  try {
    const text = [useCase.use_case, useCase.description].filter(Boolean).join(" ").trim();
    if (!text) return null;
    const res = await openai.embeddings.create({ model: "text-embedding-3-small", input: text });
    return res.data[0].embedding;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const useCase = body?.useCase as UseCaseOutput | undefined;
    if (!useCase || typeof useCase !== "object") {
      return new Response(
        JSON.stringify({ error: "useCase object is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { email: submitter_email, name: submitter_name } =
      resolveSubmitterFromBody(body);

    const similarIdeas = Array.isArray(body?.similarIdeas) ? body.similarIdeas : [];
    const embedding = useLocalIdeasStore() ? null : await generateEmbedding(useCase);

    const insertRow = {
      submitter_email,
      submitter_name,
      similar_ideas: similarIdeas,
      ...(embedding ? { embedding: JSON.stringify(embedding) } : {}),
      marketing_function: useCase.marketing_function || null,
      subfunction: useCase.subfunction || null,
      status: useCase.status || null,
      business_owner: useCase.business_owner || null,
      additional_stakeholders: useCase.additional_stakeholders || null,
      use_case: useCase.use_case || null,
      ai_tool: useCase.ai_tool || null,
      description: useCase.description || null,
      supporting_documentation: useCase.supporting_documentation || null,
      escalation_tier: useCase.escalation_tier || null,
      roi: useCase.roi || null,
      roi_details: useCase.roi_details || null,
      hours_saved: useCase.hours_saved || null,
      missing_info: useCase.missing_info ?? [],
      suggested_follow_up_questions:
        useCase.suggested_follow_up_questions ?? [],
    };

    let id: string;

    if (useLocalIdeasStore()) {
      const row = insertLocalIdea(insertRow);
      id = row.id;
    } else {
      const supabase = getSupabaseAdmin();
      const { data: inserted, error: dbError } = await supabase
        .from("ideas")
        .insert(insertRow)
        .select("id")
        .single();

      if (dbError) {
        console.error("Supabase insert error:", dbError);
        return new Response(
          JSON.stringify({
            error: "Failed to save idea",
            detail: dbError.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      id = inserted?.id as string;
    }

    const skipSlack =
      process.env.SKIP_SLACK?.trim().toLowerCase() === "true" ||
      process.env.SKIP_SLACK === "1";
    if (skipSlack) {
      return new Response(JSON.stringify({ ok: true, id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const slack = await postSlackUseCase(useCase, { id, similarIdeas });
    if (!slack.ok) {
      console.error("Slack error after DB save:", slack);
      return new Response(
        JSON.stringify({
          ok: true,
          id,
          slackError: slack.message,
          slackDetail: "detail" in slack ? slack.detail : undefined,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Submit API error:", err);
    const message = err instanceof Error ? err.message : "Submit failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
