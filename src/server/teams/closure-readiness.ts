import type {Client} from "pg";
import {resolveAdminTeam,type TeamActor} from "@/server/teams/resolve";

const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
export type TeamClosureReadiness=Readonly<{
 teamId:string;cycleId:string;mode:"scrum"|"kanban";
 status:string;ended:boolean;stateEligible:boolean;
 missingTables:readonly string[];snapshotPipelineQualified:false;
 canClose:false;
}>;
const dependencies={
 scrum:["smn_sprint_closure_snapshot","smn_sprint_closure_audit",
  "smn_sprint_goal","smn_sprint_story_points",
  "smn_sprint_ceremony","smn_scrum_template_occurrence",
  "smn_sprint_exceptional_meeting","smn_sprint_capacity_kpi"],
 kanban:["smn_kanban_closure","smn_kanban_goal",
  "smn_kanban_flow_counts","smn_kanban_timing",
  "smn_kanban_meeting","smn_kanban_capacity_opening"]
} as const;

/** Précontrôle de clôture v28, sans DDL ni mutation.
 * Ne prétend pas que le pipeline de snapshots est déjà qualifié :
 * aucune clôture n'est autorisée par ce contrat avant les tests end-to-end.
 */
export async function readTeamClosureReadiness(db:Client,actor:TeamActor,
 teamId:string,cycleId:string):Promise<TeamClosureReadiness>{
 if(typeof teamId!=="string"||!ID.test(teamId)||
    typeof cycleId!=="string"||!ID.test(cycleId))
  throw Error("period-readiness-invalid-input");
 const team=await resolveAdminTeam(db,actor,teamId);
 const mode=team.mode as "scrum"|"kanban";
 const result=mode==="scrum"?
  await db.query<{status:string;ended:boolean}>(`
   SELECT s.status,(s.end_at<=now()) AS ended
   FROM public.smn_sprint s
   JOIN public.smn_team t ON t.id=s.team_id
   WHERE s.id=$1 AND s.team_id=$2 AND t.installation_id='singleton'
    AND s.deleted_at IS NULL LIMIT 2`,[cycleId,team.team_id]):
  await db.query<{status:string;ended:boolean}>(`
   SELECT p.status,
    (p.end_on<(now() AT TIME ZONE p.time_zone)::date) AS ended
   FROM public.smn_kanban_period p
   JOIN public.smn_team t ON t.id=p.team_id
   WHERE p.id=$1 AND p.team_id=$2 AND t.installation_id='singleton'
    AND p.deleted_at IS NULL LIMIT 2`,[cycleId,team.team_id]);
 if(result.rows.length!==1)throw Error("period-readiness-not-found");
 const needed=[...dependencies[mode]];
 const available=await db.query<{name:string;exists:boolean}>(`
  SELECT x.name,to_regclass('public.'||x.name) IS NOT NULL AS exists
  FROM unnest($1::text[]) AS x(name)`,[needed]);
 const found=new Map(available.rows.map(r=>[r.name,r.exists]));
 const row=result.rows[0];
 return {
  teamId:team.team_id,cycleId,mode,status:row.status,ended:row.ended,
  stateEligible:row.status==="finished"&&row.ended,
  missingTables:needed.filter(name=>found.get(name)!==true),
  snapshotPipelineQualified:false,canClose:false
 };
}
