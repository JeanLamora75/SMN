import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyMemberApi} from "@/server/members/team-scope";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readMemberLocation,saveMemberLocation} from "@/server/members/location";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 const query=new URL(request.url).searchParams;
 const onDate=query.get("onDate")??undefined;
 const at=query.get("at")??undefined;
 if((onDate&&at)||[...query.keys()].some(k=>!["onDate","at"].includes(k)))
  return jsonResult({error:"invalid-input"},400);
 try{
  return jsonResult(await withLegacyMemberApi(db=>readMemberLocation(db,id,onDate,at)));
 }catch(error){
  if(error instanceof Error&&error.message==="member-location-invalid-input")
   return jsonResult({error:"invalid-input"},400);
  if(error instanceof Error&&error.message==="member-not-found")
   return jsonResult({error:"not-found"},404);
  console.error("member-location-read-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const actor=await authorizeApi(request,"write",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 const input=await readJsonObject(request);
 if(!input)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyMemberApi(db=>saveMemberLocation(db,id,actor.id,input));
  if(!result.ok)return jsonResult({error:result.error},
   ["conflict","date-before-latest","archived"].includes(result.error)?409:
   result.error==="not-found"?404:400);
  return jsonResult(result,201);
 }catch{
  console.error("member-location-update-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
