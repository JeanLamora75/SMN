import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {withLegacyRegistryReadDb} from "@/server/registries/legacy-read";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readActionLinks,changeActionLink} from "@/server/registries/action-links";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true}))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{const x=await withLegacyRegistryReadDb(db=>readActionLinks(db,id));return jsonResult(x??{error:"not-found"},x?200:404);}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const b=await readJsonObject(req);
 if(!b||Object.keys(b).sort().join(",")!=="action,relatedId"||typeof b.relatedId!=="string"||(b.action!=="linked"&&b.action!=="unlinked"))return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const x=await withLegacyTeamApi(db=>changeActionLink(db,actor.id,id,b.relatedId as string,b.action as "linked"|"unlinked"));
  return jsonResult(x,x.ok?200:x.error==="conflict"?409:x.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
