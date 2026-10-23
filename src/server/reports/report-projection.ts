import type {Client} from "pg";
import {projectScrum,type ScrumReportProjection,type ReportCycle} from "@/lib/report-data-contract";
export async function readScrumReportProjection(db:Client,input:{
 cycle:ReportCycle;status:string;objectives:ScrumReportProjection["scrum"]["objectives"];
}):Promise<ScrumReportProjection>{
 const id=input.cycle.id;
 const present=await db.query<{closed:boolean;points:boolean;capacity:boolean}>(`SELECT
 to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS closed,
 to_regclass('public.smn_sprint_story_points') IS NOT NULL AS points,
 to_regclass('public.smn_capacity_initial_snapshot') IS NOT NULL AS capacity`);
 const schema=present.rows[0];
 let committed:unknown=null,completed:unknown=null,planned:unknown=null,actual:unknown=null;
 let version:number|null=null,capturedAt:string|null=null;
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
  if(schema?.points){
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
