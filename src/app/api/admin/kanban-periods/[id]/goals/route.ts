import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {withKanbanRouteTeam} from "@/server/kanban/route-context";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readKanbanGoals,saveKanbanGoal} from "@/server/kanban/goals";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const result=await withAuthDb(db=>withKanbanRouteTeam(db,request,actor,false,access=>readKanbanGoals(db,id,access)));return result?jsonResult(result):jsonResult({error:"not-found"},404);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withAuthDb(db=>withKanbanRouteTeam(db,request,actor,true,access=>saveKanbanGoal(db,actor.id,id,input,access)));
  return result.ok?jsonResult(result,201):jsonResult(result,result.error==="not-found"?404:result.error==="invalid-input"?400:409);
 }catch(error){
  if(error instanceof Error&&error.message==="context-not-ready")
   return jsonResult({error:"context-not-ready"},503);
  return jsonResult({error:"service-unavailable"},503);
 }
}
