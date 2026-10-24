import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createKanbanBatch} from "@/server/kanban/batch-create";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",{type:"collective",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>createKanbanBatch(db,actor.id,input));
  if(!result.ok)return jsonResult(result,result.error==="overlap"||result.error==="stale-preview"?409:400);
  return jsonResult(result,201);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
