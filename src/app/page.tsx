import Link from "next/link";
import { listLocalIdeas, useLocalIdeasStore } from "@/lib/local-ideas-store";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { StatusBadge } from "@/components/StatusBadge";
import type { IdeaRow } from "@/types";
import {
  STATUS_OPTIONS,
  MARKETING_FUNCTIONS,
  ESCALATION_TIERS,
} from "@/constants/standards";

type StatIdea = Pick<
  IdeaRow,
  | "id"
  | "created_at"
  | "use_case"
  | "status"
  | "marketing_function"
  | "escalation_tier"
>;

async function fetchStatIdeas(): Promise<StatIdea[]> {
  try {
    if (useLocalIdeasStore()) {
      return listLocalIdeas({}).map((r) => ({
        id: r.id,
        created_at: r.created_at,
        use_case: r.use_case,
        status: r.status,
        marketing_function: r.marketing_function,
        escalation_tier: r.escalation_tier,
      }));
    }
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("ideas")
      .select(
        "id, created_at, use_case, status, marketing_function, escalation_tier"
      )
      .order("created_at", { ascending: false });
    return (data ?? []) as StatIdea[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const ideas = await fetchStatIdeas();
  const total = ideas.length;

  const byStatus = STATUS_OPTIONS.map((s) => ({
    label: s,
    count: ideas.filter((i) => i.status === s).length,
  }));

  const byFunction = MARKETING_FUNCTIONS.map((f) => ({
    label: f,
    count: ideas.filter((i) => i.marketing_function === f).length,
  }));

  const byTier = ESCALATION_TIERS.map((t) => ({
    label: t,
    count: ideas.filter((i) => i.escalation_tier === t).length,
  }));

  const liveCount = ideas.filter((i) => i.status === "Live").length;
  const inProgressCount = ideas.filter(
    (i) => i.status === "In Progress"
  ).length;
  const ideaStageCount = ideas.filter((i) => i.status === "Idea").length;
  const recent = ideas.slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            AI Use Case Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Capture, track, and manage your team&apos;s AI initiatives in one
            place.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link
            href="/intake"
            className="inline-flex justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700"
          >
            New intake
          </Link>
          <Link
            href="/ideas"
            className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            View all ideas →
          </Link>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Ideas" value={total} />
        <StatCard label="Live" value={liveCount} highlight />
        <StatCard label="In Progress" value={inProgressCount} />
        <StatCard label="Idea Stage" value={ideaStageCount} />
      </div>

      {/* Breakdown grid */}
      {total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BreakdownCard title="By Status" rows={byStatus} total={total} />
          <BreakdownCard title="By Function" rows={byFunction} total={total} />
          <BreakdownCard
            title="By Escalation Tier"
            rows={byTier}
            total={total}
          />
        </div>
      )}

      {/* Recent ideas */}
      {recent.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-700">
              Recent Ideas
            </h3>
            <Link
              href="/ideas"
              className="text-xs text-sky-600 hover:text-sky-800"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recent.map((idea) => (
              <div
                key={idea.id}
                className="px-5 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/ideas/${idea.id}`}
                    className="text-sm font-medium text-sky-700 hover:text-sky-900 truncate block"
                  >
                    {idea.use_case || "Untitled"}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {idea.marketing_function ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={idea.status} />
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {idea.created_at
                      ? new Date(idea.created_at).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center space-y-3">
          <p className="text-slate-500 text-sm">No ideas yet.</p>
          <Link
            href="/intake"
            className="inline-flex justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Submit the first one →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        highlight
          ? "bg-emerald-50 border-emerald-200"
          : "bg-white border-slate-200"
      }`}
    >
      <p
        className={`text-3xl font-bold tabular-nums ${
          highlight ? "text-emerald-700" : "text-slate-900"
        }`}
      >
        {value}
      </p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { label: string; count: number }[];
  total: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="space-y-3">
        {rows.map(({ label, count }) => (
          <BarRow key={label} label={label} count={count} total={total} />
        ))}
      </div>
    </div>
  );
}

function BarRow({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-600 truncate max-w-[160px]">
          {label}
        </span>
        <span className="text-xs font-medium text-slate-700 ml-2 shrink-0 tabular-nums">
          {count}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-sky-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
