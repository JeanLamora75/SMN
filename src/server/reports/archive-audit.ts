import {readdir} from "node:fs/promises";
import {join,resolve} from "node:path";
import type {Client} from "pg";
export type ArchiveAudit={orphanFiles:string[];missingFiles:string[];unexpectedFiles:string[]};
/** Read-only inventory. A file is never removed solely because the DB lookup failed. */
export async function auditPdfArchiveStorage(db:Client):Promise<ArchiveAudit>{
 const root=resolve(process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR||join(process.cwd(),".smn-private","report-archives"));
 const files=await readdir(root).catch((error:NodeJS.ErrnoException)=>{
  if(error.code==="ENOENT")return [] as string[];
  throw error;
 });
 const table=await db.query<{present:boolean}>("SELECT to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS present");
 const rows=table.rows[0]?.present?await db.query<{stored_name:string}>("SELECT stored_name FROM public.smn_report_pdf_archive"):{rows:[]};
 const expected=new Set(rows.rows.map(row=>row.stored_name));
 const actual=new Set(files);
 const orphanFiles:string[]=[],unexpectedFiles:string[]=[],missingFiles:string[]=[];
 for(const name of files){
  if(!/^[a-f0-9-]{36}\.pdf$/i.test(name)){unexpectedFiles.push(name);continue;}
  if(!expected.has(name))orphanFiles.push(name);
 }
 for(const name of expected)if(!actual.has(name))missingFiles.push(name);
 return {orphanFiles:orphanFiles.sort(),missingFiles:missingFiles.sort(),unexpectedFiles:unexpectedFiles.sort()};
}
