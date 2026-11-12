/**
 * Read-only offline post-cutover verification. No session or database writes,
 * no maintenance release, and no password/identity data in the output.
 * The operator must independently verify source retirement and explicitly
 * restart the application with an empty in-memory session store.
 */
import {Client} from "pg";
import {lstat,readFile} from "node:fs/promises";
import {join,isAbsolute,resolve} from "node:path";
import {backupRootPath} from "../src/server/backup/runner";
import {readFreshCutoverJournal} from "../src/server/backup/fresh-cutover-journal";
import {inspectOfflineRestoreMaintenance} from "../src/server/backup/restore-maintenance";
import {existingManagedUri} from "../src/server/bootstrap/portable";

export async function inspectOfflineCutoverJournal(journalPath:string){
 if(!isAbsolute(journalPath)||resolve(journalPath)!==journalPath||
  !/^migration-[a-f0-9]{12}\.jsonl$/.test(journalPath.split(/[\\/]/).at(-1)??"")||
  resolve(journalPath)!==resolve(join(process.cwd(),"data","migration-audit",
   journalPath.split(/[\\/]/).at(-1)??"")))
  throw Error("migration-postcheck-journal-path-invalid");
 const fence=await inspectOfflineRestoreMaintenance();
 if(fence?.purpose!=="offline-restore")throw Error("migration-postcheck-maintenance-required");
 const keyFile=join(backupRootPath(),".backup-key");
 const st=await lstat(keyFile);
 if(!st.isFile()||st.isSymbolicLink()||st.size!==32)
  throw Error("migration-postcheck-key-invalid");
 const key=await readFile(keyFile);
 try {
  const events=await readFreshCutoverJournal(journalPath,key);
  const last=events.at(-1);
  if(last?.stage!=="verified")throw Error("migration-postcheck-cutover-not-verified");
  const uri=await existingManagedUri();
  if(!uri)throw Error("migration-postcheck-owned-runtime-unavailable");
  const maintenance=new URL(uri);maintenance.pathname="/postgres";
  const db=new Client({connectionString:maintenance.toString(),
   connectionTimeoutMillis:3500,statement_timeout:12000});
  try {
   await db.connect();
   const names=await db.query<{datname:string}>(
    "SELECT datname FROM pg_catalog.pg_database "+
    "WHERE datname=ANY($1::text[])",[ "smn",last.rollbackDb,last.candidateDb ]);
   const found=new Set(names.rows.map(r=>r.datname));
   if(!found.has("smn")||!found.has(last.rollbackDb)||found.has(last.candidateDb))
    throw Error("migration-postcheck-database-state-invalid");
   const sessions=await db.query<{n:string}>(
    "SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity "+
    "WHERE datname=ANY($1::text[])",["smn",last.rollbackDb]);
   if(sessions.rows[0]?.n!=="0")throw Error("migration-postcheck-sessions-active");
   return {mode:"offline-cutover-postcheck" as const,
    archiveId:last.archiveId,stage:"verified" as const,
    rollbackPreserved:true as const,maintenanceMustRemain:true as const,
    allSessionsMustBeReauthenticated:true as const,
    independentOperatorSignoffRequired:true as const,
    sourceRetirementVerified:false as const,
    maintenanceReleased:false as const};
  }finally{await db.end().catch(()=>undefined);}
 }finally{key.fill(0);}
}
async function main(){
 const args=process.argv.slice(2);
 if(args.length!==2||args[0]!=="--journal")throw Error("migration-postcheck-arguments-invalid");
 const result=await inspectOfflineCutoverJournal(args[1]);
 process.stdout.write(JSON.stringify(result)+"\n");
}
if(process.argv[1]?.replaceAll("\\","/").match(/\/smn-40-cutover-postcheck\.(?:ts|mjs)$/))
 main().catch(()=>{
  process.stderr.write(JSON.stringify({status:"blocked",
   reason:"migration-postcheck-unverified",maintenanceMustRemain:true})+"\n");
  process.exitCode=2;
 });
