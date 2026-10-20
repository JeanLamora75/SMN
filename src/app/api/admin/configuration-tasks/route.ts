import { NextRequest } from "next/server";
import { authorizeApi } from "@/server/auth/authorization";
import { jsonResult,readJsonObject } from "@/server/auth/request";
import { withAuthDb } from "@/server/auth/database";
import { readConfigurationChecklist,updateConfigurationTask } from "@/server/configuration/tasks";

export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(request:NextRequest) {
  if(!await authorizeApi(request,"read",target))return jsonResult({error:"forbidden"},403);
  try {return jsonResult(await withAuthDb(readConfigurationChecklist));}
  catch {console.error("smn-configuration-read-failed");
    return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(request:NextRequest) {
  const actor=await authorizeApi(request,"write",target);
  if(!actor)return jsonResult({error:"forbidden"},403);
  const body=await readJsonObject(request);
  if(!body)return jsonResult({error:"invalid-input"},400);
  try {
    const result=await withAuthDb(client=>updateConfigurationTask(client,actor.id,body));
    if(!result.ok)return jsonResult({error:result.error},400);
    return jsonResult(result.checklist);
  }catch {console.error("smn-configuration-write-failed");
    return jsonResult({error:"service-unavailable"},503);}
}
