import { NextRequest } from "next/server";
import {
  getAdminSecret,
  makeAdminToken,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE,
} from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}));
  const secret = getAdminSecret();

  if (!secret) {
    return new Response(
      JSON.stringify({ error: "Admin access is not configured (ADMIN_SECRET not set)" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!password || password !== secret) {
    return new Response(JSON.stringify({ error: "Invalid password" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = makeAdminToken(secret);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${ADMIN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ADMIN_COOKIE_MAX_AGE}${secure}`,
    },
  });
}
