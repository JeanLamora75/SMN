import {createHash,randomUUID} from "node:crypto";
import type {Client} from "pg";
import type {BriefMode} from "@/lib/ai-brief-templates";

export const digestTxt=(txt:string)=>createHash("sha256").update(txt,"utf8").digest("hex");
export type FinalizeInput={mode:BriefMode;cycleId:string;templateId:string;templateRevision:number;txt:string;approvedSha256:string;reviewConfirmed:boolean};
export function validateFinalizeInput(raw:unknown):raw is FinalizeInput{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const x=raw as Record<string,unknown>;
 return (x.mode==="scrum"||x.mode==="kanban")&&typeof x.cycleId==="string"&&/^[0-9a-f-]{36}$/i.test(x.cycleId)&&
 typeof x.templateId==="string"&&x.templateId.length>0&&x.templateId.length<=120&&
 Number.isSafeInteger(x.templateRevision)&&Number(x.templateRevision)>=0&&
 x.reviewConfirmed===true&&typeof x.txt==="string"&&Buffer.byteLength(x.txt,"utf8")>0&&
 Buffer.byteLength(x.txt,"utf8")<=200000&&typeof x.approvedSha256==="string"&&
 /^[a-f0-9]{64}$/.test(x.approvedSha256)&&digestTxt(x.txt)===x.approvedSha256;
}
async function ensureArchiveSchema(db:Client){
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_ai_brief_archive(
 id uuid PRIMARY KEY,mode text NOT NULL CHECK(mode IN ('scrum','kanban')),
 cycle_id text NOT NULL,team_id text NOT NULL,template_id text NOT NULL,
 template_revision integer NOT NULL,author_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),sha256 text NOT NULL,
 byte_length integer NOT NULL CHECK(byte_length>0),content bytea NOT NULL,
 reviewed boolean NOT NULL CHECK(reviewed=true),
 CHECK(octet_length(content)=byte_length)
 )`);
 await db.query(`CREATE OR REPLACE FUNCTION public.smn_ai_brief_archive_immutable()
 RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 RAISE EXCEPTION 'finalized AI brief archives are immutable';
 END $$`);
 await db.query(`DROP TRIGGER IF EXISTS smn_ai_brief_immutable ON public.smn_ai_brief_archive`);
 await db.query(`CREATE TRIGGER smn_ai_brief_immutable BEFORE UPDATE OR DELETE
 ON public.smn_ai_brief_archive FOR EACH ROW EXECUTE FUNCTION public.smn_ai_brief_archive_immutable()`);
}
export async function finalizeAiBrief(db:Client,actorId:string,raw:unknown){
 if(!validateFinalizeInput(raw))return {ok:false as const,error:"invalid-or-unreviewed"};
 const x=raw as FinalizeInput;
 const table=x.mode==="scrum"?"smn_sprint":"smn_kanban_period";
 const current=x.mode;
 await db.query("BEGIN");
 try{
  const scope=await db.query<{team_id:string}>(`SELECT c.team_id FROM public.${table} c
    JOIN public.smn_team t ON t.id=c.team_id
    JOIN public.smn_installation i ON i.id=t.installation_id
    WHERE c.id=$1 AND c.deleted_at IS NULL AND i.id='singleton'
    AND i.state='initialized' AND lower(i.mode)=$2`,[x.cycleId,current]);
  if(!scope.rows[0]){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
  // No re-composition from mutable sources: store the exact explicitly reviewed bytes.
  const id=randomUUID(),bytes=Buffer.from(x.txt,"utf8");
  await ensureArchiveSchema(db);
  await db.query(`INSERT INTO public.smn_ai_brief_archive(
   id,mode,cycle_id,team_id,template_id,template_revision,author_id,
   sha256,byte_length,content,reviewed)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)`,
   [id,x.mode,x.cycleId,scope.rows[0].team_id,x.templateId,x.templateRevision,actorId,
   x.approvedSha256,bytes.length,bytes]);
  await db.query("COMMIT");
  return {ok:true as const,id,sha256:x.approvedSha256};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
