import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {withLegacyRegistryReadDb} from "@/server/registries/legacy-read";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readRegistryComments,createRegistryComment} from "@/server/registries/comments";

export const dynamic="force-dynamic";
export const runtime="nodejs";

export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const result=await withLegacyRegistryReadDb(db=>readRegistryComments(db,id,actor.role==="admin"));
  return jsonResult(result??{error:"not-found"},result?200:404);
 }catch{
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(req,16384);
 if(!body)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withLegacyTeamApi(db=>createRegistryComment(db,actor.id,id,body));
  return jsonResult(result,result.ok?201:result.error==="not-found"?404:400);
 }catch{
  return jsonResult({error:"service-unavailable"},503);
 }
}
