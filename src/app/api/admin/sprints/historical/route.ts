import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createHistoricalSprint} from "@/server/sprints/historical-create";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 const actor=await authorizeApi(req,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const raw=await readJsonObject(req);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(db=>createHistoricalSprint(db,actor.id,raw,req.nextUrl.searchParams.get("teamId")));
  return jsonResult(result,result.ok?201:result.error==="invalid-input"?400:result.error==="team-unavailable"?404:409);
 }catch(error){
  if(error instanceof Error&&["team-context-unavailable","team-context-not-ready","team-id-invalid","team-access-forbidden"].includes(error.message))
   return jsonResult({error:"team-unavailable"},404);
  return jsonResult({error:"service-unavailable"},503);
 }
}
