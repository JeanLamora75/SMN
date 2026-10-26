import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {renameCountry} from "@/server/countries/catalog";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;

export async function PATCH(req:NextRequest,{params}:{params:Promise<{code:string}>}){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {code}=await params;
 const payload=await readJsonObject(req);
 if(!payload)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>renameCountry(db,code,actor.id,payload));
  if(!result.ok){
   const status=result.error==="invalid-input"?400:
    result.error==="not-found"?404:409;
   return jsonResult({error:result.error},status);
  }
  return jsonResult(result);
 }catch{
  console.error("smn-country-rename-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
