import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {readCalendarMeeting,validCalendarMeetingRef} from "@/server/sprints/calendar-meeting-detail";
import {MULTI_TEAM_CONTEXT_READY} from "@/lib/team-context-readiness";
export const runtime="nodejs";
export async function GET(request:NextRequest,{params}:{params:Promise<{kind:string;id:string}>}){
 const actor=await authorizeApi(request,"read",{type:"collective",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")return jsonResult({error:"forbidden"},403);
 if(!MULTI_TEAM_CONTEXT_READY)return jsonResult({error:"context-not-ready"},503);
 const {kind,id}=await params;
 if(!validCalendarMeetingRef(kind,id))return jsonResult({error:"invalid-input"},400);
 const query=request.nextUrl.searchParams;
 if(query.size!==1||query.getAll("teamId").length!==1||!query.get("teamId"))
  return jsonResult({error:"invalid-input"},400);
 try{
  const meeting=await withAuthDb(async db=>{
   const team=await resolveAdminTeam(db,{accountId:actor.id,role:"admin"},query.get("teamId"));
   if(team.mode!=="scrum")return null;
   return readCalendarMeeting(db,kind,id,team.team_id);
  });
  return meeting?jsonResult({meeting}):jsonResult({error:"not-found"},404);
 }catch{
  return jsonResult({error:"not-found"},404);
 }
}