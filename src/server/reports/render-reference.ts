import {createHash,randomUUID} from "node:crypto";
import type {Client} from "pg";
import {composeHtmlReportPreview} from "./html-preview";
import {readReportLanguage} from "./language";
import {readReportLogo} from "./logo-store";
import type {ReportLogo} from "./logo-contract";

export type FrozenReportPayload={
 data:NonNullable<Awaited<ReturnType<typeof composeHtmlReportPreview>>>;
 language:Awaited<ReturnType<typeof readReportLanguage>>;
 logo:ReportLogo|null;
};
export type FrozenReportReference={
 id:string;sprintId:string;createdAt:string;sha256:string;payload:FrozenReportPayload;
};
export function canonicalJson(value:unknown):string{
 if(value===null||typeof value!=="object")return JSON.stringify(value);
 if(Array.isArray(value))return "["+value.map(canonicalJson).join(",")+"]";
 const obj=value as Record<string,unknown>;
 return "{"+Object.keys(obj).filter(k=>obj[k]!==undefined).sort().map(k=>JSON.stringify(k)+":"+canonicalJson(obj[k])).join(",")+"}";
}
export function hashReportPayload(payload:FrozenReportPayload){
 return createHash("sha256").update(canonicalJson(payload),"utf8").digest("hex");
}
export function verifiedFrozenReference(ref:FrozenReportReference){
 return ref.sha256===hashReportPayload(ref.payload)&&ref.sprintId===ref.payload.data.sprint.id;
}
export async function createFrozenReportReference(db:Client,sprintId:string,actorId:string,expectedTeamId?:string){
 if(!actorId||!/^[a-f0-9-]{36}$/i.test(sprintId))return null;
 await db.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
 try{
 const scope=await db.query(`SELECT s.id FROM public.smn_sprint s
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE s.id=$1 AND s.deleted_at IS NULL AND i.id='singleton' AND i.state='initialized'
 AND lower(i.mode)='scrum' AND ($2::text IS NULL OR s.team_id=$2)`,[sprintId,expectedTeamId??null]);
 if(scope.rows.length!==1){await db.query("ROLLBACK");return null;}
 const data=await composeHtmlReportPreview(db,sprintId);
 if(!data){await db.query("ROLLBACK");return null;}
 const payload:FrozenReportPayload={
 data,language:await readReportLanguage(db,sprintId),logo:await readReportLogo(db,sprintId)
 };
 const id=randomUUID(),sha256=hashReportPayload(payload);
 await db.query(`CREATE TABLE IF NOT EXISTS public.smn_report_render_reference(
 id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),created_by text NOT NULL,
 sha256 text NOT NULL,payload jsonb NOT NULL)`);
 const saved=await db.query<{createdAt:string}>(`INSERT INTO public.smn_report_render_reference
 (id,sprint_id,created_by,sha256,payload)
 VALUES($1,$2,$3,$4,$5::jsonb) RETURNING created_at::text AS "createdAt"`,
 [id,sprintId,actorId,sha256,canonicalJson(payload)]);
 await db.query("COMMIT");
 return {id,sprintId,createdAt:saved.rows[0].createdAt,sha256,payload};
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
}
export async function readFrozenReportReference(db:Client,id:string,sprintId:string,expectedTeamId?:string){
 if(!/^[a-f0-9-]{36}$/i.test(id)||!/^[a-f0-9-]{36}$/i.test(sprintId))return null;
 const table=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_render_reference') IS NOT NULL AS present`);
 if(!table.rows[0]?.present)return null;
 const q=await db.query<{id:string;sprintId:string;createdAt:string;sha256:string;payload:FrozenReportPayload}>(`
 SELECT r.id,r.sprint_id AS "sprintId",r.created_at::text AS "createdAt",r.sha256,r.payload
 FROM public.smn_report_render_reference r
 JOIN public.smn_sprint s ON s.id=r.sprint_id
 JOIN public.smn_team t ON t.id=s.team_id JOIN public.smn_installation i ON i.id=t.installation_id
 WHERE r.id=$1 AND r.sprint_id=$2 AND s.deleted_at IS NULL
 AND i.id='singleton' AND i.state='initialized' AND lower(i.mode)='scrum' AND ($3::text IS NULL OR s.team_id=$3)`,[id,sprintId,expectedTeamId??null]);
 const ref=q.rows[0];
 return ref&&verifiedFrozenReference(ref)?ref:null;
}
