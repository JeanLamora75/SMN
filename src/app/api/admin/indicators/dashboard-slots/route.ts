import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {validMutationOrigin} from "@/server/auth/guards";
import {requireIndicatorTeam} from "@/server/indicators/team-access";
import {readDashboardSlots,assignDashboardSlot,type DashboardBlockKey} from "@/server/indicators/dashboard-slots";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const teamId=req.nextUrl.searchParams.get("teamId")??"";
 if(!teamId)return jsonResult({error:"invalid-input"},400);
 try{return jsonResult(await withAuthDb(async db=>{await requireIndicatorTeam(db,{accountId:actor.id,role:actor.role},teamId);return {slots:await readDashboardSlots(db,teamId)};}),200);}
 catch{return jsonResult({error:"unavailable"},503);}
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 if(!validMutationOrigin(req.headers.get("host"),req.headers.get("origin")))return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,2048);
 if(!body||typeof body.teamId!=="string"||!["story_points","tickets","complementary"].includes(String(body.block))||(typeof body.position!=="number"||!Number.isInteger(body.position))||!(body.indicatorId===null||typeof body.indicatorId==="string"))return jsonResult({error:"invalid-input"},400);
 try{
  await withAuthDb(async db=>{await requireIndicatorTeam(db,{accountId:actor.id,role:actor.role},body.teamId as string);await assignDashboardSlot(db,body.teamId as string,body.block as DashboardBlockKey,body.position as number,body.indicatorId as string|null);});
  return jsonResult({ok:true},200);
 }catch(e){const code=e instanceof Error?e.message:"unavailable";return jsonResult({error:code},["slot-occupied","indicator-unavailable"].includes(code)?409:code==="invalid-input"?400:503);}
}
