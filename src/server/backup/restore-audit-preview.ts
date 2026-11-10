import {readFile,lstat} from "node:fs/promises";
import {join} from "node:path";
import {backupRootPath} from "./runner";
import {inspectBackup} from "./verification";
import {scanDocuments} from "./files";
import {withSessionReadDb} from "../auth/database";
import {evaluatePreview} from "./preview-policy";
import type {RestorePreview} from "./preview";
import appPackage from "../../../package.json";

/**
 * Exact read-only equivalent of the REST preview for an offline Node CLI.
 * This module intentionally does NOT import Next's "server-only" sentinel;
 * all SQL is executed in a READ ONLY transaction and no key is persisted.
 */
export async function previewBackupReadOnly(id:string):Promise<RestorePreview>{
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
  throw Error("invalid-id");
 const root=backupRootPath();
 let key:Buffer|null=null;
 try{
  const file=join(root,".backup-key");
  const st=await lstat(file).catch((error:NodeJS.ErrnoException)=>{
   if(error.code==="ENOENT")return null;throw error;
  });
  if(st){
   if(!st.isFile()||st.isSymbolicLink()||st.size!==32)throw Error("backup-key-untrusted");
   key=await readFile(file);
   if(key.length!==32)throw Error("backup-key-untrusted");
  }
  const archive=await inspectBackup(root,id,key);
  const current=await withSessionReadDb(async db=>{
   const r=await db.query<{schema_version:number;created_at:Date;pg_version:string}>(`
    SELECT schema_version,created_at,current_setting('server_version') AS pg_version
    FROM public.smn_installation WHERE id='singleton' AND state='initialized'`);
   if(r.rows.length!==1)throw Error("installation-unavailable");
   const v=r.rows[0];
   return {installationSource:"singleton:"+new Date(v.created_at).toISOString(),
    schemaVersion:v.schema_version,postgresVersion:v.pg_version,
    applicationVersion:appPackage.version,documentCount:null as number|null};
  });
  let docs:number|null=null;
  try{docs=process.env.SMN_PRIVATE_DOCUMENTS_DIR?
    (await scanDocuments(process.env.SMN_PRIVATE_DOCUMENTS_DIR)).length/2:0;}
  catch{/* Unknown cannot be treated as an empty inventory. */}
  const complete={...current,documentCount:docs};
  const issues=evaluatePreview(archive,complete);
  return {id,archive,checkedAt:new Date().toISOString(),current:complete,
   issues,blocked:issues.some(issue=>issue!=="snapshot-older"),canRestore:false};
 }finally{key?.fill(0);}
}
