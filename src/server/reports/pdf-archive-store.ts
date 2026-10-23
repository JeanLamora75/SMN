import {mkdir,open,readFile,unlink} from "node:fs/promises";
import {join,resolve} from "node:path";
import type {Client} from "pg";
import {newPdfManifest,validateFinalPdf,type PdfArchiveManifest} from "./pdf-archive-contract";
/** Private, non-web-facing store; never put archives in public/. */
const storageRoot=()=>resolve(process.env.SMN_PRIVATE_REPORT_ARCHIVE_DIR||join(process.cwd(),".smn-private","report-archives"));
export async function storeFinalPdfArchive(db:Client,bytes:Buffer,meta:Omit<PdfArchiveManifest,"id"|"sha256"|"byteLength"|"createdAt">){
 const manifest=newPdfManifest(bytes,meta),root=storageRoot();
 await mkdir(root,{recursive:true,mode:0o700});
 const location=join(root,manifest.id+".pdf");
 let fileCreated=false;
 let committed=false;
 try{
  const handle=await open(location,"wx",0o600);fileCreated=true;
  try{await handle.writeFile(bytes);await handle.sync();}finally{await handle.close();}
  const written=await readFile(location),integrity=validateFinalPdf(written);
  if(!integrity||integrity.sha256!==manifest.sha256||integrity.byteLength!==manifest.byteLength)throw Error("archive-integrity-failed");
  await db.query("BEGIN");
  try{
   await db.query(`CREATE TABLE IF NOT EXISTS public.smn_report_pdf_archive(
    id text PRIMARY KEY,sha256 text NOT NULL,byte_length integer NOT NULL,
    stored_name text NOT NULL UNIQUE,created_at timestamptz NOT NULL,
    author_id text NOT NULL,language text NOT NULL CHECK(language IN ('fr','en')),
    template_id text NOT NULL,team_id text NOT NULL,cycle_id text NOT NULL,cycle_status text NOT NULL,
    snapshot_version integer,manifest jsonb NOT NULL)`);
   await db.query(`INSERT INTO public.smn_report_pdf_archive(
    id,sha256,byte_length,stored_name,created_at,author_id,language,template_id,team_id,cycle_id,
    cycle_status,snapshot_version,manifest) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)`,[
    manifest.id,manifest.sha256,manifest.byteLength,manifest.id+".pdf",manifest.createdAt,manifest.authorId,
    manifest.language,manifest.templateId,manifest.teamId,manifest.cycleId,manifest.cycleStatus,
    manifest.snapshotVersion,JSON.stringify(manifest)
   ]);
   await db.query("COMMIT");
   committed=true;
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
  return manifest;
 }catch(error){if(fileCreated&&!committed)await unlink(location).catch(()=>undefined);throw error;}
}
export async function readVerifiedPdfArchive(db:Client,id:string):Promise<Buffer|null>{
 if(!/^[a-f0-9-]{36}$/i.test(id))return null;
 const exists=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_report_pdf_archive') IS NOT NULL AS present`);
 if(!exists.rows[0]?.present)return null;
 const r=await db.query<{sha256:string;byte_length:number;stored_name:string}>(`SELECT sha256,byte_length,stored_name FROM public.smn_report_pdf_archive WHERE id=$1`,[id]);
 const record=r.rows[0];if(!record||record.stored_name!==id+".pdf")return null;
 const bytes=await readFile(join(storageRoot(),record.stored_name)).catch(()=>null);
 const verified=bytes&&validateFinalPdf(bytes);
 return verified&&verified.sha256===record.sha256&&verified.byteLength===record.byte_length?bytes:null;
}
