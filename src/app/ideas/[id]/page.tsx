import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocalIdea, useLocalIdeasStore } from "@/lib/local-ideas-store";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin-auth";
import { rowToUseCase, type IdeaRow } from "@/types";
import { IdeaDetailForm } from "@/components/IdeaDetailForm";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let row: IdeaRow | null = null;

  if (useLocalIdeasStore()) {
    row = getLocalIdea(id);
  } else {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", id)
      .single();
    if (!error && data) {
      row = data as IdeaRow;
    }
  }

  if (!row) {
    notFound();
  }
  const [initial, admin] = [rowToUseCase(row), await isAdmin()];

  const similarIdeas = Array.isArray(row.similar_ideas)
    ? (row.similar_ideas as { id: string; use_case: string; similarity: number }[])
    : [];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <Link
          href="/ideas"
          className="text-sm text-sky-600 hover:text-sky-800 font-medium"
        >
          ← Back to ideas
        </Link>
      </div>

      <header className="border-b border-slate-200 pb-4 space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">
          {row.use_case || "Idea"}
        </h1>
        <p className="text-xs text-slate-500">
          Submitted by {row.submitter_name || row.submitter_email}
          {row.created_at
            ? ` · ${new Date(row.created_at).toLocaleString()}`
            : ""}
        </p>
        <p className="text-xs text-slate-400 font-mono">ID: {row.id}</p>
      </header>

      {admin && similarIdeas.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-amber-800">
            ⚠️ Submitted despite similar ideas
          </h3>
          <p className="text-xs text-amber-700">
            The submitter was warned about these before submitting.
          </p>
          <ul className="space-y-1">
            {similarIdeas.map((s) => (
              <li key={s.id} className="text-sm">
                <Link
                  href={`/ideas/${s.id}`}
                  className="text-sky-700 hover:text-sky-900 font-medium underline"
                >
                  {s.use_case || "Untitled"}
                </Link>
                <span className="text-xs text-slate-400 ml-2">
                  {Math.round(s.similarity * 100)}% similar
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium text-slate-800 mb-4">Edit fields</h2>
        <IdeaDetailForm ideaId={row.id} initial={initial} isAdmin={admin} />
      </div>
    </div>
  );
}
