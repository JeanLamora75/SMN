import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {listAbsenceCategories,saveAbsenceCategory} from "@/server/members/absence-categories";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))
  return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withAuthDb(listAbsenceCategories));}
 catch{
  console.error("smn-absence-categories-read-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(request:NextRequest){
 if(!await authorizeApi(request,"write",resource))
  return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>saveAbsenceCategory(db,body));
  if(!result.ok)return jsonResult({error:result.error},
   ["conflict","duplicate-name","catalogue-full"].includes(result.error)?409:
   result.error==="not-found"?404:400);
  return jsonResult(result,result.created?201:200);
 }catch{
  console.error("smn-absence-categories-write-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
