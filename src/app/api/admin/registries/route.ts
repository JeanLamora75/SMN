import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createRegistryItem} from "@/server/registries/items";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const target={type:"settings",exists:true,inScope:true} as const;
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>createRegistryItem(db,actor.id,raw));
  return jsonResult(result,result.ok?201:result.error==="not-found"?404:400);
 }catch(error){
  console.error("smn-registry-create-unavailable",error instanceof Error?error.name:"unknown");
  return jsonResult({error:"service-unavailable"},503);
 }
}
