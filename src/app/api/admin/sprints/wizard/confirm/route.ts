import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {confirmWizard} from "@/server/sprints/wizard";
export const dynamic="force-dynamic";
export const runtime="nodejs";

export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>confirmWizard(db,actor.id,input));
  return jsonResult(result,result.ok?201:result.error==="invalid-input"?400:409);
 }catch(error){
  console.error("sprint-wizard-confirm-failed");
  return jsonResult({error:"generation-unavailable"},503);
 }
}
