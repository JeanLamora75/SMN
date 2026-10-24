import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {readDashboardNote,updateDashboardNote} from "@/server/dashboard/notes";
export const dynamic="force-dynamic";
export const runtime="nodejs";
type Context={params:Promise<{id:string}>};
export async function GET(req:NextRequest,context:Context){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await context.params;
 const teamId=req.nextUrl.searchParams.get("teamId")??"";
 const sprintId=req.nextUrl.searchParams.get("sprintId")??"";
 try{
  const note=await withSprintIndexDb(db=>readDashboardNote(db,id,teamId,sprintId));
  return jsonResult(note?{note}:{error:"not-found"},note?200:404);
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest,context:Context){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await context.params;
 const raw=await readJsonObject(req);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>updateDashboardNote(db,actor.id,id,raw));
  return jsonResult(result,result.ok?200:result.error==="conflict"?409:
   result.error==="closed-period"?409:result.error==="not-found"?404:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
