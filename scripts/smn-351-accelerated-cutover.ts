/** Explicitly authorized development-only SMN-351 cutover. Backup and restore before DROP. */
import {randomBytes} from "node:crypto";
import {mkdirSync,statSync} from "node:fs";
import {join,resolve} from "node:path";
import {homedir} from "node:os";
import {spawnSync} from "node:child_process";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {inventoryRetiredCandidates,retiredCandidates} from "./smn-351-candidate-inventory";
import {auditApplicationDependencies} from "./smn-351-app-dependencies";

async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm db:cutover:smn-351 (explicit --apply)");
 const u=new URL(await installedDatabaseUri());
 if(!["postgres:","postgresql:"].includes(u.protocol)||!["localhost","127.0.0.1","::1"].includes(u.hostname)||u.pathname!=="/smn")
  throw Error("Only local /smn development database is allowed");
 if(auditApplicationDependencies().runtimeBlockers.length)throw Error("Active legacy SQL blockers detected");
 const backupRoot=resolve(process.env.SMN_351_BACKUP_DIR||join(homedir(),"SMN-backups"));
 mkdirSync(backupRoot,{recursive:true});
 const suffix=randomBytes(6).toString("hex"),stamp=new Date().toISOString().replace(/[:.]/g,"-");
 const backup=join(backupRoot,"smn-before-351-"+stamp+"-"+suffix+".dump");
 const copy="smn_351_cutover_"+suffix;
 const adminUri=new URL(u);adminUri.pathname="/postgres";
 const copyUri=new URL(u);copyUri.pathname="/"+copy;
 const env:NodeJS.ProcessEnv={...process.env,PGHOST:u.hostname,PGPORT:u.port||"5432",
  PGUSER:decodeURIComponent(u.username),PGPASSWORD:decodeURIComponent(u.password)};
 const cli=(binary:string,args:string[])=>{
  const p=spawnSync(binary,args,{env,encoding:"utf8",windowsHide:true,timeout:240000,maxBuffer:2*1024*1024});
  if(p.error||p.status!==0)throw Error(binary+" failed: "+(p.error?.message??p.stderr?.slice(0,700)??"unknown"));
 };
 const db=new Client({connectionString:u.toString(),connectionTimeoutMillis:3500,statement_timeout:60000});
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});
 let created=false,dropCommitted=false;
 await db.connect();
 try{
  const v=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton'");
  if(v.rows[0]?.schema_version!==33||v.rows[0]?.state!=="initialized")throw Error("Initialized v33 required");
  await db.query("BEGIN READ ONLY");
  const before=await inventoryRetiredCandidates(db);
  await db.query("COMMIT");
  if(before.some(x=>!x.exists))throw Error("One or more candidate tables already missing");
  cli(process.env.SMN_PG_DUMP_PATH||"pg_dump",["--format=custom","--no-owner","--no-privileges","--no-password","--dbname=smn","--file="+backup]);
  if(statSync(backup).size<1024)throw Error("Backup file unexpectedly small");
  await admin.connect();
  await admin.query('CREATE DATABASE "'+copy+'"');created=true;
  cli(process.env.SMN_PG_RESTORE_PATH||"pg_restore",["--exit-on-error","--no-owner","--no-privileges","--no-password","--dbname="+copy,backup]);
  const restored=new Client({connectionString:copyUri.toString(),connectionTimeoutMillis:3500,statement_timeout:60000});
  await restored.connect();
  try{
   const after=await inventoryRetiredCandidates(restored);
   if(JSON.stringify(after)!==JSON.stringify(before))throw Error("Restored legacy data differs from source");
   const check=await restored.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton'");
   if(check.rows[0]?.schema_version!==33)throw Error("Restored v33 version mismatch");
   await restored.query("BEGIN");
   try{
    for(const table of retiredCandidates)await restored.query('DROP TABLE public."'+table+'" RESTRICT');
    for(const table of retiredCandidates){
     const r=await restored.query<{present:boolean}>("SELECT to_regclass($1) IS NOT NULL AS present",["public."+table]);
     if(r.rows[0]?.present)throw Error("Candidate still exists after isolated drop");
    }
    await restored.query("ROLLBACK");
   }catch(e){await restored.query("ROLLBACK").catch(()=>undefined);throw e;}
  }finally{await restored.end();}
  // Serialize source verification and cutover in the same transaction.
  await db.query("BEGIN");
  try{
   for(const table of retiredCandidates)await db.query('LOCK TABLE public."'+table+'" IN ACCESS EXCLUSIVE MODE');
   const final=await inventoryRetiredCandidates(db);
   if(JSON.stringify(final)!==JSON.stringify(before))throw Error("Candidate content changed since backup");
   const check=await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton'");
   if(check.rows[0]?.schema_version!==33)throw Error("Version changed since backup");
   for(const table of retiredCandidates)await db.query('DROP TABLE public."'+table+'" RESTRICT');
   await db.query("COMMIT");dropCommitted=true;
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
  console.log(JSON.stringify({ok:true,cutover:"smn-351",removed:[...retiredCandidates],sourceRows:before.map(x=>({table:x.table,rows:x.rows})),backupPath:backup,backupRestoredAndVerified:true,isolatedDropTest:true,sourceDropCommitted:true}));
 }finally{
  await db.end().catch(()=>undefined);
  try{if(created)await admin.query('DROP DATABASE "'+copy+'" WITH (FORCE)');}
  finally{await admin.end().catch(()=>undefined);}
  if(!dropCommitted)console.error("Cutover NOT committed. Preserve backup at "+backup);
 }
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),"/").endsWith("/smn-351-accelerated-cutover.ts"))
 main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1;});
