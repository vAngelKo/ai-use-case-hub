"use client";

import { useState } from "react";
import type { UseCaseOutput } from "@/types";

export function SubmitRequestButton({ data }: { data: UseCaseOutput }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [slackWarning, setSlackWarning] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCase: data }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = [json.error, json.detail].filter(Boolean).join(" ");
        throw new Error(msg || `Request failed (${res.status})`);
      }
      setSavedId(typeof json.id === "string" ? json.id : null);
      setSlackWarning(
        typeof json.slackError === "string" ? json.slackError : null
      );
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 space-y-2">
          <p>
            Your idea was saved to the hub
            {savedId ? ` (id: ${savedId})` : ""}.
            {!slackWarning && " The team was notified in Slack."}
          </p>
          <a
            href="/ideas"
            className="inline-block text-sky-700 font-medium hover:text-sky-800"
          >
            View all ideas →
          </a>
        </div>
        {slackWarning && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Saved, but Slack notification failed: {slackWarning}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-6 py-3 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition w-full sm:w-auto"
      >
        {loading ? "Submitting…" : "Submit idea"}
      </button>
      {error && (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
