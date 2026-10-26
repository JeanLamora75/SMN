import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {readTeamAssignmentHistory} from "@/server/members/team-assignment-history";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;

export async function GET(request:NextRequest,
 {params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const query=request.nextUrl.searchParams;
 if(query.size!==1||query.getAll("teamId").length!==1)
  return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  return jsonResult(await withAuthDb(db=>readTeamAssignmentHistory(db,
   {accountId:actor.id,role:actor.role},id,query.get("teamId"))));
 }catch(error){
  if(error instanceof Error&&error.message==="team-assignment-history-invalid-input")
   return jsonResult({error:"invalid-input"},400);
  if(error instanceof Error&&[
   "member-out-of-team","team-context-unavailable","team-id-invalid",
   "team-access-forbidden"
  ].includes(error.message))return jsonResult({error:"not-found"},404);
  console.error("team-assignment-history-read-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
