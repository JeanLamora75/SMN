import "server-only";
import {lstat,readFile} from "node:fs/promises";
import {join} from "node:path";
import {Client} from "pg";
import {installedDatabaseUri} from "../auth/database";
import {backupRootPath} from "./runner";
import {inspectBackup,type BackupInventoryEntry} from "./verification";
import {scanDocuments} from "./files";
import appPackage from "../../../package.json";

export type PreviewIssue="archive-not-verified"|"source-unconfirmed"|"different-installation"|
 "schema-newer"|"schema-older"|"postgres-incompatible"|"application-incompatible"|
 "privacy-not-cleared"|"snapshot-older"|"current-documents-unavailable"|"current-unavailable";
export type RestorePreview=Readonly<{
 id:string;checkedAt:string;archive:BackupInventoryEntry;current:{
  installationSource:string;schemaVersion:number;postgresVersion:string;
  applicationVersion:string;documentCount:number|null;
 };issues:PreviewIssue[];blocked:boolean;canRestore:false;
}>;

/** Pure policy: a preview cannot grant permission to restore. */
export function evaluatePreview(archive:BackupInventoryEntry,current:RestorePreview["current"],
 now=new Date()):PreviewIssue[]{
 const issues:PreviewIssue[]=[];
 if(archive.status!=="verified"||!archive.integrityVerified)issues.push("archive-not-verified");
 if(!archive.installationSource||archive.installationSource==="singleton (legacy)")
  issues.push("source-unconfirmed");
 else if(archive.installationSource!==current.installationSource)
  issues.push("different-installation");
 if(archive.schemaVersion!==null){
  if(archive.schemaVersion>current.schemaVersion)issues.push("schema-newer");
  if(archive.schemaVersion<current.schemaVersion)issues.push("schema-older");
 }
 if(!archive.postgresVersion||archive.postgresVersion.split(".")[0]!==current.postgresVersion.split(".")[0])
  issues.push("postgres-incompatible");
 if(!archive.applicationVersion||archive.applicationVersion!==current.applicationVersion)
  issues.push("application-incompatible");
 if(archive.createdAt&&new Date(archive.createdAt).getTime()<now.getTime()-60_000)
  issues.push("snapshot-older");
 if(current.documentCount===null)issues.push("current-documents-unavailable");
 // SMN-40 must establish the erasure ledger before any restore is authorized.
 issues.push("privacy-not-cleared");
 return issues;
}

/** Does not mutate the installation, archives or verification ledger. */
export async function previewBackup(id:string):Promise<RestorePreview>{
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
  throw new Error("invalid-id");
 const root=backupRootPath();
 let key:Buffer|null=null;
 try{
  const path=join(root,".backup-key");
  const stat=await lstat(path).catch(()=>null);
  if(stat?.isFile()&&!stat.isSymbolicLink()&&stat.size===32)key=await readFile(path);
  const archive=await inspectBackup(root,id,key);
  const uri=await installedDatabaseUri();
  const db=new Client({connectionString:uri,application_name:"smn-restore-preview",
   connectionTimeoutMillis:3500,statement_timeout:5000,query_timeout:5000});
  let current:RestorePreview["current"];
  try{
   await db.connect();
   await db.query("BEGIN TRANSACTION READ ONLY");
   const result=await db.query<{schema_version:number;created_at:Date;pg_version:string}>(`
    SELECT schema_version,created_at,current_setting('server_version') AS pg_version
    FROM public.smn_installation WHERE id='singleton' AND state='initialized'`);
   if(result.rows.length!==1)throw new Error("current-installation-unavailable");
   const row=result.rows[0];
   current={installationSource:"singleton:"+new Date(row.created_at).toISOString(),
    schemaVersion:row.schema_version,postgresVersion:row.pg_version,
    applicationVersion:appPackage.version,documentCount:null};
   await db.query("COMMIT");
  }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
  finally{await db.end().catch(()=>undefined);}
  const source=process.env.SMN_PRIVATE_DOCUMENTS_DIR;
  try{current={...current,documentCount:source?(await scanDocuments(source)).length/2:0};}
  catch{/* Document inventory unavailable: display a blocking warning. */}
  const issues=evaluatePreview(archive,current);
  return {id,checkedAt:new Date().toISOString(),archive,current,issues,
   blocked:issues.some(issue=>issue!=="snapshot-older"),canRestore:false};
 }finally{key?.fill(0);}
}
