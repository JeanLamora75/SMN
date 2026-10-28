import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createCompany,listCompanies} from "@/server/companies/catalog";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"companies",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 try{return jsonResult({companies:await withAuthDb(listCompanies)});}
 catch{return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>createCompany(db,actor.id,body));
  if(!result.ok)return jsonResult({error:result.error},result.error==="duplicate-name"?409:400);
  return jsonResult(result,201);
 }catch{return jsonResult({error:"service-unavailable"},503);}
}
