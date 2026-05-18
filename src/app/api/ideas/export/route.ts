import { NextRequest } from "next/server";
import { listLocalIdeas, useLocalIdeasStore } from "@/lib/local-ideas-store";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { IdeaRow } from "@/types";

const CSV_COLUMNS: (keyof IdeaRow)[] = [
  "id",
  "created_at",
  "submitter_email",
  "submitter_name",
  "use_case",
  "marketing_function",
  "subfunction",
  "status",
  "business_owner",
  "additional_stakeholders",
  "ai_tool",
  "description",
  "supporting_documentation",
  "escalation_tier",
  "roi",
  "roi_details",
  "hours_saved",
];

function escapeCsv(val: unknown): string {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") || undefined;
    const marketing_function = sp.get("function") || undefined;
    const owner = sp.get("owner") || undefined;
    const q = sp.get("q") || undefined;

    let ideas: IdeaRow[];

    if (useLocalIdeasStore()) {
      ideas = listLocalIdeas({ status, marketing_function, owner, q });
    } else {
      const supabase = getSupabaseAdmin();
      let query = supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false });
      if (status) query = query.eq("status", status);
      if (marketing_function)
        query = query.eq("marketing_function", marketing_function);
      if (owner) query = query.ilike("business_owner", `%${owner}%`);
      if (q)
        query = query.or(
          `use_case.ilike.%${q}%,description.ilike.%${q}%,ai_tool.ilike.%${q}%`
        );

      const { data, error } = await query;
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      ideas = (data ?? []) as IdeaRow[];
    }

    const header = CSV_COLUMNS.join(",");
    const rows = ideas
      .map((row) => CSV_COLUMNS.map((col) => escapeCsv(row[col])).join(","))
      .join("\n");
    const csv = `${header}\n${rows}`;
    const date = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ai-use-cases-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Export failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
