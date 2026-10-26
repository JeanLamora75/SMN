import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {readAdminActiveTeam,saveAdminActiveTeam} from "@/server/teams/active";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const settings={type:"settings",exists:true,inScope:true} as const;

/** Les préférences d'équipe ne sont pas des habilitations : accès Admin uniquement. */
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",settings);
 if(!actor)return jsonResult({error:"forbidden"},403);
 if(request.nextUrl.searchParams.size)return jsonResult({error:"invalid-input"},400);
 if(!MULTI_TEAM_CONTEXT_READY)
  return jsonResult({ready:false,teamId:null,items:[]});
 try{
  const state=await withAuthDb(db=>readAdminActiveTeam(db,actor.id));
  if(!state)return jsonResult({error:"forbidden"},403);
  return jsonResult(state);
 }catch{
  console.error("team-preference-read-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function PUT(request:NextRequest){
 const actor=await authorizeApi(request,"write",settings);
 if(!actor)return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)
  return jsonResult({error:"context-not-ready"},503);
 const body=await readJsonObject(request,512);
 if(!body||Object.keys(body).length!==1||typeof body.teamId!=="string")
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>saveAdminActiveTeam(db,actor.id,body.teamId));
  return jsonResult(result,result.ok?200:
   result.error==="forbidden"?403:
   result.error==="not-found"?404:
   result.error==="not-ready"?503:400);
 }catch{
  console.error("team-preference-write-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
