import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {
 cleanReviewBody,emptyReview,parseReviewEntry,validReviewKind,
 type ReviewEntry,type ReviewKind,type ReviewProjection
} from "@/lib/sprint-review-analysis";

/** DDL only on explicit admin mutation or the authorized closure workflow. */
export async function ensureSprintReviewSchema(db:Client):Promise<void>{
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_review_analysis(
  sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK(kind IN ('manual','ai')),
  body text CHECK(body IS NULL OR length(body)<=3000),
  revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
  origin text NOT NULL DEFAULT 'human'
   CHECK(origin IN ('human','ai-generated','human-edited-ai')),
  human_edited boolean NOT NULL DEFAULT true,
  generation_id text,
  updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(sprint_id,kind)
 )`);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_sprint_review_analysis_audit(
  id text PRIMARY KEY,
  sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK(kind IN ('manual','ai')),
  previous_values jsonb,
  next_values jsonb NOT NULL,
  actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
 )`);
}

type DbReviewRow={
 kind:string;body:string|null;revision:number;origin:string;
 humanEdited:boolean;generationId:string|null;updatedAt:string;updatedBy:string|null;
 updatedByName:string|null;
};
const reviewSelect=`SELECT r.kind,r.body,r.revision,r.origin,
 r.human_edited AS "humanEdited",r.generation_id AS "generationId",
 to_char(r.updated_at AT TIME ZONE 'UTC',
 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt",r.updated_by AS "updatedBy",
 account.username AS "updatedByName"
 FROM public.smn_sprint_review_analysis r
 LEFT JOIN public.smn_account account ON account.id=r.updated_by
 WHERE r.sprint_id=$1`;
function reviewFromRows(rows:readonly DbReviewRow[]):
 Pick<Extract<ReviewProjection,{state:"available"}>,"manual"|"ai">|null{
 const current=new Map<ReviewKind,ReviewEntry>();
 for(const row of rows){
  if(!validReviewKind(row.kind)||current.has(row.kind))return null;
  const parsed=parseReviewEntry(row.kind,row);
  if(!parsed)return null;
  current.set(row.kind,parsed);
 }
 return {manual:current.get("manual")??emptyReview("manual"),
  ai:current.get("ai")??emptyReview("ai")};
}

/** SELECT only; team-bound, safe inside dashboard REPEATABLE READ READ ONLY. */
export async function readSprintReview(
 db:Client,teamId:string,sprintId:string
):Promise<ReviewProjection|null>{
 const scoped=await db.query<{status:string}>(`
  SELECT s.status FROM public.smn_sprint s
  JOIN public.smn_team t ON t.id=s.team_id
  JOIN public.smn_installation i ON i.id=t.installation_id
  WHERE s.id=$1 AND s.team_id=$2 AND s.deleted_at IS NULL
   AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum'
 `,[sprintId,teamId]);
 const found=scoped.rows[0];
 if(!found)return null;
 if(found.status==="closed"){
  const has=await db.query<{present:boolean}>(`
   SELECT to_regclass('public.smn_sprint_closure_snapshot') IS NOT NULL AS present`);
  if(!has.rows[0]?.present)return {state:"unavailable",reason:"history-missing"};
  const snapshots=await db.query<{version:number;snapshot:unknown}>(`
   SELECT version,snapshot FROM public.smn_sprint_closure_snapshot
   WHERE sprint_id=$1 ORDER BY version DESC LIMIT 1`,[sprintId]);
  const latest=snapshots.rows[0];
  if(!latest||!Number.isSafeInteger(latest.version)||latest.version<1)
   return {state:"unavailable",reason:"history-missing"};
  const raw=latest.snapshot;
  if(!raw||typeof raw!=="object"||Array.isArray(raw))
   return {state:"unavailable",reason:"read-failed"};
  const review=(raw as Record<string,unknown>).reviewAnalysis;
  if(review===undefined)return {state:"unavailable",reason:"history-missing"};
  if(!review||typeof review!=="object"||Array.isArray(review))
   return {state:"unavailable",reason:"read-failed"};
  const data=review as Record<string,unknown>;
  if(!Object.prototype.hasOwnProperty.call(data,"manual")||
   !Object.prototype.hasOwnProperty.call(data,"ai"))
   return {state:"unavailable",reason:"history-missing"};
  const manual=parseReviewEntry("manual",data.manual);
  const ai=parseReviewEntry("ai",data.ai);
  if(!manual||!ai)return {state:"unavailable",reason:"read-failed"};
  return {state:"available",source:"closure-snapshot",snapshotVersion:latest.version,
   manual,ai};
 }
 const installed=await db.query<{present:boolean}>(`
  SELECT to_regclass('public.smn_sprint_review_analysis') IS NOT NULL AS present`);
 if(!installed.rows[0]?.present)
  return {state:"available",source:"current",snapshotVersion:null,
   manual:emptyReview("manual"),ai:emptyReview("ai")};
 const rows=await db.query<DbReviewRow>(reviewSelect,[sprintId]);
 const content=reviewFromRows(rows.rows);
 if(!content)return {state:"unavailable",reason:"read-failed"};
 return {state:"available",source:"current",snapshotVersion:null,...content};
}

/** The closure workflow calls this after schema preparation, BEFORE closing.
 * It never fabricates machine-generated text or rewrites a human draft. */
export async function reviewClosureSnapshot(db:Client,sprintId:string):Promise<{
 manual:ReviewEntry;ai:ReviewEntry
}>{
 const rows=await db.query<DbReviewRow>(reviewSelect,[sprintId]);
 const result=reviewFromRows(rows.rows);
 if(!result)throw Error("invalid-sprint-review-row");
 return result;
}

/** Only human-authored or human-edited saves in D7.
 * Future AI generation MUST check human_edited + revision before overwriting. */
export async function writeSprintReview(db:Client,actorId:string,raw:unknown){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))
  return {ok:false as const,error:"invalid-input" as const};
 const data=raw as Record<string,unknown>;
 if(Object.keys(data).sort().join(",")!=="body,kind,revision,sprintId"||
  !validReviewKind(data.kind)||typeof data.sprintId!=="string"||
  !/^[0-9a-f-]{36}$/i.test(data.sprintId)||
  !Number.isSafeInteger(data.revision)||Number(data.revision)<0)
  return {ok:false as const,error:"invalid-input" as const};
 const body=cleanReviewBody(data.body);
 if(body===undefined)return {ok:false as const,error:"invalid-input" as const};
 await db.query("BEGIN");
 try{
  const scope=await db.query<{id:string;status:string}>(`
   SELECT s.id,s.status FROM public.smn_sprint s
   JOIN public.smn_team t ON t.id=s.team_id
   JOIN public.smn_installation i ON i.id=t.installation_id
   WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton'
    AND i.state='initialized' AND lower(i.mode)='scrum'
   FOR UPDATE OF s
  `,[data.sprintId]);
  const sprint=scope.rows[0];
  if(!sprint){await db.query("ROLLBACK");return {ok:false as const,error:"not-found" as const};}
  if(sprint.status==="closed"){
   await db.query("ROLLBACK");return {ok:false as const,error:"closed-period" as const};
  }
  await ensureSprintReviewSchema(db);
  const existing=await db.query<DbReviewRow>(reviewSelect+" FOR UPDATE OF r",
   [data.sprintId]);
  const previous=existing.rows.find(r=>r.kind===data.kind);
  const revision=previous?.revision??0;
  if(revision!==data.revision){
   await db.query("ROLLBACK");return {ok:false as const,error:"conflict" as const};
  }
  if((previous?.body??null)===body){
   await db.query("COMMIT");
   return {ok:true as const,revision,unchanged:true};
  }
  const newRevision=revision+1;
  if(previous){
   await db.query(`UPDATE public.smn_sprint_review_analysis SET
    body=$3,revision=$4,origin=$5,human_edited=true,
    updated_by=$6,updated_at=now()
    WHERE sprint_id=$1 AND kind=$2`,[
     data.sprintId,data.kind,body,newRevision,
     previous.generationId!==null?"human-edited-ai":"human",actorId
    ]);
  }else{
   await db.query(`INSERT INTO public.smn_sprint_review_analysis
    (sprint_id,kind,body,revision,origin,human_edited,updated_by)
    VALUES($1,$2,$3,1,'human',true,$4)`,
    [data.sprintId,data.kind,body,actorId]);
  }
  await db.query(`INSERT INTO public.smn_sprint_review_analysis_audit
   (id,sprint_id,kind,previous_values,next_values,actor_id)
   VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,[
   randomUUID(),data.sprintId,data.kind,
   previous?JSON.stringify(previous):null,
   JSON.stringify({body,revision:newRevision,
    origin:previous?.generationId!=null?"human-edited-ai":"human",
    humanEdited:true,generationId:previous?.generationId??null}),
   actorId
  ]);
  await db.query("COMMIT");
  return {ok:true as const,revision:newRevision,unchanged:false};
 }catch(error){
  await db.query("ROLLBACK").catch(()=>undefined);
  throw error;
 }
}
