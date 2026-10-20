import { NextRequest } from "next/server";
import { withAuthDb } from "@/server/auth/database";
import { changeInitialPassword, accountById } from "@/server/auth/credentials";
import { issueSession, revokeAccountSessions, sessionAccount } from "@/server/auth/session";
import { SESSION_COOKIE } from "@/server/auth/guards";
import { allowMutation, jsonResult, readJsonObject, setSessionCookie } from "@/server/auth/request";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  if (!allowMutation(request)) return jsonResult({ error: "forbidden" }, 403);
  const previousToken = request.cookies.get(SESSION_COOKIE)?.value;
  const account = await sessionAccount(previousToken);
  if (!account) return jsonResult({ error: "unauthorized" }, 401);
  if (!account.must_change_password) return jsonResult({ error: "already-changed" }, 409);
  const body = await readJsonObject(request);
  const oldPassword = body?.currentPassword;
  const nextPassword = body?.newPassword;
  if (typeof oldPassword !== "string" || typeof nextPassword !== "string" ||
      oldPassword.length > 256 || nextPassword.length < 4 || nextPassword.length > 256) {
    return jsonResult({ error: "invalid-input" }, 400);
  }
  try {
    const changed = await withAuthDb(client => changeInitialPassword(client, account, oldPassword, nextPassword));
    if (!changed) return jsonResult({ error: "invalid-current-or-reused" }, 400);
    revokeAccountSessions(account.id);
    const updated = await withAuthDb(client => accountById(client, account.id));
    if (!updated || updated.must_change_password) return jsonResult({ error: "service-unavailable" }, 503);
    return setSessionCookie(jsonResult({ ok: true }), request, issueSession(updated));
  } catch { return jsonResult({ error: "service-unavailable" }, 503); }
}
