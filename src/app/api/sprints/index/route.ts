import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {parseSprintIndexQuery,readSprintIndex} from "@/server/sprints/index";
import {resolveAdminTeam} from "@/server/teams/resolve";

export const dynamic="force-dynamic";
export const runtime="nodejs";

const collective={type:"collective",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",collective);
 if(!actor)
  return jsonResult({error:"forbidden"},403);
 const params=new URLSearchParams(request.nextUrl.searchParams);
 const requestedTeamId=params.get("teamId");
 if(requestedTeamId!==null)params.delete("teamId");
 const options=parseSprintIndexQuery(params);
 if(!options)return jsonResult({error:"invalid-input"},400);
 try{return jsonResult(await withSprintIndexDb(async db=>{
  const installation=await db.query<{schema_version:number}>(
   "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
  const version=installation.rows[0]?.schema_version??0;
  if(version>=28){
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:actor.role},requestedTeamId);
   if(team.mode!=="scrum")return {error:"not-scrum"};
   return readSprintIndex(db,options,{id:team.team_id,name:team.team});
  }
  return readSprintIndex(db,options);
 }));}
 catch{
  console.error("sprint-index-read-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
