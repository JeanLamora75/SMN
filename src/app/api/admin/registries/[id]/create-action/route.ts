import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createActionFromDecision} from "@/server/registries/decision-actions";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req);if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{const r=await withLegacyTeamApi(db=>createActionFromDecision(db,actor.id,id,body));
 return jsonResult(r,r.ok?201:r.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
