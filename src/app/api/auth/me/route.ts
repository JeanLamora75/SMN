import { NextRequest } from "next/server";
import { SESSION_COOKIE, validLocalHost } from "@/server/auth/guards";
import { sessionAccount } from "@/server/auth/session";
import { jsonResult } from "@/server/auth/request";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (!validLocalHost(request.headers.get("host"))) return jsonResult({ error: "forbidden" }, 403);
  const account = await sessionAccount(request.cookies.get(SESSION_COOKIE)?.value);
  if (!account) return jsonResult({ error: "unauthorized" }, 401);
  return jsonResult({ authenticated: true, username: account.username, role: account.role,
    mustChangePassword: account.must_change_password });
}
