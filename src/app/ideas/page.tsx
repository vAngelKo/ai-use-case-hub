import Link from "next/link";
import { listLocalIdeas, useLocalIdeasStore } from "@/lib/local-ideas-store";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { IdeaRow } from "@/types";
import { STATUS_OPTIONS, MARKETING_FUNCTIONS } from "@/constants/standards";

type Search = Record<string, string | undefined>;

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const status = sp.status?.trim() || undefined;
  const marketing_function = sp.function?.trim() || undefined;
  const owner = sp.owner?.trim() || undefined;

  const filters = { status, marketing_function, owner };

  let ideas: IdeaRow[];

  if (useLocalIdeasStore()) {
    ideas = listLocalIdeas(filters);
  } else {
    const supabase = getSupabaseAdmin();
    let q = supabase
      .from("ideas")
      .select("*")
      .order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    if (marketing_function) q = q.eq("marketing_function", marketing_function);
    if (owner) q = q.ilike("business_owner", `%${owner}%`);

    const { data: rows, error } = await q;

    if (error) {
      return (
        <div className="max-w-5xl mx-auto p-6">
          <p className="text-rose-600 text-sm">
            Could not load ideas: {error.message}. Check Supabase env and that the
            table exists (see <code className="text-xs">supabase/schema.sql</code>
            ).
          </p>
        </div>
      );
    }

    ideas = (rows ?? []) as IdeaRow[];
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Ideas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Filter by status, function, or business owner.
          </p>
          {useLocalIdeasStore() && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 max-w-xl">
              Local dev mode: ideas are stored in{" "}
              <code className="font-mono">.local-data/ideas.json</code> (no
              Supabase). Turn off{" "}
              <code className="font-mono">USE_LOCAL_IDEAS_STORE</code> when your
              network trusts HTTPS to Supabase.
            </p>
          )}
        </div>
        <Link
          href="/intake"
          className="inline-flex justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 shrink-0"
        >
          New intake
        </Link>
      </div>

      <form
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap gap-3 items-end"
        method="get"
      >
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Status
          </label>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white min-w-[140px]"
          >
            <option value="">Any</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Function
          </label>
          <select
            name="function"
            defaultValue={marketing_function ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white min-w-[180px]"
          >
            <option value="">Any</option>
            {MARKETING_FUNCTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Owner contains
          </label>
          <input
            name="owner"
            type="text"
            defaultValue={owner ?? ""}
            placeholder="e.g. Jane"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
        >
          Apply
        </button>
        <Link
          href="/ideas"
          className="text-sm text-sky-600 hover:text-sky-800 py-2"
        >
          Clear
        </Link>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Use case</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Function</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Hours</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ideas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No ideas match these filters.
                  </td>
                </tr>
              ) : (
                ideas.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <Link
                        href={`/ideas/${row.id}`}
                        className="font-medium text-sky-700 hover:text-sky-900 line-clamp-2"
                      >
                        {row.use_case || "—"}
                      </Link>
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                        {row.submitter_email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {row.status ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[140px] truncate">
                      {row.business_owner ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[120px] truncate">
                      {row.marketing_function ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {row.escalation_tier ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[120px] truncate">
                      {row.hours_saved ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
