import { NextRequest } from "next/server";
import { authorizeApi } from "@/server/auth/authorization";
import { withAuthDb } from "@/server/auth/database";
import { listAccounts, createAccount } from "@/server/accounts/manager";
import { jsonResult, readJsonObject } from "@/server/auth/request";

export const dynamic = "force-dynamic";
export async function GET(request:NextRequest) {
  if (!await authorizeApi(request,"read",{type:"accounts",exists:true,inScope:true})) return jsonResult({error:"forbidden"},403);
  try {
    const accounts=await withAuthDb(listAccounts);
    return jsonResult({accounts});
  } catch { return jsonResult({error:"service-unavailable"},503); }
}
export async function POST(request:NextRequest) {
  if (!await authorizeApi(request,"write",{type:"accounts",exists:true,inScope:true})) return jsonResult({error:"forbidden"},403);
  const body=await readJsonObject(request);
  if (!body) return jsonResult({error:"invalid-input"},400);
  try {
    const result=await withAuthDb(client=>createAccount(client,body));
    if (result.ok) return jsonResult({account:result.data},201);
    return jsonResult({error:result.error},result.error==="duplicate-account"?409:400);
  } catch { return jsonResult({error:"service-unavailable"},503); }
}
