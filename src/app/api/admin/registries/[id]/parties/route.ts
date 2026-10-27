import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {withLegacyRegistryReadDb} from "@/server/registries/legacy-read";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readParties,writeParties} from "@/server/registries/dependency-parties";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const r=await withLegacyRegistryReadDb(db=>readParties(db,id));return jsonResult(r??{error:"not-found"},r?200:404);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const r=await withLegacyTeamApi(db=>writeParties(db,actor.id,id,body));
  return jsonResult(r,r.ok?200:r.error==="conflict"?409:r.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
