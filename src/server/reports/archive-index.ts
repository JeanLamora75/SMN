import {readFile} from "node:fs/promises";
import {join,resolve} from "node:path";
import type {Client} from "pg";
import {validateFinalPdf,type PdfArchiveManifest} from "./pdf-archive-contract";
const root=()=>resolve(process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR||join(process.cwd(),".smn-private","report-archives"));
export type ArchiveIndexRow={id:string;createdAt:string;cycleId:string;teamId:string;templateId:string;language:string;snapshotVersion:number|null;manifest:PdfArchiveManifest};
export type ArchiveIntegrity="verified"|"degraded"|"unavailable";
export async function listCyclePdfArchives(db:Client,cycleId:string,teamId:string):Promise<ArchiveIndexRow[]>{
 if(!/^[a-f0-9-]{36}$/i.test(cycleId)||!teamId)return [];
 const table=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS present`);
 if(!table.rows[0]?.present)return [];
 const visibility=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_report_archive_visibility') IS NOT NULL AS present");
 const filter=visibility.rows[0]?.present?"AND NOT EXISTS (SELECT 1 FROM public.smn_report_archive_visibility h WHERE h.archive_id=a.id)":"";
 const r=await db.query<{id:string;createdAt:string;cycleId:string;teamId:string;templateId:string;language:string;snapshotVersion:number|null;manifest:PdfArchiveManifest}>(`
 SELECT id,created_at::text AS "createdAt",cycle_id AS "cycleId",team_id AS "teamId",
 template_id AS "templateId",language,snapshot_version AS "snapshotVersion",manifest
 FROM public.smn_report_pdf_archive a WHERE a.cycle_id=$1 AND a.team_id=$2 ${filter}
 ORDER BY a.created_at DESC,a.id DESC`,[cycleId,teamId]);
 return r.rows;
}
export async function verifyArchiveIntegrity(db:Client,id:string):Promise<ArchiveIntegrity>{
 if(!/^[a-f0-9-]{36}$/i.test(id))return "unavailable";
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return "unavailable";
 const r=await db.query<{sha256:string;byteLength:number;storedName:string}>(`
 SELECT sha256,byte_length AS "byteLength",stored_name AS "storedName"
 FROM public.smn_report_pdf_archive WHERE id=$1`,[id]);
 const row=r.rows[0];
 if(!row||row.storedName!==id+".pdf")return "unavailable";
 const bytes=await readFile(join(root(),row.storedName)).catch(()=>null);
 if(!bytes)return "unavailable";
 const value=validateFinalPdf(bytes);
 return value&&value.sha256===row.sha256&&value.byteLength===row.byteLength?"verified":"degraded";
}
