import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {isValidCountry} from "@/server/members/location";
import {changeCountryLifecycle,inspectCountryLifecycle} from "@/server/countries/lifecycle";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
type Scope={params:Promise<{code:string}>};

export async function GET(req:NextRequest,{params}:Scope){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {code}=await params;
 if(!isValidCountry(code))return jsonResult({error:"invalid-input"},400);
 try{
  const impact=await withAuthDb(db=>inspectCountryLifecycle(db,code));
  if(!impact)return jsonResult({error:"not-found"},404);
  return jsonResult({impact});
 }catch{
  console.error("smn-country-lifecycle-inspection-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(req:NextRequest,{params}:Scope){
 const actor=await authorizeApi(req,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {code}=await params;
 if(!isValidCountry(code))return jsonResult({error:"invalid-input"},400);
 const body=await readJsonObject(req);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>changeCountryLifecycle(db,code,actor.id,body));
  if(!result.ok){
   const status=result.error==="invalid-input"?400:result.error==="not-found"?404:409;
   return jsonResult(result,status);
  }
  return jsonResult(result);
 }catch{
  console.error("smn-country-lifecycle-change-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
