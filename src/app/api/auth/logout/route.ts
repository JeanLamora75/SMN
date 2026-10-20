import { NextRequest } from "next/server";
import { revokeSession } from "@/server/auth/session";
import { SESSION_COOKIE } from "@/server/auth/guards";
import { allowMutation, clearSessionCookie, jsonResult } from "@/server/auth/request";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  if (!allowMutation(request)) return jsonResult({ error: "forbidden" }, 403);
  revokeSession(request.cookies.get(SESSION_COOKIE)?.value);
  return clearSessionCookie(jsonResult({ ok: true }), request);
}
