import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createCountry,listCountries} from "@/server/countries/catalog";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function GET(req:NextRequest){
 if(!await authorizeApi(req,"read",target))return jsonResult({error:"forbidden"},403);
 try{return jsonResult({countries:await withAuthDb(listCountries)});}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const payload=await readJsonObject(req);
 if(!payload)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>createCountry(db,actor.id,payload));
  if(!result.ok)return jsonResult({error:result.error},result.error==="duplicate-code"?409:400);
  return jsonResult(result,201);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
