import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {createQuickMembers,createIndividualMember,listTeamMembers} from "@/server/members/quick-create";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const target={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 if(!await authorizeApi(request,"read",target))
  return jsonResult({error:"forbidden"},403);
 try{
  return jsonResult(await withAuthDb(listTeamMembers));
 }catch{
  console.error("smn-members-read-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(request:NextRequest){
 const actor=await authorizeApi(request,"write",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const body=await readJsonObject(request);
 if(!body)return jsonResult({error:"invalid-input"},400);
 try{
  const individual=Object.hasOwn(body,"displayName");
  if(individual){
   const single=await withAuthDb(db=>createIndividualMember(db,actor.id,body));
   if(!single.ok)return jsonResult({error:single.error},
    single.error==="request-conflict"||single.error==="roster-full"?409:
    single.error==="team-unavailable"||single.error==="not-initialized"?404:400);
   return jsonResult({member:single.member,created:single.created},single.created?201:200);
  }
  const result=await withAuthDb(db=>createQuickMembers(db,actor.id,body));
  if(!result.ok)return jsonResult({error:result.error},
   result.error==="already-initialized"||result.error==="request-conflict"||
   result.error==="reference-country-archived"?409:
   result.error==="team-unavailable"?404:400);
  return jsonResult({members:result.members,created:result.created},result.created?201:200);
 }catch{
  console.error("smn-members-create-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
