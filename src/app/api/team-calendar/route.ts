import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {parseTeamCalendarQuery,readTeamCalendar} from "@/server/members/team-calendar";
import {projectCentralCalendar} from "@/server/members/central-calendar";
import {resolveAdminTeam} from "@/server/teams/resolve";

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
  const data=await withAuthDb(async db=>{
   const version=await db.query<{schema_version:number}>(
    "SELECT schema_version FROM public.smn_installation WHERE id='singleton' AND state='initialized'");
   const schema=version.rows[0]?.schema_version;
   if((schema===28||schema===29)){
    if(!admin)throw Error("team-calendar-forbidden");
    const authorized=await resolveAdminTeam(db,
     {accountId:actor.id,role:actor.role},parsed.teamId);
    return readTeamCalendar(db,parsed,true,{
     id:authorized.team_id,name:authorized.team,
     mode:authorized.mode as "scrum"|"kanban"
    });
   }
   if(typeof schema!=="number"||schema<1||schema>27)
    throw Error("team-calendar-schema-invalid");
   return readTeamCalendar(db,parsed,admin);
  });
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
