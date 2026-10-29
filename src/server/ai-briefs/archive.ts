import {assertAiBriefSchema} from "./schema-ready";
import {createHash,randomUUID} from "node:crypto";
import type {Client} from "pg";
import type {BriefMode} from "@/lib/ai-brief-templates";

export const digestTxt=(txt:string)=>createHash("sha256").update(txt,"utf8").digest("hex");
export type FinalizeInput={mode:BriefMode;cycleId:string;templateId:string;templateRevision:number;txt:string;approvedSha256:string;reviewConfirmed:boolean;draftId?:string;draftRevision?:number};
export function validateFinalizeInput(raw:unknown):raw is FinalizeInput{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const x=raw as Record<string,unknown>;
 return (x.mode==="scrum"||x.mode==="kanban")&&typeof x.cycleId==="string"&&/^[0-9a-f-]{36}$/i.test(x.cycleId)&&
 typeof x.templateId==="string"&&x.templateId.length>0&&x.templateId.length<=120&&
 Number.isSafeInteger(x.templateRevision)&&Number(x.templateRevision)>=0&&
 x.reviewConfirmed===true&&typeof x.txt==="string"&&Buffer.byteLength(x.txt,"utf8")>0&&
 Buffer.byteLength(x.txt,"utf8")<=200000&&typeof x.approvedSha256==="string"&&
 /^[a-f0-9]{64}$/.test(x.approvedSha256)&&digestTxt(x.txt)===x.approvedSha256&&
 (x.draftId===undefined||(typeof x.draftId==="string"&&/^[a-f0-9-]{36}$/i.test(x.draftId)&&Number.isSafeInteger(x.draftRevision)&&Number(x.draftRevision)>=1));
}
async function ensureArchiveSchema(db:Client){
 await assertAiBriefSchema(db,"archive");
 await assertAiBriefSchema(db,"archive");
 await assertAiBriefSchema(db,"archive");
 await assertAiBriefSchema(db,"archive");
 await assertAiBriefSchema(db,"archive");
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
  let parentId:string|null=null;
  if(x.draftId){
   await db.query(`SELECT 1 FROM public.smn_ai_brief_draft WHERE id=$1 FOR UPDATE`,[x.draftId]);
   const draft=await db.query<{parent_archive_id:string;content:string;revision:number;team_id:string;mode:string;cycle_id:string;template_id:string;template_revision:number;finalized_archive_id:string|null}>(`
    SELECT parent_archive_id::text,content,revision,team_id,mode,cycle_id,template_id,template_revision,finalized_archive_id::text
    FROM public.smn_ai_brief_draft WHERE id=$1`,[x.draftId]);
   const d=draft.rows[0];
   if(!d||d.finalized_archive_id||d.team_id!==scope.rows[0].team_id||d.mode!==x.mode||d.cycle_id!==x.cycleId||
    d.template_id!==x.templateId||d.template_revision!==x.templateRevision||d.revision!==x.draftRevision||d.content!==x.txt){
    await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};
   }
   parentId=d.parent_archive_id;
  }
  // No re-composition from mutable sources: store the exact explicitly reviewed bytes.
  const id=randomUUID(),bytes=Buffer.from(x.txt,"utf8");
  await ensureArchiveSchema(db);
  await db.query(`INSERT INTO public.smn_ai_brief_archive(
   id,mode,cycle_id,team_id,template_id,template_revision,author_id,
   sha256,byte_length,content,reviewed,parent_archive_id)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11)`,
   [id,x.mode,x.cycleId,scope.rows[0].team_id,x.templateId,x.templateRevision,actorId,
   x.approvedSha256,bytes.length,bytes,parentId]);
  if(x.draftId)await db.query(`UPDATE public.smn_ai_brief_draft SET finalized_archive_id=$2 WHERE id=$1`,[x.draftId,id]);
  await db.query("COMMIT");
  return {ok:true as const,id,sha256:x.approvedSha256};
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
}
