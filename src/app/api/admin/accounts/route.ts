import { NextRequest } from "next/server";
import { SESSION_COOKIE, validLocalHost } from "@/server/auth/guards";
import { sessionAccount } from "@/server/auth/session";
import { withAuthDb } from "@/server/auth/database";
import { listAccounts, createAccount } from "@/server/accounts/manager";
import { allowMutation, jsonResult, readJsonObject } from "@/server/auth/request";

export const dynamic = "force-dynamic";
async function isAdmin(request:NextRequest) {
  const account=await sessionAccount(request.cookies.get(SESSION_COOKIE)?.value);
  return !!account && account.role==="admin" && !account.must_change_password;
}
export async function GET(request:NextRequest) {
  if (!validLocalHost(request.headers.get("host"))) return jsonResult({error:"forbidden"},403);
  if (!await isAdmin(request)) return jsonResult({error:"forbidden"},403);
  try {
    const accounts=await withAuthDb(listAccounts);
    return jsonResult({accounts});
  } catch { return jsonResult({error:"service-unavailable"},503); }
}
export async function POST(request:NextRequest) {
  if (!allowMutation(request)) return jsonResult({error:"forbidden"},403);
  if (!await isAdmin(request)) return jsonResult({error:"forbidden"},403);
  const body=await readJsonObject(request);
  if (!body) return jsonResult({error:"invalid-input"},400);
  try {
    const result=await withAuthDb(client=>createAccount(client,body));
    if (result.ok) return jsonResult({account:result.data},201);
    return jsonResult({error:result.error},result.error==="duplicate-account"?409:400);
  } catch { return jsonResult({error:"service-unavailable"},503); }
}
