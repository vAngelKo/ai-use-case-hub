"use client";

import { useRouter } from "next/navigation";

export function AdminBar() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
        Admin
      </span>
      <button
        onClick={handleLogout}
        className="text-xs text-slate-400 hover:text-slate-700"
      >
        Sign out
      </button>
    </div>
  );
}
