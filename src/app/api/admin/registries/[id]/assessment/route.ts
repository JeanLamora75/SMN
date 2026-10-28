import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
import {withAuthDb} from "@/server/auth/database";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
import {withLegacyRegistryReadDb} from "@/server/registries/legacy-read";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readRiskAssessment,saveRiskAssessment} from "@/server/registries/assessment";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const data=await withLegacyRegistryReadDb(db=>readRiskAssessment(db,id));
  return jsonResult(data??{error:"not-found"},data?200:404);
 }catch(error){
  if(error instanceof Error&&error.message==="registry-team-write-not-ready")
   return jsonResult({error:"context-not-ready"},503);
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const data=await withAuthDb(async db=>{
  const teamId=req.nextUrl.searchParams.get("teamId");
  const context=await resolveRegistryReadContext(db,{accountId:actor.id,role:actor.role},teamId);
  if(context.version===28){
   if(!MULTI_TEAM_CONTEXT_READY||process.env.SMN_MULTI_TEAM_WRITES_ENABLED!=="true")
    throw Error("registry-team-write-not-ready");
   if(!teamId||context.team?.team_id!==teamId)throw Error("registry-team-write-forbidden");
   return saveRiskAssessment(db,actor.id,id,body,{
    actor:{accountId:actor.id,role:actor.role},teamId
   });
  }
  await assertLegacyTeamApi(db);
  return saveRiskAssessment(db,actor.id,id,body);
 });
  return jsonResult(data,data.ok?200:data.error==="conflict"?409:data.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
