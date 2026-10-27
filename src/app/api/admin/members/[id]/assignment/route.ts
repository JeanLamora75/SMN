import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withLegacyMemberApi} from "@/server/members/team-scope";
import {readMemberAssignment,saveMemberAssignment} from "@/server/members/assignment";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const resource={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 try{
  const state=await withLegacyMemberApi(db=>readMemberAssignment(db,id));
  return jsonResult(state);
 }catch(error){
  if(error instanceof Error&&["member-not-found","member-id-invalid"].includes(error.message))
   return jsonResult({error:"not-found"},404);
  console.error("smn-member-assignment-read-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyMemberApi(db=>saveMemberAssignment(db,id,actor.id,body));
  if(!result.ok)return jsonResult({error:result.error},
   ["conflict","already-assigned","date-before-latest"].includes(result.error)?409:
   ["not-found","team-unavailable"].includes(result.error)?404:400);
  return jsonResult(result,result.created?201:200);
 }catch{
  console.error("smn-member-assignment-write-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
