import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {correctHistoricalTeamAssignment} from "@/server/members/team-assignment-historical-correction";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(req,"write",{type:"members",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(req.nextUrl.searchParams.size)return jsonResult({error:"invalid-input"},400);
 const raw=await readJsonObject(req,4096);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withAuthDb(db=>correctHistoricalTeamAssignment(db,
   {accountId:actor.id,role:"admin"},id,raw));
  return jsonResult(result,result.ok?200:result.error==="invalid-input"?400:
   result.error==="not-found"||result.error==="outside-assignment"?404:409);
 }catch(error){
  if(error instanceof Error&&["team-access-forbidden","team-context-unavailable",
   "team-id-invalid","team-context-not-ready"].includes(error.message))
   return jsonResult({error:"not-found"},404);
  console.error("team-member-historical-assignment-correction-unavailable",error);
  if((error as {code?:unknown})?.code==="23505")
   return jsonResult({error:"conflict"},409);
  return jsonResult({error:"service-unavailable"},503);
 }
}
