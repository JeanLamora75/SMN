import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult,readJsonObject} from "@/server/auth/request";
import {withSprintIndexDb} from "@/server/sprints/read-only-db";
import {withAuthDb} from "@/server/auth/database";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {indicatorTeams} from "@/server/indicators/team-access";
import {validCalendarMeetingRef,readCalendarMeeting} from "@/server/sprints/calendar-meeting-detail";
import {createMeetingOutcome,readMeetingOutcomes} from "@/server/sprints/calendar-meeting-outcomes";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{kind:string;id:string}>};
export async function GET(request:NextRequest,{params}:Context){
 const actor=await authorizeApi(request,"read",{type:"collective",exists:true,inScope:true});
 if(!actor)return jsonResult({error:"forbidden"},403);
 const {kind,id}=await params;
 if(!validCalendarMeetingRef(kind,id))return jsonResult({error:"invalid-input"},400);
 try{
  const teamId=request.nextUrl.searchParams.get("teamId");
  const outcomes=await withSprintIndexDb(async db=>{
   const version=(await db.query<{schema_version:number}>(
    "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'"
   )).rows[0]?.schema_version??0;
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
   if(!await readCalendarMeeting(db,kind,id,version>=28?teamId:null))return null;
   return readMeetingOutcomes(db,kind,id);
  });
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
   return createMeetingOutcome(db,actor.id,kind,id,raw);
  });
  return jsonResult(result,result.ok?201:
   result.error==="not-found"?404:result.error==="closed-period"?409:400);
 }catch{
  console.error("calendar-meeting-outcome-create-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
