import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {writeSprintCapacityKpis} from "@/server/sprints/sprint-capacity-kpis";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const resource={type:"settings",exists:true,inScope:true} as const;

export async function PUT(req:NextRequest){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>writeSprintCapacityKpis(db,actor.id,body));
  return jsonResult(result,result.ok?200:
   result.error==="closed-period"?423:result.error==="conflict"?409:
   result.error==="not-found"?404:400);
 }catch{
  console.error("sprint-capacity-kpi-save-failed");
  return jsonResult({error:"unavailable"},503);
 }
}
