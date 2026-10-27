import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createKanbanRenderReference} from "@/server/kanban/render-reference";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"generate",{type:"documents",exists:true,inScope:true,collection:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req);
 if(!raw||Object.keys(raw).sort().join(",")!=="language,sections"||
 (raw.language!=="fr"&&raw.language!=="en")||!Array.isArray(raw.sections)||
 raw.sections.length>5||raw.sections.some(x=>typeof x!=="string"))
 return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const reference=await withLegacyTeamApi(db=>createKanbanRenderReference(db,id,actor.id,raw.sections as string[],raw.language as "fr"|"en"));
  return reference?jsonResult({id:reference.id,sha256:reference.sha256}):jsonResult({error:"not-found-or-empty"},400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
