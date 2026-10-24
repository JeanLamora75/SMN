import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readKanbanFlow,saveKanbanFlow} from "@/server/kanban/flow-counts";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"read",resource))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const result=await withAuthDb(db=>readKanbanFlow(db,id));return result?jsonResult(result):jsonResult({error:"not-found"},404);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const result=await withAuthDb(db=>saveKanbanFlow(db,actor.id,id,raw));
  return result.ok?jsonResult(result):jsonResult(result,result.error==="not-found"?404:result.error==="closed-period"?409:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
