import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {readSprintGoals,writeSprintGoal} from "@/server/sprints/goals";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",target))return jsonResult({error:"forbidden"},403);
 const sprintId=req.nextUrl.searchParams.get("sprintId");
 if(!sprintId)return jsonResult({error:"invalid-input"},400);
 try{const r=await withLegacyTeamApi(db=>readSprintGoals(db,sprintId));return jsonResult(r??{error:"not-found"},r?200:404);}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);if(!input)return jsonResult({error:"invalid-input"},400);
 try{const r=await withLegacyTeamApi(db=>writeSprintGoal(db,actor.id,input));
 return jsonResult(r,r.ok?200:r.error==="closed-period"||r.error==="conflict"?409:r.error==="not-found"?404:400);}
 catch{return jsonResult({error:"unavailable"},503);}
}
