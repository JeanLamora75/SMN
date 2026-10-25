import type {Client} from "pg";
import {getReportDocument} from "./report-documents";
import {prepareSprintReport} from "./sprint-preparation";

type Metric={value:number|null;unit:string;sourceId?:string|null};
type Content={metrics?:Record<string,Metric>;dataSource?:unknown;[key:string]:unknown};
const keys=["committedSp","completedSp","plannedJh","actualJh"] as const;
function project(prepared:NonNullable<Awaited<ReturnType<typeof prepareSprintReport>>>){
 const p=prepared.projection.scrum;
 return {committedSp:p.storyPoints.committed,completedSp:p.storyPoints.completed,plannedJh:p.capacity.planned,actualJh:p.capacity.actual};
}
export function compareReportMetrics(before:Record<string,Metric>,after:Record<string,Metric>){
 return keys.map(key=>({key,oldValue:before[key]?.value??null,newValue:after[key]?.value??null,
 unit:after[key]?.unit??before[key]?.unit??"",comparable:!!before[key]&&!!after[key]&&before[key].unit===after[key].unit,
 changed:before[key]?.value!==after[key]?.value||before[key]?.unit!==after[key]?.unit}));
}
export async function inspectReportData(db:Client,sprintId:string,documentId:string){
 const doc=await getReportDocument(db,sprintId,documentId);
 if(!doc)return null;
 const current=await prepareSprintReport(db,sprintId);
 if(!current)return null;
 const content=doc.content as Content;
 const incoming=project(current);
 return {comparison:compareReportMetrics(content.metrics??{},incoming),source:current.source,snapshotVersion:current.snapshotVersion};
}
export async function refreshOneReport(db:Client,actorId:string,sprintId:string,documentId:string){
 await db.query("BEGIN");
 try{
  const locked=await db.query<{content:Content}>(`SELECT d.content FROM public.smn_report_document d
   JOIN public.smn_sprint s ON s.id=d.sprint_id AND s.team_id=d.team_id
   JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE d.id=$1 AND d.sprint_id=$2 AND d.status='draft' AND s.deleted_at IS NULL
   AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum' FOR UPDATE OF d`,[documentId,sprintId]);
  if(!locked.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  const prepared=await prepareSprintReport(db,sprintId);
  if(!prepared){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  const original=locked.rows[0].content;
  const incoming=project(prepared);
  const comparison=compareReportMetrics(original.metrics??{},incoming);
  const next={...original,metrics:incoming,dataSource:{source:prepared.source,snapshotVersion:prepared.snapshotVersion}};
  await db.query(`UPDATE public.smn_report_document SET content=$3::jsonb,revision=revision+1,updated_by=$4,updated_at=now()
    WHERE id=$1 AND sprint_id=$2`,[documentId,sprintId,JSON.stringify(next),actorId]);
  await db.query("COMMIT");
  return {ok:true as const,comparison,hasChanged:comparison.some(x=>x.changed)};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
