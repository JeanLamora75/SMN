import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {assertLegacyTeamApi} from "@/server/teams/legacy";
import {parseSprintIndexQuery,readSprintIndex} from "@/server/sprints/index";

export const dynamic="force-dynamic";
export const runtime="nodejs";

const collective={type:"collective",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",collective))
  return jsonResult({error:"forbidden"},403);
 const options=parseSprintIndexQuery(request.nextUrl.searchParams);
 if(!options)return jsonResult({error:"invalid-input"},400);
 try{return jsonResult(await withSprintIndexDb(async db=>{await assertLegacyTeamApi(db);return readSprintIndex(db,options);}));}
 catch{
  console.error("sprint-index-read-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
