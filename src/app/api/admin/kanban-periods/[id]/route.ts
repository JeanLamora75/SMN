import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {kanbanDeletionSummary,deleteKanbanPeriod} from "@/server/kanban/delete";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const summary=await withAuthDb(db=>kanbanDeletionSummary(db,id));
  return summary?jsonResult(summary):jsonResult({error:"not-found"},404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function DELETE(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const data=await readJsonObject(request);
 if(!data||typeof data.name!=="string"||typeof data.startOn!=="string"||typeof data.endOn!=="string")
  return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withAuthDb(db=>deleteKanbanPeriod(db,actor.id,id,{
   name:data.name as string,startOn:data.startOn as string,endOn:data.endOn as string
  }));
  if(!result.ok)return jsonResult(result,result.error==="not-found"?404:result.error==="invalid-input"?400:409);
  return jsonResult(result);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
