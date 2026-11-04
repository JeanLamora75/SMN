import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {cancelLatestTeamAssignmentRevision} from "@/server/members/team-assignment-revision-cancel";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",{type:"members",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(request.nextUrl.searchParams.size)return jsonResult({error:"invalid-input"},400);
 const raw=await readJsonObject(request,4096);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withAuthDb(db=>cancelLatestTeamAssignmentRevision(db,
   {accountId:actor.id,role:"admin"},id,raw));
  return jsonResult(result,result.ok?200:result.error==="invalid-input"?400:
   result.error==="not-found"?404:409);
 }catch(error){
  if(error instanceof Error&&["team-access-forbidden","team-context-unavailable",
   "team-id-invalid","team-context-not-ready"].includes(error.message))
   return jsonResult({error:"not-found"},404);
  console.error("team-assignment-revision-cancel-unavailable",error);
  return jsonResult({error:"service-unavailable"},503);
 }
}
