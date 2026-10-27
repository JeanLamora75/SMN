import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {withLegacyRegistryReadDb} from "@/server/registries/legacy-read";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readLinks,changeCycleLink} from "@/server/registries/cycle-links";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const v=await withLegacyRegistryReadDb(db=>readLinks(db,id));return jsonResult(v??{error:"not-found"},v?200:404);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body||Object.keys(body).sort().join(",")!=="action,cycleId"||
  typeof body.cycleId!=="string"||(body.action!=="linked"&&body.action!=="unlinked"))
  return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const v=await withLegacyTeamApi(db=>changeCycleLink(db,actor.id,id,body.cycleId as string,body.action as "linked"|"unlinked"));
  return jsonResult(v,v.ok?200:v.error==="conflict"?409:v.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
