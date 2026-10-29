import type {Client} from "pg";
import {randomUUID} from "node:crypto";
import {standardReportSections} from "./standard-composition";
export const noteKeys=["introduction","conclusion",...standardReportSections] as const;
export type NoteKey=typeof noteKeys[number];
export type Note={text:string;included:boolean;language:"fr"|"en"};
export type Notes=Record<NoteKey,Note>;
export const emptyNotes=():Notes=>Object.fromEntries(noteKeys.map(key=>[key,{text:"",included:true,language:"fr"}])) as Notes;
export function validNotes(value:unknown):value is Notes{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const n=value as Record<string,unknown>;
 return Object.keys(n).sort().join(",")===[...noteKeys].sort().join(",")&&noteKeys.every(k=>{
 const v=n[k];if(!v||typeof v!=="object"||Array.isArray(v))return false;
 const x=v as Record<string,unknown>;
 return Object.keys(x).sort().join(",")==="included,language,text"&&typeof x.text==="string"&&x.text.length<=5000&&typeof x.included==="boolean"&&(x.language==="fr"||x.language==="en");
 });
}
export async function readReportDraft(db:Client,sprintId:string){
 const schema=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_draft') IS NOT NULL AS present`);
 if(!schema.rows[0]?.present)return {notes:emptyNotes(),revision:0};
 const r=await db.query<{notes:unknown;revision:number}>(`SELECT notes,revision FROM public.smn_report_draft WHERE sprint_id=$1`,[sprintId]);
 return r.rows[0]&&validNotes(r.rows[0].notes)?{notes:r.rows[0].notes,revision:r.rows[0].revision}:{notes:emptyNotes(),revision:0};
}
export async function saveReportDraft(db:Client,actorId:string,sprintId:string,payload:unknown){
 if(!actorId||!/^[a-f0-9-]{36}$/i.test(sprintId)||!payload||typeof payload!=="object"||Array.isArray(payload))
 return {ok:false as const,error:"invalid-input"};
 const v=payload as Record<string,unknown>;
 if(Object.keys(v).sort().join(",")!=="notes,revision"||!validNotes(v.notes)||!Number.isSafeInteger(v.revision)||Number(v.revision)<0)
 return {ok:false as const,error:"invalid-input"};
 await db.query("BEGIN");
 try{
 const scope=await db.query(`SELECT s.id FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id
 JOIN public.smn_installation i ON i.id=t.installation_id WHERE s.id=$1 AND s.deleted_at IS NULL AND
 i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum' FOR UPDATE OF s`,[sprintId]);
 if(scope.rows.length!==1){await db.query("ROLLBACK");return {ok:false as const,error:"not-found"};}
 const prior=await db.query<{revision:number;notes:unknown}>(`SELECT revision,notes FROM public.smn_report_draft WHERE sprint_id=$1 FOR UPDATE`,[sprintId]);
 const old=prior.rows[0];if((old?.revision??0)!==v.revision){await db.query("ROLLBACK");return {ok:false as const,error:"conflict"};}
 const revision=(old?.revision??0)+1;
 await db.query(`INSERT INTO public.smn_report_draft(sprint_id,notes,revision,updated_by)
 VALUES($1,$2::jsonb,$3,$4) ON CONFLICT(sprint_id) DO UPDATE SET notes=EXCLUDED.notes,
 revision=EXCLUDED.revision,updated_by=EXCLUDED.updated_by,updated_at=now()`,[sprintId,JSON.stringify(v.notes),revision,actorId]);
 await db.query(`INSERT INTO public.smn_report_draft_audit(id,sprint_id,revision,before_values,after_values,actor_id)
 VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,[randomUUID(),sprintId,revision,old?JSON.stringify(old.notes):null,JSON.stringify(v.notes),actorId]);
 await db.query("COMMIT");return {ok:true as const,revision};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
