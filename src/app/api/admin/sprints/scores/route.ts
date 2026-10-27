import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {writeSprintScores} from "@/server/sprints/sprint-scores";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const resource={type:"settings",exists:true,inScope:true} as const;

export async function PUT(req:NextRequest){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>writeSprintScores(db,actor.id,raw));
  return jsonResult(result,result.ok?200:
   result.error==="closed-period"||result.error==="conflict"?409:
   result.error==="not-found"?404:400);
 }catch{
  return jsonResult({error:"unavailable"},503);
 }
}
