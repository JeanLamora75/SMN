import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
import {withAuthDb} from "@/server/auth/database";
import {resolveRegistryReadContext} from "@/server/registries/team-access";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {readTeamContext,saveTeamContext} from "@/server/members/team-context";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const collective={type:"collective",exists:true,inScope:true} as const;
const settings={type:"settings",exists:true,inScope:true} as const;

export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",collective);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const params=request.nextUrl.searchParams;
 if(params.size!==1||!params.get("teamId"))
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>{
   const teamId=params.get("teamId")!;
   const context=await resolveRegistryReadContext(db,
    {accountId:actor.id,role:actor.role},teamId);
   if(context.version===28){
    if(context.team?.team_id!==teamId)throw Error("team-context-forbidden");
    return readTeamContext(db,teamId);
   }
   // Le parcours monoéquipe historique reste inchangé.
   const version=await db.query<{schema_version:number}>(
    "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
   if(version.rows.length!==1||version.rows[0].schema_version>27)
    throw Error("team-context-schema-unavailable");
   return readTeamContext(db,teamId);
  });
  return jsonResult(result??{error:"not-found"},result?200:404);
 }catch{
  console.error("team-context-read-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function PATCH(request:NextRequest){
 const actor=await authorizeApi(request,"write",settings);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request,48000);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>{
   const teamId=typeof body.teamId==="string"?body.teamId:null;
   const context=await resolveRegistryReadContext(db,
    {accountId:actor.id,role:actor.role},teamId);
   if(context.version===28){
    if(!MULTI_TEAM_CONTEXT_READY||
       process.env.SMN_MULTI_TEAM_WRITES_ENABLED!=="true")
     throw Error("team-context-write-not-ready");
    if(!teamId||context.team?.team_id!==teamId)
     throw Error("team-context-forbidden");
    return saveTeamContext(db,actor.id,body,
     {accountId:actor.id,role:actor.role});
   }
   await assertLegacyTeamApi(db);
   return saveTeamContext(db,actor.id,body);
  });
  return jsonResult(result,result.ok?200:result.error==="conflict"?409:
   result.error==="not-found"?404:400);
 }catch(error){
  if(error instanceof Error&&error.message==="team-context-write-not-ready")
   return jsonResult({error:"context-not-ready"},503);
  console.error("team-context-write-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
