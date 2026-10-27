import type {Client} from "pg";
import {randomUUID} from "node:crypto";
import {listReportTemplates} from "./templates";
import {prepareSprintReport} from "./sprint-preparation";
import {emptyNotes} from "./draft-notes";
import {resolveAdminTeam} from "@/server/teams/resolve";
import {preserveAuthoritativeMetrics,type ReportDocument} from "./report-documents";

const uuid=/^[a-f0-9-]{36}$/i;
type Actor={accountId:string;role:"admin"|"user"};
type Result={ok:true;revision:number}|{ok:false;error:"invalid-input"|"not-found"|"stale"};

async function scopedDocument(db:Client,actor:Actor,teamId:string,cycleId:string,documentId:string,lock=false){
 if(!uuid.test(cycleId)||!uuid.test(documentId))return null;
 const team=await resolveAdminTeam(db,actor,teamId);
 if(team.mode!=="scrum")return null;
 const present=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_report_document') IS NOT NULL AS exists`);
 if(!present.rows[0]?.exists)return null;
 const result=await db.query<ReportDocument>(`SELECT d.id,d.sprint_id AS "sprintId",d.team_id AS "teamId",
 d.title,d.language,d.status,d.template_id AS "templateId",
 d.template_version AS "templateVersion",d.content,d.revision,
 d.updated_at::text AS "updatedAt"
 FROM public.smn_report_document d
 JOIN public.smn_sprint s ON s.id=d.sprint_id AND s.team_id=d.team_id
 JOIN public.smn_team t ON t.id=d.team_id
 WHERE d.id=$1 AND d.sprint_id=$2 AND d.team_id=$3
 AND t.installation_id='singleton' AND s.deleted_at IS NULL
 ${lock?"FOR UPDATE OF d":""}`,[documentId,cycleId,team.team_id]);
 return result.rows.length===1?result.rows[0]:null;
}

export async function readTeamStudioDocument(db:Client,actor:Actor,teamId:string,cycleId:string,documentId:string){
 return scopedDocument(db,actor,teamId,cycleId,documentId);
}

export async function saveTeamStudioDocument(db:Client,actor:Actor,teamId:string,cycleId:string,documentId:string,input:unknown):Promise<Result>{
 if(!input||typeof input!=="object"||Array.isArray(input))return {ok:false,error:"invalid-input"};
 const value=input as Record<string,unknown>;
 if(Object.keys(value).sort().join(",")!=="content,sequence,sessionId"||
 typeof value.sessionId!=="string"||!uuid.test(value.sessionId)||
 !Number.isSafeInteger(value.sequence)||Number(value.sequence)<1||
 !value.content||typeof value.content!=="object"||Array.isArray(value.content)||
 JSON.stringify(value.content).length>500000)
 return {ok:false,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const doc=await scopedDocument(db,actor,teamId,cycleId,documentId,true);
  if(!doc||doc.status!=="draft"){
   await db.query("ROLLBACK");return {ok:false,error:"not-found"};
  }
  const prior=await db.query<{last_sequence:number}>(`
   SELECT last_sequence FROM public.smn_report_document_session_write
   WHERE document_id=$1 AND session_id=$2`,[documentId,value.sessionId]);
  if(prior.rows[0]&&prior.rows[0].last_sequence>=Number(value.sequence)){
   await db.query("ROLLBACK");return {ok:false,error:"stale"};
  }
  const safe=preserveAuthoritativeMetrics(doc.content as Record<string,unknown>,value.content as Record<string,unknown>);
  const updated=await db.query<{revision:number}>(`
   UPDATE public.smn_report_document
   SET content=$5::jsonb,revision=revision+1,updated_by=$6,updated_at=now()
   WHERE id=$1 AND sprint_id=$2 AND team_id=$3 AND revision=$4
   RETURNING revision`,[documentId,cycleId,teamId,doc.revision,JSON.stringify(safe),actor.accountId]);
  if(updated.rows.length!==1){
   await db.query("ROLLBACK");return {ok:false,error:"stale"};
  }
  await db.query(`INSERT INTO public.smn_report_document_session_write
   (document_id,session_id,last_sequence) VALUES($1,$2,$3)
   ON CONFLICT(document_id,session_id)
   DO UPDATE SET last_sequence=EXCLUDED.last_sequence`,
   [documentId,value.sessionId,value.sequence]);
  await db.query("COMMIT");
  return {ok:true,revision:updated.rows[0].revision};
 }catch(e){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw e;
 }
}

/** Listing et création de brouillons uniquement dans le Sprint de l'équipe active. */
export async function listTeamStudioDocuments(db:Client,actor:Actor,teamId:string,cycleId:string){
 if(!uuid.test(cycleId))return null;
 const team=await resolveAdminTeam(db,actor,teamId);
 if(team.mode!=="scrum")return null;
 const cycle=await db.query<{id:string}>(`SELECT s.id FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id
 WHERE s.id=$1 AND s.team_id=$2 AND t.installation_id='singleton'
 AND s.deleted_at IS NULL`,[cycleId,team.team_id]);
 if(cycle.rows.length!==1)return null;
 const present=await db.query<{exists:boolean}>(`SELECT to_regclass('public.smn_report_document') IS NOT NULL AS exists`);
 if(!present.rows[0]?.exists)return [] as ReportDocument[];
 return (await db.query<ReportDocument>(`SELECT d.id,d.sprint_id AS "sprintId",
 d.team_id AS "teamId",d.title,d.language,d.status,
 d.template_id AS "templateId",d.template_version AS "templateVersion",
 d.content,d.revision,d.updated_at::text AS "updatedAt"
 FROM public.smn_report_document d
 WHERE d.sprint_id=$1 AND d.team_id=$2 ORDER BY d.updated_at DESC,d.id`,
 [cycleId,team.team_id])).rows;
}

export async function createTeamStudioDocument(db:Client,actor:Actor,teamId:string,cycleId:string,input:unknown){
 if(!uuid.test(cycleId)||!input||typeof input!=="object"||Array.isArray(input))
  return {ok:false as const,error:"invalid-input"};
 const v=input as Record<string,unknown>;
 if(Object.keys(v).filter(k=>k!=="requestId").sort().join(",")!=="language,templateId,title"||
 typeof v.title!=="string"||!v.title.trim()||v.title.trim().length>120||
 (v.language!=="fr"&&v.language!=="en")||
 typeof v.templateId!=="string"||!v.templateId||
 (v.requestId!==undefined&&(typeof v.requestId!=="string"||!uuid.test(v.requestId))))
  return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
  const team=await resolveAdminTeam(db,actor,teamId);
  if(team.mode!=="scrum"){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  const sprint=await db.query<{team_id:string}>(`SELECT s.team_id FROM public.smn_sprint s
   JOIN public.smn_team t ON t.id=s.team_id
   WHERE s.id=$1 AND s.team_id=$2 AND t.installation_id='singleton'
   AND s.deleted_at IS NULL FOR UPDATE OF s`,[cycleId,team.team_id]);
  if(sprint.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  const old=v.requestId?await db.query<{id:string;sprint_id:string;team_id:string}>(`
   SELECT id,sprint_id,team_id FROM public.smn_report_document
   WHERE creation_request_id=$1 FOR UPDATE`,[v.requestId]):null;
  if(old?.rows.length){
   const existing=old.rows[0];
   await db.query("ROLLBACK");
   return existing.sprint_id===cycleId&&existing.team_id===team.team_id?
    {ok:true as const,id:existing.id,revision:1,reused:true}:
    {ok:false as const,error:"conflict"};
  }
  const templates=await listReportTemplates(db);
  const template=templates.find(t=>t.id===v.templateId);
  if(!template){await db.query("ROLLBACK");return {ok:false as const,error:"template-not-found"};}
  const prepared=await prepareSprintReport(db,cycleId);
  if(!prepared){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  const id=randomUUID();
  const initial={
   sections:structuredClone(template.sections),options:structuredClone(template.content),
   notes:emptyNotes(),blocks:[],
   dataSource:{source:prepared.source,snapshotVersion:prepared.snapshotVersion},
   metrics:{committedSp:prepared.projection.scrum.storyPoints.committed,
    completedSp:prepared.projection.scrum.storyPoints.completed,
    plannedJh:prepared.projection.scrum.capacity.planned,
    actualJh:prepared.projection.scrum.capacity.actual},
   templateSnapshot:{id:template.id,revision:template.revision,
    sections:structuredClone(template.sections),content:structuredClone(template.content)}
  };
  await db.query(`INSERT INTO public.smn_report_document
   (id,sprint_id,team_id,title,language,template_id,template_version,
    content,created_by,updated_by,creation_request_id)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$9,$10)`,
   [id,cycleId,team.team_id,v.title.trim(),v.language,template.id,template.revision,
    JSON.stringify(initial),actor.accountId,v.requestId??null]);
  await db.query("COMMIT");return {ok:true as const,id,revision:1};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);throw error;
 }
}
