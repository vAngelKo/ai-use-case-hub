import Link from "next/link";

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-semibold text-slate-900 hover:text-sky-700"
          >
            Use Case Hub
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/intake" className="text-sky-600 hover:text-sky-800">
              New idea
            </Link>
            <Link href="/ideas" className="text-sky-600 hover:text-sky-800">
              Ideas
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
