import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {requireIndicatorTeam} from "@/server/indicators/team-access";
import {readDashboardCockpit} from "@/server/indicators/dashboard-cockpit";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const q=req.nextUrl.searchParams,teamId=q.get("teamId")??"",cycleId=q.get("cycleId")??undefined,cycleType=q.get("cycleType");
 if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(teamId)||cycleId!==undefined&&!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(cycleId)||!["scrum","kanban"].includes(cycleType??""))return jsonResult({error:"invalid-input"},400);
 try{return jsonResult(await withAuthDb(async db=>{await requireIndicatorTeam(db,{accountId:actor.id,role:actor.role},teamId);return {blocks:await readDashboardCockpit(db,teamId,cycleType as "scrum"|"kanban",cycleId)};}),200);}
 catch{return jsonResult({error:"unavailable"},503);}
}
