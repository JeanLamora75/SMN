import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {parseTeamCalendarQuery,readTeamCalendar} from "@/server/members/team-calendar";
import {projectCentralCalendar} from "@/server/members/central-calendar";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const resource={type:"collective",exists:true,inScope:true} as const;

export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const admin=actor.role==="admin";
 const parsed=parseTeamCalendarQuery(request.nextUrl.searchParams,admin);
 if(!parsed)return jsonResult({error:"invalid-input"},400);
 try{
  const data=await withAuthDb(db=>readTeamCalendar(db,parsed,admin));
  return jsonResult({...data,central:projectCentralCalendar(data,admin)});
 }catch(error){
  if(error instanceof Error&&error.message==="team-calendar-not-found")
   return jsonResult({error:"not-found"},404);
  if(error instanceof Error&&error.message==="team-calendar-invalid-input")
   return jsonResult({error:"invalid-input"},400);
  console.error("smn-team-calendar-read-unavailable");
  return jsonResult({error:"service-unavailable"},503);
 }
}
