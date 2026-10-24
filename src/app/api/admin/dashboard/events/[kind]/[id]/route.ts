import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withAuthDb} from "@/server/auth/database";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {readDashboardEvent,updateDashboardEvent,validDashboardEventKind}
 from "@/server/dashboard/event-edit";
export const dynamic="force-dynamic";
export const runtime="nodejs";
type Context={params:Promise<{kind:string;id:string}>};
export async function GET(req:NextRequest,ctx:Context){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {kind,id}=await ctx.params;
 if(!validDashboardEventKind(kind))return jsonResult({error:"invalid-input"},400);
 const teamId=req.nextUrl.searchParams.get("teamId")??"";
 const sprintId=req.nextUrl.searchParams.get("sprintId")??"";
 try{
  const event=await withSprintIndexDb(db=>readDashboardEvent(db,kind,id,teamId,sprintId));
  return jsonResult(event?{event}:{error:"not-found"},event?200:404);
 }catch{return jsonResult({error:"unavailable"},503);}
}
export async function PATCH(req:NextRequest,ctx:Context){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {kind,id}=await ctx.params;
 if(!validDashboardEventKind(kind))return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>updateDashboardEvent(db,actor.id,kind,id,body));
  return jsonResult(result,result.ok?200:result.error==="not-found"?404:
   ["conflict","closed-period","not-yet-due","outside-sprint"].includes(result.error)?409:400);
 }catch{return jsonResult({error:"unavailable"},503);}
}
