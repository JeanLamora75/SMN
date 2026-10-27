import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyRegistryReadDb} from "@/server/registries/legacy-read";
import {jsonResult} from "@/server/auth/request";
import {parseRelationSearch,readRelationCandidates} from "@/server/registries/relation-candidates";

export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const filter=parseRelationSearch(req.nextUrl.searchParams);
 if(!filter)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const data=await withLegacyRegistryReadDb(db=>readRelationCandidates(db,id,filter));
  if(!data)return jsonResult({error:"not-found"},404);
  if(data.state==="unavailable")return jsonResult({error:"service-unavailable"},503);
  return jsonResult(data,200);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
