import { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/auth/guards";
import { sessionAccount, revokeAccountSessions } from "@/server/auth/session";
import { withAuthDb } from "@/server/auth/database";
import { updateAccount } from "@/server/accounts/manager";
import { allowMutation, jsonResult, readJsonObject } from "@/server/auth/request";

export const dynamic = "force-dynamic";
export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}) {
  if (!allowMutation(request)) return jsonResult({error:"forbidden"},403);
  const actor=await sessionAccount(request.cookies.get(SESSION_COOKIE)?.value);
  if (!actor || actor.role!=="admin" || actor.must_change_password)
    return jsonResult({error:"forbidden"},403);
  const body=await readJsonObject(request);
  if (!body) return jsonResult({error:"invalid-input"},400);
  const {id}=await context.params;
  try {
    const result=await withAuthDb(client=>updateAccount(client,id,actor.id,body));
    if (!result.ok) {
      const code=result.error==="account-not-found"?404:
        result.error==="last-admin"||result.error==="self-protected"?409:400;
      return jsonResult({error:result.error},code);
    }
    // Les anciennes sessions ne gagnent ni ne gardent aucun privilège.
    revokeAccountSessions(id);
    return jsonResult({account:result.data});
  } catch { return jsonResult({error:"service-unavailable"},503); }
}
