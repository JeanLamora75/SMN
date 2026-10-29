import {assertAiBriefSchema} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
export type HumanAnalysis={id:string;team_id:string;cycle_id:string;mode:"scrum"|"kanban";archive_id:string|null;scope:string;content:string;author_id:string;created_at:string;updated_at:string;origin:"human"};
export function validHumanAnalysis(input:unknown):input is {mode:"scrum"|"kanban";cycleId:string;archiveId?:string|null;scope:string;content:string}{
 if(!input||typeof input!=="object"||Array.isArray(input))return false;
 const a=input as Record<string,unknown>;
 return (a.mode==="scrum"||a.mode==="kanban")&&typeof a.cycleId==="string"&&/^[a-f0-9-]{36}$/i.test(a.cycleId)&&
 (a.archiveId===undefined||a.archiveId===null||typeof a.archiveId==="string"&&/^[a-f0-9-]{36}$/i.test(a.archiveId))&&
 typeof a.scope==="string"&&a.scope.trim().length>0&&a.scope.length<=160&&
 typeof a.content==="string"&&a.content.trim().length>0&&Buffer.byteLength(a.content,"utf8")<=200000;
}
export async function createHumanAnalysis(db:Client,actor:string,input:unknown){
 if(!validHumanAnalysis(input))return {ok:false as const,error:"invalid-input"};
 const a=input;
 const cycleTable=a.mode==="scrum"?"smn_sprint":"smn_kanban_period";
 await db.query("BEGIN");
 try{
  const t=await db.query<{team_id:string}>(`SELECT c.team_id FROM public.${cycleTable} c
   JOIN public.smn_team team ON team.id=c.team_id
   JOIN public.smn_installation i ON i.id=team.installation_id
   WHERE c.id=$1 AND c.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)=$2`,[a.cycleId,a.mode]);
  if(!t.rows[0]){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  if(a.archiveId){
   const found=await db.query(`SELECT 1 FROM public.smn_ai_brief_archive WHERE id=$1 AND team_id=$2 AND cycle_id=$3`,[a.archiveId,t.rows[0].team_id,a.cycleId]);
   if(!found.rows[0]){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  }
  await db.query(`CREATE TABLE IF NOT EXISTS public.smn_human_analysis(
   id uuid PRIMARY KEY,team_id text NOT NULL,cycle_id text NOT NULL,
   mode text NOT NULL CHECK(mode IN ('scrum','kanban')),archive_id uuid,
   scope text NOT NULL,content text NOT NULL,origin text NOT NULL DEFAULT 'human' CHECK(origin='human'),
   author_id text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
   updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_human_analysis
   (id,team_id,cycle_id,mode,archive_id,scope,content,author_id)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
   [id,t.rows[0].team_id,a.cycleId,a.mode,a.archiveId??null,a.scope.trim(),a.content,actor]);
  await db.query("COMMIT");return {ok:true as const,id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function listHumanAnalyses(db:Client,cycleId:string,teamId:string){
 const found=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_human_analysis') IS NOT NULL AS present`);
 if(!found.rows[0]?.present)return [] as HumanAnalysis[];
 const r=await db.query<HumanAnalysis>(`SELECT id::text,team_id,cycle_id,mode,archive_id::text,scope,content,author_id,
 created_at::text,updated_at::text,origin FROM public.smn_human_analysis
 WHERE cycle_id=$1 AND team_id=$2 ORDER BY created_at DESC,id DESC`,[cycleId,teamId]);
 return r.rows;
}
export async function updateHumanAnalysis(db:Client,id:string,teamId:string,content:string){
 if(!/^[a-f0-9-]{36}$/i.test(id)||!content.trim()||Buffer.byteLength(content,"utf8")>200000)return false;
 const r=await db.query(`UPDATE public.smn_human_analysis SET content=$3,updated_at=now()
 WHERE id=$1 AND team_id=$2 RETURNING id`,[id,teamId,content]);
 return r.rowCount===1;
}
