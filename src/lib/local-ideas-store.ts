import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { IdeaRow } from "@/types";

const DATA_DIR = path.join(process.cwd(), ".local-data");
const DATA_FILE = path.join(DATA_DIR, "ideas.json");

export type LocalIdeaInsert = Omit<
  IdeaRow,
  "id" | "created_at" | "updated_at"
>;

export function useLocalIdeasStore(): boolean {
  const v = process.env.USE_LOCAL_IDEAS_STORE?.trim().toLowerCase();
  return v === "true" || v === "1";
}

function ensureStore(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]\n", "utf8");
  }
}

function readAll(): IdeaRow[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as IdeaRow[]) : [];
  } catch {
    return [];
  }
}

function writeAll(rows: IdeaRow[]): void {
  ensureStore();
  fs.writeFileSync(DATA_FILE, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
}

export function listLocalIdeas(filters: {
  status?: string;
  marketing_function?: string;
  owner?: string;
  q?: string;
}): IdeaRow[] {
  let rows = readAll();
  if (filters.status) {
    rows = rows.filter((r) => r.status === filters.status);
  }
  if (filters.marketing_function) {
    rows = rows.filter(
      (r) => r.marketing_function === filters.marketing_function
    );
  }
  if (filters.owner) {
    const q = filters.owner.toLowerCase();
    rows = rows.filter((r) =>
      (r.business_owner ?? "").toLowerCase().includes(q)
    );
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.use_case ?? "").toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        (r.ai_tool ?? "").toLowerCase().includes(q)
    );
  }
  return rows.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getLocalIdea(id: string): IdeaRow | null {
  return readAll().find((r) => r.id === id) ?? null;
}

export function insertLocalIdea(data: LocalIdeaInsert): IdeaRow {
  const rows = readAll();
  const now = new Date().toISOString();
  const row: IdeaRow = {
    id: randomUUID(),
    created_at: now,
    updated_at: now,
    ...data,
    missing_info: data.missing_info ?? [],
    suggested_follow_up_questions:
      data.suggested_follow_up_questions ?? [],
  };
  rows.unshift(row);
  writeAll(rows);
  return row;
}

export function deleteLocalIdea(id: string): boolean {
  const rows = readAll();
  const next = rows.filter((r) => r.id !== id);
  if (next.length === rows.length) return false;
  writeAll(next);
  return true;
}

export function patchLocalIdea(
  id: string,
  patch: Record<string, unknown>
): boolean {
  const rows = readAll();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  rows[idx] = {
    ...rows[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  } as IdeaRow;
  writeAll(rows);
  return true;
}
