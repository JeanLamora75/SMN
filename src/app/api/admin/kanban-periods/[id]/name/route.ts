import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {renameKanbanPeriod} from "@/server/kanban/rename";
export const dynamic="force-dynamic";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"collective",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);
 if(!input)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withAuthDb(db=>renameKanbanPeriod(db,actor.id,id,input));
  if(!result.ok)return jsonResult({error:result.error},result.error==="not-found"?404:400);
  return jsonResult(result);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
