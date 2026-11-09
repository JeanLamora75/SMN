import "server-only";
import {Client} from "pg";
import {lstat,readdir} from "node:fs/promises";
import {join} from "node:path";
import {installedDatabaseUri} from "../auth/database";
import {backupRootPath,backupState} from "../backup/runner";
import {scanDocuments} from "../backup/files";
import {RESET_RISKS,RESET_CONFIRMATION} from "./reset-policy";
import {inspectExtraArchives} from "../backup/extra-archives";

export type ResetImpact=Readonly<{
 inspectedAt:string;
 installation:{id:string;schemaVersion:number;createdAt:string;postgresVersion:string};
 database:{tables:number;estimatedRows:number;examples:{table:string;estimatedRows:number}[];
  estimatesOnly:boolean;complete:boolean};
 archives:{reportPdfs:number|null;officeReports:number|null;officeTemplates:number|null;
  state:"verified"|"unavailable"};
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
 let archives:ResetImpact["archives"]={reportPdfs:null,officeReports:null,
  officeTemplates:null,state:"unavailable"};
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
   const tables=await db.query<{name:string}>(String.raw\`
    SELECT c.relname AS name
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'smn_%'
    ORDER BY c.relname\`);
   if(tables.rows.length>400||tables.rows.some(t=>!/^[a-z][a-z0-9_]*$/.test(t.name)))
    throw Error("reset-schema-unverifiable");
   const examples:{table:string;estimatedRows:number}[]=[];
   for(const row of tables.rows){
    const count=await db.query<{n:string}>(
     'SELECT count(*)::text AS n FROM public."'+row.name+'"');
    const n=Number(count.rows[0]?.n);
    if(!Number.isSafeInteger(n)||n<0)throw Error("reset-count-unverifiable");
    examples.push({table:row.name,estimatedRows:n});
   }
   const estimatedRows=examples.reduce((sum,row)=>sum+row.estimatedRows,0);
   if(!Number.isSafeInteger(estimatedRows))throw Error("reset-count-unverifiable");
   database={tables:examples.length,estimatedRows,
    examples:examples.filter(row=>row.estimatedRows>0)
     .sort((x,y)=>y.estimatedRows-x.estimatedRows).slice(0,15),
    estimatesOnly:false,complete:true};
   // The archive scan verifies every PDF DB reference and Office binary,
   // so unknown stores never appear as an empty installation.
   try{
    const files=await inspectExtraArchives(db);
    archives={reportPdfs:files.pdf.length,officeReports:files.office.length,
     officeTemplates:files.templates.length,state:"verified"};
   }catch{/* Missing or damaged archives must not grant reset safety. */}
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
  privateDocuments,backups,archives,
  risks:RESET_RISKS,
  confirmationRequired:RESET_CONFIRMATION,
  canExecute:false,blocked:true};
}
