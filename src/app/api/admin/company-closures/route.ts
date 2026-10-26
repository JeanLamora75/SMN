import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {listCompanyClosures,saveCompanyClosure} from "@/server/closures/service";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"settings",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 try{return jsonResult(await withLegacyTeamApi(listCompanyClosures));}
 catch{console.error("company-closure-read-unavailable");return jsonResult({error:"service-unavailable"},503);}
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>saveCompanyClosure(db,actor.id,body));
  if(!result.ok)return jsonResult({error:result.error},
   result.error==="team-not-found"||result.error==="not-found"?404:
   result.error==="conflict"||result.error==="overlap"?409:400);
  return jsonResult(result,result.created?201:200);
 }catch{console.error("company-closure-write-unavailable");return jsonResult({error:"service-unavailable"},503);}
}
