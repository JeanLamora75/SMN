import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withLegacyTeamApi} from "@/server/teams/legacy";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {updateCalendarMeetingSchedule} from "@/server/sprints/calendar-meeting-reschedule";
import {readCalendarMeeting,validCalendarMeetingRef} from "@/server/sprints/calendar-meeting-detail";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{kind:string;id:string}>};
const target={type:"collective",exists:true,inScope:true} as const;

export async function GET(request:NextRequest,{params}:Context){
 if(!await authorizeApi(request,"read",target))return jsonResult({error:"forbidden"},403);
 const {kind,id}=await params;
 if(!validCalendarMeetingRef(kind,id))return jsonResult({error:"invalid-input"},400);
 try{
  const meeting=await withLegacyTeamApi(db=>readCalendarMeeting(db,kind,id));
  return meeting?jsonResult({meeting}):jsonResult({error:"not-found"},404);
 }catch{
  console.error("calendar-meeting-detail-read-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}

export async function PATCH(request:NextRequest,{params}:Context){
 const actor=await authorizeApi(request,"write",{type:"settings",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {kind,id}=await params;
 if(!validCalendarMeetingRef(kind,id))return jsonResult({error:"invalid-input"},400);
 const payload=await readJsonObject(request);
 if(!payload||typeof payload.startAt!=="string"||
  typeof payload.endAt!=="string"||typeof payload.revision!=="number"||
  Object.keys(payload).sort().join(",")!=="endAt,revision,startAt")
  return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withLegacyTeamApi(db=>updateCalendarMeetingSchedule(db,actor.id,{
   kind,id,startAt:payload.startAt,endAt:payload.endAt,revision:payload.revision
  }));
  if(result.ok)return jsonResult(result,200);
  const status=result.error==="not-found"?404:
   result.error==="conflict"||result.error==="closed-period"?409:
   result.error==="protected"?409:400;
  return jsonResult(result,status);
 }catch{
  console.error("calendar-meeting-schedule-update-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
