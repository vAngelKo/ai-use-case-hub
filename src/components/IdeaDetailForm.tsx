"use client";

import { useState } from "react";
import type { UseCaseOutput } from "@/types";
import { ReviewForm } from "@/components/ReviewForm";

export function IdeaDetailForm({
  ideaId,
  initial,
}: {
  ideaId: string;
  initial: UseCaseOutput;
}) {
  const [data, setData] = useState<UseCaseOutput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    setSaving(true);
    setSavedAt(null);
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch: data }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || `Save failed (${res.status})`);
      }
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ReviewForm data={data} onChange={setData} variant="full" />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {savedAt && (
          <span className="text-sm text-emerald-700">Saved at {savedAt}</span>
        )}
        {error && (
          <span className="text-sm text-rose-600" role="alert">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
