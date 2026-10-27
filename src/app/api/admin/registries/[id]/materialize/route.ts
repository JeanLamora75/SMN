import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {withLegacyRegistryReadDb} from "@/server/registries/legacy-read";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createObstacleFromRisk} from "@/server/registries/risk-materialization";
import {readRegistryItem} from "@/server/registries/items";
export const dynamic="force-dynamic";export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const item=await withLegacyRegistryReadDb(db=>readRegistryItem(db,id));
  return jsonResult(item?.type==="risk"?{id:item.id,title:item.title,description:item.description,teamId:item.teamId}:{error:"not-found"},item?.type==="risk"?200:404);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const r=await withLegacyTeamApi(db=>createObstacleFromRisk(db,actor.id,id,raw));
  return jsonResult(r,r.ok?201:r.error==="not-found"?404:400);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
