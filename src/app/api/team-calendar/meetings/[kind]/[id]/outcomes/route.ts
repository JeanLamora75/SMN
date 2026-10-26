import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {validCalendarMeetingRef} from "@/server/sprints/calendar-meeting-detail";
import {createMeetingOutcome,readMeetingOutcomes} from "@/server/sprints/calendar-meeting-outcomes";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{kind:string;id:string}>};
export async function GET(request:NextRequest,{params}:Context){
 if(!await authorizeApi(request,"read",{type:"collective",exists:true,inScope:true}))
  return jsonResult({error:"forbidden"},403);
 const {kind,id}=await params;
 if(!validCalendarMeetingRef(kind,id))return jsonResult({error:"invalid-input"},400);
 try{
  const outcomes=await withLegacyTeamApi(db=>readMeetingOutcomes(db,kind,id));
  return outcomes===null?jsonResult({error:"not-found"},404):jsonResult({outcomes});
 }catch{
  console.error("calendar-meeting-outcomes-read-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
export async function POST(request:NextRequest,{params}:Context){
 const actor=await authorizeApi(request,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {kind,id}=await params;
 if(!validCalendarMeetingRef(kind,id))return jsonResult({error:"invalid-input"},400);
 const raw=await readJsonObject(request,12000);
 if(!raw)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>createMeetingOutcome(db,actor.id,kind,id,raw));
  return jsonResult(result,result.ok?201:
   result.error==="not-found"?404:result.error==="closed-period"?409:400);
 }catch{
  console.error("calendar-meeting-outcome-create-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
