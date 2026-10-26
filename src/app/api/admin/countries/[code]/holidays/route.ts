import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {changeManualHoliday} from "@/server/holidays/manual";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;

/**
 * One endpoint covers create, date/name correction, and removal.
 * The operation is authorized by the server, never by UI visibility.
 */
export async function POST(request:NextRequest,{params}:{params:Promise<{code:string}>}){
 const actor=await authorizeApi(request,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {code}=await params;
 const body=await readJsonObject(request,4096);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>changeManualHoliday(db,code,actor.id,body));
  if(!result.ok){
   const status=result.error==="invalid-input"?400:
    result.error==="country-not-found"||result.error==="not-found"?404:409;
   return jsonResult({error:result.error},status);
  }
  return jsonResult(result);
 }catch{
  console.error("smn-manual-holiday-change-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
