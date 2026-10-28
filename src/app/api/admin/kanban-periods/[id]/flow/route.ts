import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {withKanbanRouteTeam} from "@/server/kanban/route-context";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readKanbanFlow,saveKanbanFlow} from "@/server/kanban/flow-counts";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const result=await withAuthDb(db=>withKanbanRouteTeam(db,req,actor,false,access=>readKanbanFlow(db,id,access)));return result?jsonResult(result):jsonResult({error:"not-found"},404);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const result=await withAuthDb(db=>withKanbanRouteTeam(db,req,actor,true,access=>saveKanbanFlow(db,actor.id,id,raw,access)));
  return result.ok?jsonResult(result):jsonResult(result,result.error==="not-found"?404:result.error==="closed-period"?409:400);
 }catch(error){
  if(error instanceof Error&&error.message==="context-not-ready")
   return jsonResult({error:"context-not-ready"},503);
  return jsonResult({error:"service-unavailable"},503);
 }
}
