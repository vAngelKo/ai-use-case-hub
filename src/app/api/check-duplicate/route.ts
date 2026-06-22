import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { useLocalIdeasStore } from "@/lib/local-ideas-store";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { use_case, description } = await req.json();
    const text = [use_case, description].filter(Boolean).join(" ").trim();
    if (!text) {
      return Response.json({ duplicates: [] });
    }

    // Skip in local dev mode — no pgvector available
    if (useLocalIdeasStore()) {
      return Response.json({ duplicates: [] });
    }

    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    const embedding = embeddingRes.data[0].embedding;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("match_ideas", {
      query_embedding: embedding,
      match_threshold: 0.82,
      match_count: 3,
    });

    if (error) {
      console.error("Duplicate check error:", error.message);
      return Response.json({ duplicates: [] });
    }

    return Response.json({ duplicates: data ?? [] });
  } catch (err) {
    console.error("check-duplicate error:", err);
    return Response.json({ duplicates: [] });
  }
}
