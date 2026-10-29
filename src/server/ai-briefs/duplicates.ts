import {assertAiBriefSchema} from "./schema-ready";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {readPrivateBriefArchive,briefArchiveIdValid} from "./library";

export async function ensureBriefDrafts(db:Client){
 await assertAiBriefSchema(db,"duplicates");
}
export async function duplicateBrief(db:Client,parentId:string,teamId:string,actorId:string){
 if(!briefArchiveIdValid(parentId))return {ok:false as const,error:"not-found"};
 await db.query("BEGIN");
 try{
  const parent=await readPrivateBriefArchive(db,parentId,teamId);
  if(parent.state!=="ok"){await db.query("ROLLBACK");return {ok:false as const,error:parent.state};}
  await ensureBriefDrafts(db);
  const id=randomUUID();
  await db.query(`INSERT INTO public.smn_ai_brief_draft(
   id,parent_archive_id,team_id,mode,cycle_id,template_id,template_revision,content,created_by)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
   [id,parentId,teamId,parent.metadata.mode,parent.metadata.cycle_id,parent.metadata.template_id,parent.metadata.template_revision,parent.text,actorId]);
  await db.query("COMMIT");
  return {ok:true as const,id};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function readBriefDraft(db:Client,id:string,teamId:string){
 if(!briefArchiveIdValid(id))return null;
 await ensureBriefDrafts(db);
 const r=await db.query<{id:string;parent_archive_id:string;mode:"scrum"|"kanban";cycle_id:string;template_id:string;template_revision:number;content:string;revision:number;finalized_archive_id:string|null}>(`
 SELECT id::text,parent_archive_id::text,mode,cycle_id,template_id,template_revision,content,revision,finalized_archive_id::text
 FROM public.smn_ai_brief_draft WHERE id=$1 AND team_id=$2`,[id,teamId]);
 return r.rows[0]??null;
}
export async function updateBriefDraft(db:Client,id:string,teamId:string,revision:number,content:string){
 if(!briefArchiveIdValid(id)||!Number.isSafeInteger(revision)||revision<1||typeof content!=="string"||
 !content.trim()||Buffer.byteLength(content,"utf8")>200000)return {ok:false as const,error:"invalid-input"};
 await ensureBriefDrafts(db);
 const r=await db.query<{revision:number}>(`UPDATE public.smn_ai_brief_draft
 SET content=$4,revision=revision+1,updated_at=now()
 WHERE id=$1 AND team_id=$2 AND revision=$3 AND finalized_archive_id IS NULL
 RETURNING revision`,[id,teamId,revision,content]);
 return r.rows[0]?{ok:true as const,revision:r.rows[0].revision}:{ok:false as const,error:"conflict"};
}
