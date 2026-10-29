import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {standardReportTemplate} from "@/lib/report-templates";
import {listReportTemplates} from "./templates";
import {emptyNotes} from "./draft-notes";
import {prepareSprintReport} from "./sprint-preparation";

const uuid=/^[a-f0-9-]{36}$/i;
export type ReportDocument={id:string;sprintId:string;teamId:string;title:string;language:"fr"|"en";status:"draft";templateId:string;templateVersion:number;content:unknown;revision:number;updatedAt:string};
const select=`SELECT id,sprint_id AS "sprintId",team_id AS "teamId",title,language,status,template_id AS "templateId",template_version AS "templateVersion",content,revision,updated_at::text AS "updatedAt" FROM public.smn_report_document`;
export async function ensureReportDocumentsSchema(db:Client){
 await db.query("SELECT to_regclass('public.smn_report_document') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
 await db.query("SELECT to_regclass('public.smn_report_document_sprint_idx') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
 await db.query("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_report_document' AND column_name='creation_request_id'").then(r=>{if(!r.rows.length)throw Error("report-schema-not-ready: apply-report-schema-v32")});
 await db.query("SELECT to_regclass('public.smn_report_document_session_write') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
 await db.query("SELECT to_regclass('public.smn_report_document_create_request_idx') AS present").then(r=>{if(!r.rows[0]?.present)throw Error("report-schema-not-ready: apply-report-schema-v32")});
}
async function scopedSprint(db:Client,sprintId:string,lock=false){
 const r=await db.query<{team_id:string}>(`SELECT s.team_id FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
 AND lower(i.mode)='scrum'${lock?" FOR UPDATE OF s":""}`,[sprintId]);
 return r.rows[0]??null;
}
export async function listReportDocuments(db:Client,sprintId:string){
 if(!uuid.test(sprintId)||!await scopedSprint(db,sprintId))return null;
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_document') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return [] as ReportDocument[];
 return (await db.query<ReportDocument>(`${select} WHERE sprint_id=$1 ORDER BY updated_at DESC,id`,[sprintId])).rows;
}
export async function getReportDocument(db:Client,sprintId:string,id:string){
 if(!uuid.test(id)||!uuid.test(sprintId)||!await scopedSprint(db,sprintId))return null;
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_document') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return null;
 return (await db.query<ReportDocument>(`${select} WHERE id=$1 AND sprint_id=$2`,[id,sprintId])).rows[0]??null;
}
export async function createReportDocument(db:Client,actorId:string,sprintId:string,input:unknown){
 if(!actorId||!uuid.test(sprintId)||!input||typeof input!=="object"||Array.isArray(input))return {ok:false as const,error:"invalid-input"};
 const v=input as Record<string,unknown>;
 if(Object.keys(v).filter(k=>k!=="requestId").sort().join(",")!=="language,templateId,title"||
 (v.requestId!==undefined&&(typeof v.requestId!=="string"||!uuid.test(v.requestId)))||
 typeof v.title!=="string"||!v.title.trim()||v.title.length>120||
 !["fr","en"].includes(String(v.language))||typeof v.templateId!=="string"||!v.templateId)
 return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const sprint=await scopedSprint(db,sprintId,true);
  if(!sprint){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await ensureReportDocumentsSchema(db);
  if(v.requestId){const old=await db.query<{id:string;sprint_id:string}>(`SELECT id,sprint_id FROM public.smn_report_document WHERE creation_request_id=$1`,[v.requestId]);
   if(old.rows.length){await db.query("ROLLBACK");return old.rows[0].sprint_id===sprintId?{ok:true as const,id:old.rows[0].id,revision:1,reused:true}:{ok:false as const,error:"conflict"};}}
  const template=(await listReportTemplates(db)).find(t=>t.id===v.templateId);
  if(!template){await db.query("ROLLBACK");return {ok:false as const,error:"template-not-found"};}
  const prepared=await prepareSprintReport(db,sprintId);
  if(!prepared){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  const id=randomUUID(),initial={
   sections:structuredClone(template.sections),options:structuredClone(template.content),
   notes:emptyNotes(),blocks:[],dataSource:{source:prepared.source,snapshotVersion:prepared.snapshotVersion},
   metrics:{committedSp:prepared.projection.scrum.storyPoints.committed,completedSp:prepared.projection.scrum.storyPoints.completed,
    plannedJh:prepared.projection.scrum.capacity.planned,actualJh:prepared.projection.scrum.capacity.actual},
   templateSnapshot:{id:template.id,revision:template.revision,
    sections:structuredClone(template.sections),content:structuredClone(template.content)}
  };
  await db.query(`INSERT INTO public.smn_report_document
  (id,sprint_id,team_id,title,language,template_id,template_version,content,created_by,updated_by,creation_request_id)
  VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$9,$10)`,
  [id,sprintId,sprint.team_id,v.title.trim(),v.language,template.id,template.revision,JSON.stringify(initial),actorId,v.requestId??null]);
  await db.query("COMMIT");return {ok:true as const,id,revision:1};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function updateReportDocument(db:Client,actorId:string,sprintId:string,id:string,input:unknown){
 if(!actorId||!uuid.test(sprintId)||!uuid.test(id)||!input||typeof input!=="object"||Array.isArray(input))
 return {ok:false as const,error:"invalid-input"};
 const v=input as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="content,sequence,sessionId"||
 typeof v.sessionId!=="string"||!uuid.test(v.sessionId)||
 !Number.isSafeInteger(v.sequence)||Number(v.sequence)<1||
 !v.content||typeof v.content!=="object"||Array.isArray(v.content)||
 JSON.stringify(v.content).length>500000)
 return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  if(!await scopedSprint(db,sprintId,true)){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  await ensureReportDocumentsSchema(db);
  const document=await db.query<{id:string;content:Record<string,unknown>}>(`SELECT id,content FROM public.smn_report_document WHERE id=$1 AND sprint_id=$2 AND status='draft' FOR UPDATE`,[id,sprintId]);
  if(!document.rows.length){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  const prior=await db.query<{last_sequence:number}>(`SELECT last_sequence FROM public.smn_report_document_session_write WHERE document_id=$1 AND session_id=$2`,[id,v.sessionId]);
  if(prior.rows[0]&&Number(prior.rows[0].last_sequence)>=Number(v.sequence)){
   await db.query("ROLLBACK");return {ok:false as const,error:"stale"};
  }
  const safeContent=preserveAuthoritativeMetrics(document.rows[0].content,v.content as Record<string,unknown>);
  const updated=await db.query<{revision:number}>(`UPDATE public.smn_report_document SET content=$3::jsonb,revision=revision+1,updated_by=$4,updated_at=now() WHERE id=$1 AND sprint_id=$2 RETURNING revision`,
   [id,sprintId,JSON.stringify(safeContent),actorId]);
  await db.query(`INSERT INTO public.smn_report_document_session_write(document_id,session_id,last_sequence) VALUES($1,$2,$3) ON CONFLICT(document_id,session_id) DO UPDATE SET last_sequence=EXCLUDED.last_sequence`,[id,v.sessionId,v.sequence]);
  await db.query("COMMIT");return {ok:true as const,revision:updated.rows[0].revision};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}

/** Metric snapshots are refreshed only by the explicit data-refresh endpoint. */
export function preserveAuthoritativeMetrics<T extends Record<string,unknown>>(
 stored:Record<string,unknown>,incoming:T){
 return {...incoming,metrics:stored.metrics,dataSource:stored.dataSource};
}
