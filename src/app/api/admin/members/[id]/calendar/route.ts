import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyMemberApi} from "@/server/members/team-scope";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {readMemberCalendar,saveMemberCalendar} from "@/server/members/calendar";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"members",exists:true,inScope:true} as const;
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await authorizeApi(request,"read",resource))return jsonResult({error:"forbidden"},403);
 const {id}=await params;
 const onDate=new URL(request.url).searchParams.get("onDate")??undefined;
 try{
  return jsonResult(await withLegacyMemberApi(db=>readMemberCalendar(db,id,onDate)));
 }catch(error){
  if(error instanceof Error&&error.message==="member-calendar-invalid-input")
   return jsonResult({error:"invalid-input"},400);
  if(error instanceof Error&&error.message==="member-not-found")
   return jsonResult({error:"not-found"},404);
  console.error("member-calendar-read-unavailable");
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
  const result=await withLegacyMemberApi(db=>saveMemberCalendar(db,id,actor.id,body));
  if(!result.ok)return jsonResult({error:result.error},
   ["conflict","archived","date-before-latest","weekly-missing"].includes(result.error)?409:
   result.error==="not-found"?404:400);
  return jsonResult(result,201);
 }catch{
  console.error("member-calendar-write-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
