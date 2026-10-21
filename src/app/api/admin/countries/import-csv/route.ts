import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {executeHolidayCsv} from "@/server/holidays/csv-import";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const target={type:"settings",exists:true,inScope:true} as const;
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>executeHolidayCsv(db,body,actor.id));
  if(!result.ok)return jsonResult(result,
   result.error==="preview-expired"?409:
   result.error==="country-not-found"?404:
   result.error==="csv-too-large"?413:400);
  return jsonResult(result);
 }catch{
  console.error("smn-csv-national-holiday-import-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
