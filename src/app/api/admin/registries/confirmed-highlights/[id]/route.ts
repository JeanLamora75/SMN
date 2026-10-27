import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {invalidateHighlight} from "@/server/registries/highlight-invalidation";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);
 if(!body||Object.keys(body).join(",")!=="reason"||typeof body.reason!=="string")return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const v=await withLegacyTeamApi(db=>invalidateHighlight(db,actor.id,id,body.reason as string));
 return jsonResult(v,v.ok?200:v.error==="not-found"?404:v.error==="conflict"?409:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
