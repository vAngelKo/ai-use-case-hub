import { NextRequest } from "next/server";
import { patchLocalIdea, useLocalIdeasStore } from "@/lib/local-ideas-store";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { UseCaseOutput } from "@/types";

const TEXT_FIELDS = [
  "marketing_function",
  "subfunction",
  "status",
  "business_owner",
  "additional_stakeholders",
  "use_case",
  "ai_tool",
  "description",
  "supporting_documentation",
  "escalation_tier",
  "roi",
  "roi_details",
  "hours_saved",
] as const;

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const patch = body?.patch as Partial<UseCaseOutput> | undefined;
    if (!patch || typeof patch !== "object") {
      return new Response(JSON.stringify({ error: "patch object is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const key of TEXT_FIELDS) {
      if (key in patch && typeof patch[key] === "string") {
        update[key] = patch[key];
      }
    }
    if ("missing_info" in patch && Array.isArray(patch.missing_info)) {
      update.missing_info = patch.missing_info;
    }
    if (
      "suggested_follow_up_questions" in patch &&
      Array.isArray(patch.suggested_follow_up_questions)
    ) {
      update.suggested_follow_up_questions =
        patch.suggested_follow_up_questions;
    }

    if (useLocalIdeasStore()) {
      const ok = patchLocalIdea(id, update);
      if (!ok) {
        return new Response(JSON.stringify({ error: "Idea not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("ideas").update(update).eq("id", id);

      if (error) {
        console.error("Supabase update error:", error);
        return new Response(
          JSON.stringify({ error: "Update failed", detail: error.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("PATCH idea error:", err);
    const message = err instanceof Error ? err.message : "Update failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
