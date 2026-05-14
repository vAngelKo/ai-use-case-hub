import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-xl mx-auto p-6 md:p-10 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">AI Use Case Hub</h1>
      <p className="text-slate-600 text-sm leading-relaxed">
        Capture ideas with structured fields and an AI-guided chat, store them
        in a shared database, and post a summary to Slack when something new is
        submitted.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
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
          View ideas
        </Link>
      </div>
    </div>
  );
}
