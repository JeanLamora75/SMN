import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {standardReportTemplate} from "@/lib/report-templates";
import {listReportTemplates} from "./templates";
import {emptyNotes} from "./draft-notes";

const uuid=/^[a-f0-9-]{36}$/i;
export type ReportDocument={id:string;sprintId:string;teamId:string;title:string;language:"fr"|"en";status:"draft";templateId:string;templateVersion:number;content:unknown;revision:number;updatedAt:string};
const select=`SELECT id,sprint_id AS "sprintId",team_id AS "teamId",title,language,status,template_id AS "templateId",template_version AS "templateVersion",content,revision,updated_at::text AS "updatedAt" FROM public.smn_report_document`;
const ddl=`CREATE TABLE IF NOT EXISTS public.smn_report_document(
 id text PRIMARY KEY,
 sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
 language text NOT NULL CHECK(language IN ('fr','en')),
 status text NOT NULL DEFAULT 'draft' CHECK(status='draft'),
 template_id text NOT NULL,
 template_version integer NOT NULL CHECK(template_version>=0),
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object'),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),
 created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
)`;
export async function ensureReportDocumentsSchema(db:Client){
 await db.query(ddl);
 await db.query(`CREATE INDEX IF NOT EXISTS smn_report_document_sprint_idx ON public.smn_report_document(sprint_id,updated_at DESC)`);
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
 if(Object.keys(v).sort().join(",")!=="language,templateId,title"||
 typeof v.title!=="string"||!v.title.trim()||v.title.length>120||
 !["fr","en"].includes(String(v.language))||typeof v.templateId!=="string"||!v.templateId)
 return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const sprint=await scopedSprint(db,sprintId,true);
  if(!sprint){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  const template=(await listReportTemplates(db)).find(t=>t.id===v.templateId);
  if(!template){await db.query("ROLLBACK");return {ok:false as const,error:"template-not-found"};}
  await ensureReportDocumentsSchema(db);
  const id=randomUUID(),initial={
   sections:structuredClone(template.sections),options:structuredClone(template.content),
   notes:emptyNotes(),blocks:[],templateSnapshot:{id:template.id,revision:template.revision,
    sections:structuredClone(template.sections),content:structuredClone(template.content)}
  };
  await db.query(`INSERT INTO public.smn_report_document
  (id,sprint_id,team_id,title,language,template_id,template_version,content,created_by,updated_by)
  VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$9)`,
  [id,sprintId,sprint.team_id,v.title.trim(),v.language,template.id,template.revision,JSON.stringify(initial),actorId]);
  await db.query("COMMIT");return {ok:true as const,id,revision:1};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function updateReportDocument(db:Client,actorId:string,sprintId:string,id:string,input:unknown){
 if(!actorId||!uuid.test(sprintId)||!uuid.test(id)||!input||typeof input!=="object"||Array.isArray(input))
 return {ok:false as const,error:"invalid-input"};
 const v=input as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="content,revision"||
 !Number.isSafeInteger(v.revision)||Number(v.revision)<1||
 !v.content||typeof v.content!=="object"||Array.isArray(v.content)||
 JSON.stringify(v.content).length>500000)
 return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  if(!await scopedSprint(db,sprintId,true)){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  const updated=await db.query<{revision:number}>(`UPDATE public.smn_report_document
  SET content=$4::jsonb,revision=revision+1,updated_by=$5,updated_at=now()
  WHERE id=$1 AND sprint_id=$2 AND revision=$3 AND status='draft' RETURNING revision`,
  [id,sprintId,v.revision,JSON.stringify(v.content),actorId]);
  if(updated.rows.length){await db.query("COMMIT");return {ok:true as const,revision:updated.rows[0].revision};}
  const exists=await db.query(`SELECT id FROM public.smn_report_document WHERE id=$1 AND sprint_id=$2`,[id,sprintId]);
  await db.query("ROLLBACK");return {ok:false as const,error:exists.rows.length?"conflict":"not-found"};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
