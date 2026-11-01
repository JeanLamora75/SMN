import type {Client} from "pg";
import {projectScrum,type ScrumReportProjection,type ReportCycle} from "@/lib/report-data-contract";
export async function readScrumReportProjection(db:Client,input:{
 cycle:ReportCycle;status:string;objectives:ScrumReportProjection["scrum"]["objectives"];
}):Promise<ScrumReportProjection>{
 const id=input.cycle.id;
 const state=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id=\'singleton\' AND state=\'initialized\'");
 const v33=state.rows[0]?.schema_version===33;
 const present=await db.query<{closed:boolean;points:boolean;capacity:boolean}>(`SELECT
 to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS closed,
 to_regclass('public.smn_sprint_story_points') IS NOT NULL AS points,
 to_regclass('public.smn_capacity_initial_snapshot') IS NOT NULL AS capacity`);
 const schema=present.rows[0];
 let committed:unknown=null,completed:unknown=null,planned:unknown=null,actual:unknown=null;
 let version:number|null=null,capturedAt:string|null=null;
 if(v33&&input.status!=="closed"){
  // Live v33 values are resolved by stable business tags, independently of display preferences.
  // A missing value remains null; it must never be replaced with zero.
  const scope=await db.query<{team_id:string}>(`
   SELECT s.team_id FROM public.smn_sprint s
   JOIN public.smn_team t ON t.id=s.team_id
   WHERE s.id=$1 AND s.deleted_at IS NULL AND t.agile_mode='scrum'
   AND t.installation_id='singleton' AND NOT t.is_archived`,[id]);
  const teamId=scope.rows[0]?.team_id;
  if(teamId){
   const values=await db.query<{tag:string;value:string|null}>(`
    SELECT d.tag,CASE
     WHEN d.indicator_type='manual' THEN m.value::text
     WHEN r.result_state='available' THEN r.value::text
     ELSE NULL END AS value
    FROM public.smn_indicator_definition d
    JOIN public.smn_indicator_team_selection sel
     ON sel.indicator_id=d.id AND sel.team_id=$1 AND sel.is_active=true
    LEFT JOIN public.smn_indicator_manual_value m
     ON m.indicator_id=d.id AND m.team_id=$1 AND m.cycle_type='scrum' AND m.cycle_id=$2
    LEFT JOIN public.smn_indicator_computed_result r
     ON r.indicator_id=d.id AND r.team_id=$1 AND r.cycle_type='scrum' AND r.cycle_id=$2
    WHERE d.archived_at IS NULL AND d.tag=ANY($3::text[])`,
    [teamId,id,["F01","F06"]]);
   const byTag=new Map(values.rows.map(x=>[x.tag,x.value]));
   committed=byTag.get("F01")??null;
   completed=byTag.get("F06")??null;
  }
 }
 if(input.status==="closed"){
  if(schema?.closed){
   const r=await db.query<{version:number;closedAt:string;snapshot:Record<string,unknown>}>(`
    SELECT version,closed_at::text AS "closedAt",snapshot FROM public.smn_sprint_closure_snapshot
    WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1`,[id]);
   const snap=r.rows[0]?.snapshot;
   if(snap){version=r.rows[0].version;capturedAt=r.rows[0].closedAt;
    const sp=snap.storyPoints as Record<string,unknown>|null|undefined;
    const cap=snap.capacity as Record<string,unknown>|null|undefined;
    committed=sp?.initial_sp;completed=sp?.done_sp;planned=cap?.initial_jh;actual=cap?.actual_jh;
   }
  }
 }else{
  if(!v33&&schema?.points){
   const r=await db.query<{initial_sp:string|null;done_sp:string|null}>(`SELECT initial_sp::text,done_sp::text
    FROM public.smn_sprint_story_points WHERE sprint_id=$1`,[id]);
   committed=r.rows[0]?.initial_sp;completed=r.rows[0]?.done_sp;
  }
  // Current capacity is not populated until a verified period-specific adapter exists.
 }
 return projectScrum({cycle:input.cycle,provenance:{
  source:input.status==="closed"?"closure-snapshot":"current",snapshotVersion:version,capturedAt
 },committedSp:committed,completedSp:completed,plannedJh:planned,actualJh:actual,objectives:input.objectives});
}
