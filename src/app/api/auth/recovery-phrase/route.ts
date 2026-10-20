import { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/auth/guards";
import { allowMutation, jsonResult, readJsonObject } from "@/server/auth/request";
import { withAuthDb } from "@/server/auth/database";
import { sessionAccount } from "@/server/auth/session";
import { prepareRecoveryPhrase, validRecoveryPhrase } from "@/server/auth/recovery";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  if (!allowMutation(request)) return jsonResult({error:"forbidden"},403);
  const account = await sessionAccount(request.cookies.get(SESSION_COOKIE)?.value);
  if (!account) return jsonResult({error:"unauthorized"},401);
  if (account.role!=="admin" || account.must_change_password) return jsonResult({error:"forbidden"},403);
  const body = await readJsonObject(request);
  if (typeof body?.currentPassword!=="string" || !validRecoveryPhrase(body?.recoveryPhrase)) {
    return jsonResult({error:"invalid-input"},400);
  }
  try {
    const ok = await withAuthDb(client=>prepareRecoveryPhrase(client,account,body.currentPassword as string,body.recoveryPhrase as string));
    return ok?jsonResult({ok:true}):jsonResult({error:"invalid-proof"},400);
  } catch { return jsonResult({error:"service-unavailable"},503); }
}
