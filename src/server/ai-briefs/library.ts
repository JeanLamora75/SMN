import {createHash} from "node:crypto";
import type {Client} from "pg";

export type BriefArchiveRow={
 id:string;mode:"scrum"|"kanban";cycle_id:string;team_id:string;template_id:string;
 template_revision:number;created_at:string;sha256:string;byte_length:number;author_id:string;parent_archive_id:string|null;
};
export const briefArchiveIdValid=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export function verifiedBriefText(bytes:Buffer,sha256:string,byteLength:number):string|null{
 if(bytes.length!==byteLength||createHash("sha256").update(bytes).digest("hex")!==sha256)return null;
 const text=bytes.toString("utf8");
 return Buffer.from(text,"utf8").equals(bytes)?text:null;
}
async function parentColumn(db:Client){
 const found=await db.query<{present:boolean}>(`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_ai_brief_archive' AND column_name='parent_archive_id') AS present`);
 return found.rows[0]?.present?"a.parent_archive_id::text":"NULL::text";
}
export async function listPrivateBriefArchives(db:Client,teamId:string){
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_ai_brief_archive') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return [] as BriefArchiveRow[];
 const parent=await parentColumn(db);
 const result=await db.query<BriefArchiveRow>(`SELECT a.id::text,a.mode,a.cycle_id,a.team_id,a.template_id,a.template_revision,
 a.created_at::text,a.sha256,a.byte_length,a.author_id,${parent} AS parent_archive_id
 FROM public.smn_ai_brief_archive a WHERE a.team_id=$1 ORDER BY a.created_at DESC,a.id DESC LIMIT 200`,[teamId]);
 return result.rows;
}
export async function readPrivateBriefArchive(db:Client,id:string,teamId:string){
 if(!briefArchiveIdValid(id))return {state:"not-found" as const};
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_ai_brief_archive') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return {state:"not-found" as const};
 const parent=await parentColumn(db);
 const result=await db.query<BriefArchiveRow&{content:Buffer}>(`SELECT a.id::text,a.mode,a.cycle_id,a.team_id,a.template_id,
 a.template_revision,a.created_at::text,a.sha256,a.byte_length,a.author_id,a.content,${parent} AS parent_archive_id
 FROM public.smn_ai_brief_archive a WHERE a.id=$1 AND a.team_id=$2`,[id,teamId]);
 const row=result.rows[0];
 if(!row)return {state:"not-found" as const};
 const content=Buffer.isBuffer(row.content)?row.content:Buffer.from(row.content);
 const text=verifiedBriefText(content,row.sha256,row.byte_length);
 if(text===null)return {state:"integrity-error" as const};
 const {content:_,...metadata}=row;
 return {state:"ok" as const,metadata,text};
}
