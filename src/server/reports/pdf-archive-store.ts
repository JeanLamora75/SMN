import {mkdir,open,readFile,unlink} from "node:fs/promises";
import {join,resolve} from "node:path";
import type {Client} from "pg";
import {newPdfManifest,validateFinalPdf,type PdfArchiveManifest} from "./pdf-archive-contract";
import type {ReportDocument} from "./report-documents";
import {studioArchiveReference} from "./studio-archive-reference";
/** Private, non-web-facing store; never put archives in public/. */
const storageRoot=()=>resolve(process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR||join(process.cwd(),".smn-private","report-archives"));
export async function storeFinalPdfArchive(db:Client,bytes:Buffer,meta:Omit<PdfArchiveManifest,"id"|"sha256"|"byteLength"|"createdAt">,operationId?:string,studioSource?:ReportDocument){
 const manifest=newPdfManifest(bytes,meta),root=storageRoot();
 await mkdir(root,{recursive:true,mode:0o700});
 const location=join(root,manifest.id+".pdf");
 let fileCreated=false;
 let committed=false;
 let storedManifest=manifest;
 try{
  const handle=await open(location,"wx",0o600);fileCreated=true;
  try{await handle.writeFile(bytes);await handle.sync();}finally{await handle.close();}
  const written=await readFile(location),integrity=validateFinalPdf(written);
  if(!integrity||integrity.sha256!==manifest.sha256||integrity.byteLength!==manifest.byteLength)throw Error("archive-integrity-failed");
  await db.query("BEGIN");
  try{
   let finalManifest=manifest;
   if(studioSource){
    const sourceRef=studioArchiveReference(studioSource);
    // This row lock serializes the final archive commit with Studio writes.
    // It prevents a revision change between the last pre-render read and
    // insertion of the immutable PDF snapshot.
    const current=await db.query<{id:string;revision:number;team_id:string;sprint_id:string}>(`
      SELECT d.id,d.revision,d.team_id,d.sprint_id
      FROM public.smn_report_document d
      JOIN public.smn_sprint s ON s.id=d.sprint_id AND s.team_id=d.team_id
      WHERE d.id=$1 AND d.sprint_id=$2 AND d.team_id=$3
        AND s.deleted_at IS NULL
      FOR UPDATE OF d`,[studioSource.id,studioSource.sprintId,studioSource.teamId]);
    if(current.rows.length!==1||Number(current.rows[0].revision)!==studioSource.revision||
      current.rows[0].team_id!==meta.teamId||current.rows[0].sprint_id!==meta.cycleId)
      throw Error("studio-archive-revision-changed");
    // Serialize version assignment for this document for all concurrent archive requests.
    await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))",[studioSource.id]);
    const last=await db.query<{version:number}>(`SELECT COALESCE(MAX(version),0) AS version FROM public.smn_report_studio_archive_snapshot WHERE document_id=$1`,[studioSource.id]);
    const version=Number(last.rows[0].version)+1;
    finalManifest={...manifest,optionsSnapshot:{...manifest.optionsSnapshot,studioDocumentId:studioSource.id,
      studioDocumentRevision:studioSource.revision,studioSourceSha256:sourceRef.sourceSha256,studioArchiveVersion:version}};
   }
   await db.query(`INSERT INTO public.smn_report_pdf_archive(
    id,sha256,byte_length,stored_name,created_at,author_id,language,template_id,team_id,cycle_id,
    cycle_status,snapshot_version,manifest,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14)`,[
    manifest.id,manifest.sha256,manifest.byteLength,manifest.id+".pdf",manifest.createdAt,manifest.authorId,
    manifest.language,manifest.templateId,manifest.teamId,manifest.cycleId,manifest.cycleStatus,
    manifest.snapshotVersion,JSON.stringify(finalManifest),operationId??null
   ]);
   if(studioSource){
    const snapshot=finalManifest.optionsSnapshot!;
    await db.query(`INSERT INTO public.smn_report_studio_archive_snapshot(archive_id,document_id,version,document_revision,source_sha256,snapshot) VALUES($1,$2,$3,$4,$5,$6::jsonb)`,
      [manifest.id,studioSource.id,snapshot.studioArchiveVersion,studioSource.revision,snapshot.studioSourceSha256,JSON.stringify(studioSource)]);
   }
   await db.query("COMMIT");
   storedManifest=finalManifest;
   committed=true;
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
  return storedManifest;
 }catch(error){if(fileCreated&&!committed)await unlink(location).catch(()=>undefined);throw error;}
}
export async function readVerifiedPdfArchive(db:Client,id:string):Promise<Buffer|null>{
 if(!/^[a-f0-9-]{36}$/i.test(id))return null;
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return null;
 const r=await db.query<{sha256:string;byte_length:number;stored_name:string;manifest:PdfArchiveManifest}>(`SELECT sha256,byte_length,stored_name,manifest FROM public.smn_report_pdf_archive WHERE id=$1`,[id]);
 const record=r.rows[0];if(!record||record.stored_name!==id+".pdf")return null;
 const opts=record.manifest?.optionsSnapshot;
 if(opts?.studioArchiveVersion){
  const snapshot=await db.query<{snapshot:ReportDocument;document_id:string;version:number;document_revision:number;source_sha256:string}>(
   `SELECT snapshot,document_id,version,document_revision,source_sha256 FROM public.smn_report_studio_archive_snapshot WHERE archive_id=$1`,[id]);
  const row=snapshot.rows[0];
  if(!row||row.document_id!==opts.studioDocumentId||row.document_revision!==opts.studioDocumentRevision||
    row.version!==opts.studioArchiveVersion||row.source_sha256!==opts.studioSourceSha256||
    studioArchiveReference(row.snapshot).sourceSha256!==row.source_sha256)return null;
 }
 const bytes=await readFile(join(storageRoot(),record.stored_name)).catch(()=>null);
 const verified=bytes&&validateFinalPdf(bytes);
 return verified&&verified.sha256===record.sha256&&verified.byteLength===record.byte_length?bytes:null;
}
