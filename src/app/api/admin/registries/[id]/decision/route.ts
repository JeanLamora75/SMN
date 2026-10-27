import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {withLegacyRegistryReadDb} from "@/server/registries/legacy-read";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readDecisionDetail,saveDecisionDetail} from "@/server/registries/decision-detail";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const v=await withLegacyRegistryReadDb(db=>readDecisionDetail(db,id));return jsonResult(v??{error:"not-found"},v?200:404);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const v=await withLegacyTeamApi(db=>saveDecisionDetail(db,actor.id,id,body));
  return jsonResult(v,v.ok?200:v.error==="conflict"?409:v.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
