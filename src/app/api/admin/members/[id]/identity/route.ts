import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyMemberApi} from "@/server/members/team-scope";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {saveMemberIdentity} from "@/server/members/identity";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const target={type:"members",exists:true,inScope:true} as const;
export async function PUT(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 const {id}=await params;
 try{
  const result=await withLegacyMemberApi(db=>saveMemberIdentity(db,id,actor.id,input));
  if(!result.ok)return jsonResult(result,
   result.error==="not-found"?404:
   ["conflict","archived","date-before-latest"].includes(result.error)?409:400);
  return jsonResult(result);
 }catch{
  console.error("smn-member-identity-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
