import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {indicatorTeams} from "@/server/indicators/team-access";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {withAuthDb} from "@/server/auth/database";
import {deleteCalendarMeeting} from "@/server/sprints/calendar-meeting-delete";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {updateCalendarMeetingSchedule} from "@/server/sprints/calendar-meeting-reschedule";
import {readCalendarMeeting,validCalendarMeetingRef} from "@/server/sprints/calendar-meeting-detail";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{kind:string;id:string}>};
const target={type:"collective",exists:true,inScope:true} as const;

export async function GET(request:NextRequest,{params}:Context){
 const actor=await authorizeApi(request,"read",target);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {kind,id}=await params;
 if(!validCalendarMeetingRef(kind,id))return jsonResult({error:"invalid-input"},400);
 const teamId=request.nextUrl.searchParams.get("teamId");
 if(teamId!==null&&!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(teamId))
  return jsonResult({error:"invalid-input"},400);
 try{
  const meeting=await withSprintIndexDb(async db=>{
   const result=await db.query<{schema_version:number}>(
    "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
   const version=result.rows[0]?.schema_version??0;
   if(version>=28){
    if(!teamId)return null;
    if(actor.role==="admin"){
     const team=await resolveAdminTeam(db,{accountId:actor.id,role:"admin"},teamId);
     if(team.mode!=="scrum")return null;
    }else if(version===33){
     const teams=await indicatorTeams(db,{accountId:actor.id,role:actor.role});
     if(!teams.some(team=>team.id===teamId))return null;
    }else return null;
   }
   return readCalendarMeeting(db,kind,id,version>=28?teamId:null);
  });
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
  const teamId=request.nextUrl.searchParams.get("teamId");
  const result=await withAuthDb(async db=>{
   const version=(await db.query<{schema_version:number}>(
    "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'"
   )).rows[0]?.schema_version??0;
   if(version>=28){
    if(!teamId||actor.role!=="admin")return {ok:false as const,error:"not-found" as const};
    const team=await resolveAdminTeam(db,{accountId:actor.id,role:"admin"},teamId);
    if(team.mode!=="scrum"||!await readCalendarMeeting(db,kind,id,team.team_id))
     return {ok:false as const,error:"not-found" as const};
   }
   return updateCalendarMeetingSchedule(db,actor.id,{
    kind,id,startAt:payload.startAt,endAt:payload.endAt,revision:payload.revision
   });
  });
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

/** Only the selected, authorized occurrence is deleted; bulk deletion is separate. */
export async function DELETE(request:NextRequest,{params}:Context){
 const actor=await authorizeApi(request,"write",{type:"settings",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 const {kind,id}=await params;
 if(!validCalendarMeetingRef(kind,id))return jsonResult({error:"invalid-input"},400);
 const teamId=request.nextUrl.searchParams.get("teamId");
 if(!teamId)return jsonResult({error:"invalid-input"},400);
 try{
  const result=await withAuthDb(async db=>{
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:"admin"},teamId);
   if(team.mode!=="scrum")return {ok:false as const,error:"not-found" as const};
   return deleteCalendarMeeting(db,team.team_id,kind,id);
  });
  return jsonResult(result,result.ok?200:result.error==="not-found"?404:
   ["closed-period","linked-data"].includes(result.error)?409:
   result.error==="incomplete-schema"?503:400);
 }catch{
  return jsonResult({error:"unavailable"},503);
 }
}
