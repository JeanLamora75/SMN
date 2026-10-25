import {readdir,lstat,readFile} from "node:fs/promises";
import {join,resolve} from "node:path";
import type {Client} from "pg";
import {PDF_MAX_BYTES,validateFinalPdf} from "./pdf-archive-contract";

const root=()=>resolve(process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR||join(process.cwd(),".smn-private","report-archives"));
const pdfName=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;
export type ArchiveRecoveryFinding={
 filename:string;status:"registered"|"orphan-candidate"|"missing"|"integrity-mismatch";
};

/** Read-only inventory. Never delete, rename, recover, or expose the contents of files. */
export async function inspectArchiveRecovery(db:Client):Promise<ArchiveRecoveryFinding[]>{
 const location=root();
 const entries=await readdir(location,{withFileTypes:true}).catch((error:NodeJS.ErrnoException)=>{
  if(error.code==="ENOENT")return [];
  throw error;
 });
 const table=await db.query<{exists:boolean}>("SELECT to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS exists");
 if(!table.rows[0]?.exists)return entries.filter(e=>e.isFile()&&pdfName.test(e.name))
  .map(e=>({filename:e.name,status:"orphan-candidate" as const}));
 const registered=await db.query<{stored_name:string;sha256:string;byte_length:number}>(
  "SELECT stored_name,sha256,byte_length FROM public.smn_report_pdf_archive");
 const byName=new Map(registered.rows.map(r=>[r.stored_name,r]));
 const found=new Set<string>();
 const findings:ArchiveRecoveryFinding[]=[];
 for(const entry of entries){
  if(!pdfName.test(entry.name))continue;
  const filename=entry.name,record=byName.get(filename);
  if(!record){findings.push({filename,status:"orphan-candidate"});continue;}
  found.add(filename);
  if(!entry.isFile()){findings.push({filename,status:"integrity-mismatch"});continue;}
  const filepath=join(location,filename);
  const stat=await lstat(filepath).catch(()=>null);
  if(!stat?.isFile()||stat.isSymbolicLink()||stat.size>PDF_MAX_BYTES){
   findings.push({filename,status:"integrity-mismatch"});continue;
  }
  const bytes=await readFile(filepath).catch(()=>null);
  const signature=bytes&&validateFinalPdf(bytes);
  findings.push({filename,status:signature&&signature.sha256===record.sha256&&signature.byteLength===record.byte_length?"registered":"integrity-mismatch"});
 }
 for(const record of registered.rows){
  if(!found.has(record.stored_name))findings.push({filename:record.stored_name,status:"missing"});
 }
 return findings.sort((a,b)=>a.filename.localeCompare(b.filename));
}
