"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UseCaseOutput } from "@/types";
import { ReviewForm } from "@/components/ReviewForm";

export function IdeaDetailForm({
  ideaId,
  initial,
  isAdmin = false,
}: {
  ideaId: string;
  initial: UseCaseOutput;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [data, setData] = useState<UseCaseOutput>(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = async () => {
    if (!confirm("Delete this idea? This cannot be undone.")) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Delete failed (${res.status})`);
      router.push("/ideas");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ReviewForm data={data} onChange={setData} variant="full" isAdmin={isAdmin} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || deleting}
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
        {isAdmin && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete idea"}
          </button>
        )}
      </div>
    </div>
  );
}
