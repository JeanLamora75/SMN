import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {readTeamContext,saveTeamContext} from "@/server/members/team-context";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const collective={type:"collective",exists:true,inScope:true} as const;
const settings={type:"settings",exists:true,inScope:true} as const;

export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",collective))
  return jsonResult({error:"forbidden"},403);
 const params=request.nextUrl.searchParams;
 if(params.size!==1||!params.get("teamId"))
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>readTeamContext(db,params.get("teamId")!));
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
  const result=await withLegacyTeamApi(db=>saveTeamContext(db,actor.id,body));
  return jsonResult(result,result.ok?200:result.error==="conflict"?409:
   result.error==="not-found"?404:400);
 }catch{
  console.error("team-context-write-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
