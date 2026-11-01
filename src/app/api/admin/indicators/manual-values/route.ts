import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {readJsonObject,jsonResult} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {writeManualValues,readManualCycleValues} from "@/server/indicators/manual-values";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const resource={type:"settings",exists:true,inScope:true} as const;
export async function PUT(req:NextRequest){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>writeManualValues(db,actor.id,body as Parameters<typeof writeManualValues>[2]));
  return jsonResult(result,result.ok?200:result.error==="forbidden"?403:result.error==="not-found"?404:
   result.error==="conflict"?409:result.error==="indicator-unavailable"?422:400);
 }catch{
  console.error("indicator-manual-save-failed");
  return jsonResult({error:"unavailable"},503);
 }
}
export async function GET(req:NextRequest){
 const actor=await authorizeApi(req,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const p=req.nextUrl.searchParams,teamId=p.get("teamId")??"",cycleId=p.get("cycleId")??"";
 const cycleType=p.get("cycleType");
 if(!teamId||!cycleId||!["scrum","kanban"].includes(cycleType??""))return jsonResult({error:"invalid-input"},400);
 try{
  const data=await withAuthDb(async db=>{
   const table=cycleType==="scrum"?"smn_sprint":"smn_kanban_period";
   const row=await db.query("SELECT id FROM public."+table+" WHERE id=$1 AND team_id=$2 AND deleted_at IS NULL",[cycleId,teamId]);
   return row.rows.length?readManualCycleValues(db,teamId,cycleType as "scrum"|"kanban",cycleId):null;
  });
  return data?jsonResult(data,200):jsonResult({error:"not-found"},404);
 }catch{
  console.error("indicator-manual-read-failed");
  return jsonResult({error:"unavailable"},503);
 }
}
