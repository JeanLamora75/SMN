import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readKanbanClosures,changeKanbanClosure} from "@/server/kanban/closure";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"read",resource))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{return jsonResult({versions:await withLegacyTeamApi(db=>readKanbanClosures(db,id))});}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(req);
 if(!input||Object.keys(input).join(",")!=="action"||(input.action!=="close"&&input.action!=="reopen"))return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withLegacyTeamApi(db=>changeKanbanClosure(db,id,actor.id,input.action as "close"|"reopen"));
  return result.ok?jsonResult(result):jsonResult(result,result.error==="not-found"?404:409);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
