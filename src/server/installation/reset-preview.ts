import "server-only";
import {Client} from "pg";
import {lstat,readdir} from "node:fs/promises";
import {join} from "node:path";
import {installedDatabaseUri} from "../auth/database";
import {backupRootPath,backupState} from "../backup/runner";
import {scanDocuments} from "../backup/files";

export type ResetImpact=Readonly<{
 inspectedAt:string;
 installation:{id:string;schemaVersion:number;createdAt:string;postgresVersion:string};
 database:{tables:number;estimatedRows:number;examples:{table:string;estimatedRows:number}[];
  estimatesOnly:true};
 privateDocuments:{count:number|null;state:"verified"|"unavailable"};
 backups:{count:number|null;lastSuccessfulAt:string|null;state:"available"|"unavailable"};
 risks:readonly string[];
 confirmationRequired:"REINITIALISER MON INSTALLATION";
 canExecute:false;blocked:true;
}>;

/** Read-only risk analysis; estimates are never a deletion plan. */
export async function previewInstallationReset():Promise<ResetImpact>{
 const db=new Client({connectionString:await installedDatabaseUri(),
  application_name:"smn37-reset-impact",connectionTimeoutMillis:3500,
  statement_timeout:7000,query_timeout:7000});
 let installation:ResetImpact["installation"],database:ResetImpact["database"];
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  try{
   const result=await db.query<{id:string;schema_version:number;
    created_at:Date;postgres_version:string}>(`
    SELECT id,schema_version,created_at,
     current_setting('server_version') AS postgres_version
    FROM public.smn_installation WHERE id='singleton' AND state='initialized'`);
   if(result.rowCount!==1)throw Error("installation-unavailable");
   const i=result.rows[0];
   installation={id:i.id,schemaVersion:i.schema_version,
    createdAt:new Date(i.created_at).toISOString(),postgresVersion:i.postgres_version};
   const rows=await db.query<{name:string;estimated_rows:string}>(`
    SELECT c.relname AS name,greatest(c.reltuples,0)::bigint::text AS estimated_rows
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'smn_%'
    ORDER BY c.relname`);
   const examples=rows.rows.map(r=>({table:r.name,estimatedRows:Number(r.estimated_rows)}));
   if(examples.some(x=>!Number.isSafeInteger(x.estimatedRows)||x.estimatedRows<0))
    throw Error("invalid-estimates");
   database={tables:examples.length,
    estimatedRows:examples.reduce((sum,r)=>sum+r.estimatedRows,0),
    examples:examples.filter(x=>x.estimatedRows>0)
     .sort((a,b)=>b.estimatedRows-a.estimatedRows).slice(0,15),
    estimatesOnly:true};
   await db.query("COMMIT");
  }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
 }finally{await db.end().catch(()=>undefined);}
 let privateDocuments:ResetImpact["privateDocuments"]={count:null,state:"unavailable"};
 try{
  const directory=process.env.SMN_PRIVATE_DOCUMENTS_DIR;
  if(!directory)throw Error("documents-directory-unconfigured");
  const docs=await scanDocuments(directory);
  privateDocuments={count:docs.filter(x=>x.name.endsWith(".meta.json")).length,
   state:"verified"};
 }catch{/* Unknown scope, not zero. */}
 let backups:ResetImpact["backups"]={count:null,lastSuccessfulAt:null,state:"unavailable"};
 try{
  const root=backupRootPath(),state=await backupState();
  const base=join(root,"packages");
  const st=await lstat(base).catch((e:NodeJS.ErrnoException)=>{
   if(e.code==="ENOENT")return null;throw e;
  });
  if(st!==null&&(!st.isDirectory()||st.isSymbolicLink()))throw Error("invalid-backups");
  const ids=st?await readdir(base):[];
  if(ids.length>1000)throw Error("too-many-packages");
  backups={count:ids.filter(s=>/^[0-9a-f-]{36}$/i.test(s)).length,
   lastSuccessfulAt:state.last?.status==="success"?state.last.createdAt:null,
   state:"available"};
 }catch{/* Unavailable backup inventory blocks operation. */}
 return {inspectedAt:new Date().toISOString(),installation,database,
  privateDocuments,backups,
  risks:["database-overwrite","private-files","archives-and-snapshots",
   "accounts-and-sessions","historical-links","erasure-ledger",
   "backup-before-reset","rollback-not-qualified","external-copies"],
  confirmationRequired:"REINITIALISER MON INSTALLATION",
  canExecute:false,blocked:true};
}
