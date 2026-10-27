import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

type MeetingEntry=Readonly<{
 id:string;sprintId:string;source:"ceremony"|"template";
 name:string;status:string;startAt:string;endAt:string;revision:number;
}>;
export type ScopedCeremonies=Readonly<{
 teamId:string;sprintId:string;sprintStatus:string;
 items:readonly MeetingEntry[];
}>;

const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;

/** Liste v28 en lecture seule : aucune génération automatique, aucune DDL.
 * Les mutations de séries générées restent fermées avant la revue des
 * récurrences, segments et historiques.
 */
export async function readTeamCeremonies(db:Client,actor:TeamActor,
 teamId:string,sprintId:string):Promise<ScopedCeremonies>{
 if(typeof teamId!=="string"||!ID.test(teamId)||
    typeof sprintId!=="string"||!ID.test(sprintId))
  throw Error("team-ceremony-invalid-input");
 const team=await resolveAdminTeam(db,actor,teamId);
 if(team.mode!=="scrum")throw Error("team-ceremony-mode-invalid");
 const sprint=await db.query<{id:string;status:string}>(`
  SELECT s.id,s.status FROM public.smn_sprint s
  JOIN public.smn_team t ON t.id=s.team_id
  WHERE s.id=$1 AND s.team_id=$2 AND t.installation_id='singleton'
   AND s.deleted_at IS NULL LIMIT 2`,[sprintId,team.team_id]);
 if(sprint.rows.length!==1)throw Error("team-ceremony-sprint-not-found");
 const required=["smn_sprint_ceremony","smn_scrum_template_occurrence"];
 const available=await db.query<{name:string|null}>(`
  SELECT to_regclass('public.'||n.name)::text AS name
  FROM unnest($1::text[]) n(name)`,[required]);
 if(available.rows.length!==2||available.rows.some(x=>!x.name))
  throw Error("team-ceremony-storage-not-ready");
 const result=await db.query<{
  id:string;source:"ceremony"|"template";name:string;status:string;
  start_at:string;end_at:string;revision:number
 }>(`
  SELECT c.id,'ceremony'::text AS source,c.kind AS name,
   c.occurrence_status AS status,
   c.starts_at::text AS start_at,c.ends_at::text AS end_at,
   c.revision AS revision
  FROM public.smn_sprint_ceremony c
  JOIN public.smn_sprint s ON s.id=c.sprint_id
  WHERE c.sprint_id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
  UNION ALL
  SELECT o.id,'template'::text AS source,o.name,o.status,
   o.starts_at::text,o.ends_at::text,1::integer AS revision
  FROM public.smn_scrum_template_occurrence o
  JOIN public.smn_sprint s ON s.id=o.sprint_id
  WHERE o.sprint_id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
  ORDER BY start_at,id LIMIT 501`,[sprintId,team.team_id]);
 if(result.rows.length>500)throw Error("team-ceremony-list-limit");
 return {
  teamId:team.team_id,sprintId,sprintStatus:sprint.rows[0].status,
  items:result.rows.map(row=>({
   id:row.id,sprintId,source:row.source,name:row.name,status:row.status,
   startAt:row.start_at,endAt:row.end_at,revision:row.revision
  }))
 };
}
