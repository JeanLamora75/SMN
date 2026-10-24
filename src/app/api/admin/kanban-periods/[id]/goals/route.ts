import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readKanbanGoals,saveKanbanGoal} from "@/server/kanban/goals";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const result=await withAuthDb(db=>readKanbanGoals(db,id));return result?jsonResult(result):jsonResult({error:"not-found"},404);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withAuthDb(db=>saveKanbanGoal(db,actor.id,id,input));
  return result.ok?jsonResult(result,201):jsonResult(result,result.error==="not-found"?404:result.error==="invalid-input"?400:409);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
