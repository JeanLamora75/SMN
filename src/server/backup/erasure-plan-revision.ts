import "server-only";
import {createHash} from "node:crypto";
import type {Client} from "pg";
import {scanDocuments} from "./files";
import {readVerifiedPdfArchive} from "../reports/pdf-archive-store";
import {officeReportsDirectory} from "../reports/office-storage";
import {officeTemplatesDirectory} from "../reports/office-catalog";
import {fingerprintManagedOfficeStores} from "./erasure-office-fingerprint";

const sha=(value:string)=>createHash("sha256").update(value).digest("hex");
const LIMIT=40,MAX_BYTES=100*1024*1024;
export type RevisionCapture=Readonly<{revision:string|null;reason:string}>;

/**
 * Repeatable PostgreSQL snapshot + current WAL position + verified bytes of
 * all managed files in scope. A gap means no stable plan may be issued.
 * An unrelated PostgreSQL write can invalidate a plan (intentionally safe).
 */
export async function captureErasureRevision(db:Client,
 teamIds:readonly string[],lsnBefore:string):Promise<RevisionCapture>{
 try{
  const wal=await db.query<{lsn:string}>(`
   SELECT pg_current_wal_lsn()::text AS lsn`);
  if(!/^[A-F0-9]+\/[A-F0-9]+$/i.test(wal.rows[0]?.lsn??"")||
   wal.rows[0].lsn!==lsnBefore)
   throw new Error("wal-unavailable");
  const parts:string[]=["wal="+wal.rows[0].lsn];
  const privateDir=process.env.SMN_PRIVATE_DOCUMENTS_DIR;
  if(!privateDir)throw new Error("private-store-unconfigured");
  const docs=await scanDocuments(privateDir);
  if(docs.length>2000)throw new Error("too-many-private-documents");
  parts.push("private="+sha(JSON.stringify(docs)));
  parts.push(...await fingerprintManagedOfficeStores(
   officeReportsDirectory(),officeTemplatesDirectory()));
  const archives=await db.query<{id:string}>(`
   SELECT id FROM public.smn_report_pdf_archive
   WHERE team_id=ANY($1::text[]) ORDER BY id LIMIT $2`,[teamIds,LIMIT+1]);
  if(archives.rows.length>LIMIT)throw new Error("too-many-report-pdfs");
  let total=0;
  for(const archive of archives.rows){
   const pdf=await readVerifiedPdfArchive(db,archive.id);
   if(!pdf)throw new Error("archive-file-unverifiable");
   total+=pdf.length;if(total>MAX_BYTES)throw new Error("too-many-bytes");
   parts.push("report="+archive.id+":"+createHash("sha256").update(pdf).digest("hex"));
  }
  const after=await db.query<{lsn:string}>("SELECT pg_current_wal_lsn()::text AS lsn");
  if(after.rows[0]?.lsn!==lsnBefore)throw new Error("concurrent-write");
  return {revision:sha(parts.join("|")),reason:"verified-current-inputs"};
 }catch{return {revision:null,reason:"incomplete-revision-coverage"};}
}
