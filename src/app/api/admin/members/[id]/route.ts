import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withLegacyMemberApi} from "@/server/members/team-scope";
import {updateMemberProfile} from "@/server/members/profile";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyMemberApi(db=>updateMemberProfile(db,id,input));
  if(!result.ok){
   const status=result.error==="invalid-input"?400:result.error==="not-found"?404:409;
   return jsonResult({error:result.error},status);
  }
  return jsonResult(result);
 }catch{
  console.error("smn-member-profile-update-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
