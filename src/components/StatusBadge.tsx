const STATUS_STYLES: Record<string, string> = {
  "Idea": "bg-sky-100 text-sky-800",
  "In Progress": "bg-amber-100 text-amber-800",
  "Live": "bg-emerald-100 text-emerald-800",
  "On Hold": "bg-slate-200 text-slate-600",
  "Under Review": "bg-violet-100 text-violet-800",
};

const TIER_STYLES: Record<string, string> = {
  "Tier 1": "bg-rose-100 text-rose-800",
  "Tier 2": "bg-amber-100 text-amber-800",
  "Tier 3": "bg-sky-100 text-sky-800",
};

export function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "—";
  const cls = STATUS_STYLES[s] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {s}
    </span>
  );
}

export function TierBadge({ tier }: { tier: string | null }) {
  const t = tier ?? "—";
  const cls = TIER_STYLES[t] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {t}
    </span>
  );
}
