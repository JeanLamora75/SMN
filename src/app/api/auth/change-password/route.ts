import { NextRequest } from "next/server";
import { withAuthDb } from "@/server/auth/database";
import { accountById } from "@/server/auth/credentials";
import { renewPassword } from "@/server/auth/recovery";
import { issueSession, revokeAccountSessions, sessionAccount } from "@/server/auth/session";
import { SESSION_COOKIE } from "@/server/auth/guards";
import { allowMutation, jsonResult, readJsonObject, setSessionCookie } from "@/server/auth/request";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  if (!allowMutation(request)) return jsonResult({error:"forbidden"},403);
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const account = await sessionAccount(token);
  if (!account) return jsonResult({error:"unauthorized"},401);
  const body = await readJsonObject(request);
  if (typeof body?.currentPassword!=="string" || typeof body?.newPassword!=="string" ||
    body.currentPassword.length>256 || body.newPassword.length<4 || body.newPassword.length>256) {
    return jsonResult({error:"invalid-input"},400);
  }
  try {
    const changed = await withAuthDb(client=>renewPassword(client,account,body.currentPassword as string,body.newPassword as string));
    if (!changed) return jsonResult({error:"invalid-current-or-reused"},400);
    revokeAccountSessions(account.id);
    const updated = await withAuthDb(client=>accountById(client,account.id));
    if (!updated || updated.must_change_password) return jsonResult({error:"service-unavailable"},503);
    return setSessionCookie(jsonResult({ok:true}),request,issueSession(updated));
  } catch { return jsonResult({error:"service-unavailable"},503); }
}
