import { cookies } from "next/headers";
import { createHmac } from "node:crypto";

export const ADMIN_COOKIE_NAME = "hub_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function makeAdminToken(secret: string): string {
  return createHmac("sha256", secret).update("admin-session").digest("hex");
}

export function getAdminSecret(): string | undefined {
  return process.env.ADMIN_SECRET?.trim() || undefined;
}

/** Call from server components and server actions to check if the current request is an admin. */
export async function isAdmin(): Promise<boolean> {
  const secret = getAdminSecret();
  if (!secret) return false;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  return token === makeAdminToken(secret);
}
