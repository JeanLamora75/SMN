import {NextRequest} from "next/server";
import {authorizeApi} from "@/server/auth/authorization";
import {withAuthDb} from "@/server/auth/database";
import {jsonResult} from "@/server/auth/request";
import {listKanbanCalendarMeetings,listScopedKanbanCalendarMeetings} from "@/server/kanban/meetings";
import {resolveAdminTeam} from "@/server/teams/resolve";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const resource={type:"collective",exists:true,inScope:true} as const;
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",resource);
 if(!actor)return jsonResult({error:"forbidden"},403);
 const params=request.nextUrl.searchParams;
 if([...params.keys()].some(k=>!["start","end","teamId"].includes(k))||
    params.getAll("teamId").length>1)return jsonResult({error:"invalid-input"},400);
 const start=request.nextUrl.searchParams.get("start"),end=request.nextUrl.searchParams.get("end");
 if(!start||!end||!/^(19|20|21)\d\d-\d\d-\d\d$/.test(start)||!/^(19|20|21)\d\d-\d\d-\d\d$/.test(end)||start>end)
  return jsonResult({error:"invalid-input"},400);
 try{
  return jsonResult(await withAuthDb(async db=>{
   const installation=await db.query<{mode:string;schema_version:number}>(
    "SELECT mode,schema_version FROM public.smn_installation "+
    "WHERE id='singleton' AND state='initialized'");
   const version=installation.rows[0]?.schema_version;
   let scopedTeamId:string|null=null;
   if(typeof version==="number"&&version>=28&&version<=31){
    if(actor.role!=="admin")throw Error("calendar-meetings-forbidden");
    const team=await resolveAdminTeam(db,
      {accountId:actor.id,role:actor.role},params.get("teamId"));
    scopedTeamId=team.team_id;
    if(team.mode==="kanban"){
     return {meetings:await listScopedKanbanCalendarMeetings(db,start,end,scopedTeamId)};
    }
   }else{
    if(typeof version!=="number"||version<1||version>27)
     throw Error("calendar-meetings-schema-invalid");
    if(installation.rows[0]?.mode==="kanban")
     return {meetings:await listKanbanCalendarMeetings(db,start,end)};
   }
   const result=await db.query<{id:string;name:string;start_at:string;end_at:string;kind:string;generation_source:string}>(`
    SELECT c.id,(s.name||' — '||c.kind) AS name,c.starts_at::text AS start_at,c.ends_at::text AS end_at,'ceremony' AS kind,c.generation_source AS generation_source
    FROM public.smn_sprint_ceremony c JOIN public.smn_sprint s ON s.id=c.sprint_id
    JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND s.deleted_at IS NULL
     AND ($3::text IS NULL OR s.team_id=$3)
     AND c.starts_at < ($2::date + INTERVAL '1 day') AND c.ends_at >= $1::date
    UNION ALL
    SELECT o.id,o.name,o.starts_at::text,o.ends_at::text,
           'template' AS kind,o.generation_source
    FROM public.smn_scrum_template_occurrence o
    JOIN public.smn_sprint s ON s.id=o.sprint_id
    JOIN public.smn_team t ON t.id=s.team_id
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND s.deleted_at IS NULL
     AND ($3::text IS NULL OR s.team_id=$3)
     AND o.starts_at < ($2::date + INTERVAL '1 day') AND o.ends_at >= $1::date
    UNION ALL
    SELECT m.id,m.name,m.starts_at::text,m.ends_at::text,'exceptional','standard'
    FROM public.smn_sprint_exceptional_meeting m JOIN public.smn_sprint s ON s.id=m.sprint_id
    JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE i.id='singleton' AND s.deleted_at IS NULL
     AND ($3::text IS NULL OR s.team_id=$3)
     AND m.starts_at < ($2::date + INTERVAL '1 day') AND m.ends_at >= $1::date
    ORDER BY start_at,id LIMIT 500`,[start,end,scopedTeamId]);
   return {meetings:result.rows.map(m=>({id:m.id,name:m.name,startAt:m.start_at,
    endAt:m.end_at,kind:m.kind,generationSource:m.generation_source,href:"/app/team-calendar/meeting/"+m.kind+"/"+encodeURIComponent(m.id)}))};
  }));
 }catch{
  console.error("team-calendar-meetings-read-failed");
  return jsonResult({error:"service-unavailable"},503);
 }
}
