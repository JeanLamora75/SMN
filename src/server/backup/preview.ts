import "server-only";
import {lstat,readFile} from "node:fs/promises";
import {join} from "node:path";
import {Client} from "pg";
import {installedDatabaseUri} from "../auth/database";
import {backupRootPath} from "./runner";
import {inspectBackup,type BackupInventoryEntry} from "./verification";
import {scanDocuments} from "./files";
import appPackage from "../../../package.json";

import {evaluatePreview,type PreviewIssue,type CurrentBackupState} from "./preview-policy";
export type RestorePreview=Readonly<{
 id:string;checkedAt:string;archive:BackupInventoryEntry;current:CurrentBackupState;
 issues:PreviewIssue[];blocked:boolean;canRestore:false;
}>;

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
