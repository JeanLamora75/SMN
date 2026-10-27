import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {readSprintTickets,writeSprintTickets} from "@/server/sprints/ticket-counts";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const resource={type:"settings",exists:true,inScope:true} as const;

export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",resource))
  return jsonResult({error:"forbidden"},403);
 const sprintId=req.nextUrl.searchParams.get("sprintId");
 if(!sprintId||!/^[0-9a-f-]{36}$/i.test(sprintId))
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>readSprintTickets(db,sprintId));
  return jsonResult(result??{error:"not-found"},result?200:404);
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function PUT(req:NextRequest){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const data=await readJsonObject(req);
 if(!data)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>writeSprintTickets(db,actor.id,data));
  return jsonResult(result,result.ok?200:
   result.error==="closed-period"||result.error==="conflict"?409:
   result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
