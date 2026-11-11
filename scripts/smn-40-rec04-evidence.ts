/**
 * Read-only REC-04 observation of a previously restored isolated PG18 database.
 * An observed schema and verified source archive are separate evidence:
 * neither independently proves exact row-level equivalence or live rollback.
 */
import {Client} from "pg";
import {previewBackupReadOnly} from "../src/server/backup/restore-audit-preview";

const ARCHIVE="1a591fe3-f9c2-478f-a3fa-fdd7bfe37fb5";
const DB="smn_restore_test_rec04_sandbox";
const PORT="57186";
export function assessRec04Observation(input:{
 archiveStatus:string;archiveIntegrity:boolean;schema:number|null;
 pgVersion:string;tableCount:number;physicalClusterMatch:boolean;
 officeReports:number;officeTemplates:number;pdf:number;
}){
 return {
  sourceArchiveVerified:input.archiveStatus==="verified"&&input.archiveIntegrity,
  isolatedPg18Verified:input.pgVersion.startsWith("18.")&&input.physicalClusterMatch,
  restoredV33Observed:input.schema===33&&input.tableCount===192,
  officeComponentsPresent:input.officeReports===1&&input.officeTemplates===1&&input.pdf===0,
  snapshotRowEquivalenceProven:false as const,
  rollbackCutoverQualified:false as const,
  historicalErasureCoverageQualified:false as const,
  deploymentAuthorized:false as const
 };
}
async function main(){
 if(process.argv.slice(2).join(" ")!=="--check")
  throw Error("rec04-check-only");
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const uri=process.env.SMN40_REC04_DATABASE_URL;
 const expected=process.env.SMN40_REC04_CLUSTER_DIR;
 if(!uri||!expected)throw Error("rec04-isolated-connection-unconfigured");
 const url=new URL(uri);
 if(!["postgres:","postgresql:"].includes(url.protocol)||
  !["127.0.0.1","localhost","[::1]"].includes(url.hostname)||
  url.port!==PORT||decodeURIComponent(url.pathname)!=="/"+DB||
  url.search||url.hash)
  throw Error("rec04-isolated-connection-invalid");
 const normalize=(s:string)=>s.replaceAll(String.fromCharCode(92),"/")
  .replace(/\/$/,"").toLowerCase();
 const preview=await previewBackupReadOnly(ARCHIVE);
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:15000,application_name:"smn40-readonly-rec04"});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION REPEATABLE READ READ ONLY");
  const info=await db.query<{db:string;pg_version:string;cluster:string;schema:number;
   tables:string}>(`
    SELECT current_database() AS db,current_setting('server_version') AS pg_version,
      current_setting('data_directory') AS cluster,
      (SELECT schema_version FROM public.smn_installation WHERE id='singleton') AS schema,
      (SELECT count(*)::text FROM information_schema.tables
       WHERE table_schema='public' AND table_type='BASE TABLE') AS tables`);
  const state=info.rows[0];
  if(!state||state.db!==DB||normalize(state.cluster)!==normalize(expected))
   throw Error("rec04-physical-cluster-mismatch");
  const components=preview.archive.components;
  const count=(kind:string)=>components.filter(c=>c.kind===kind).length;
  const verdict=assessRec04Observation({
   archiveStatus:preview.archive.status,
   archiveIntegrity:preview.archive.integrityVerified,
   schema:state.schema,pgVersion:state.pg_version,
   tableCount:Number(state.tables),physicalClusterMatch:true,
   officeReports:count("office-report"),officeTemplates:count("office-template"),
   pdf:count("report-pdf")
  });
  process.stdout.write(JSON.stringify({mode:"read-only",archiveId:ARCHIVE,
   observedDatabase:DB,observedPort:PORT,
   restoredDatabase:{pgMajor:state.pg_version.split(".")[0],
    schemaVersion:state.schema,tables:Number(state.tables)},
   archive:{status:preview.archive.status,
    componentCounts:{officeReports:count("office-report"),
     officeTemplates:count("office-template"),pdf:count("report-pdf")}},
   verdict},null,2)+"\n");
  await db.query("ROLLBACK");
  if(!verdict.sourceArchiveVerified||!verdict.isolatedPg18Verified||
   !verdict.restoredV33Observed||!verdict.officeComponentsPresent)process.exitCode=2;
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
if(process.argv[1]?.replaceAll(String.fromCharCode(92),"/")
 .endsWith("/smn-40-rec04-evidence.ts"))
 main().catch(()=>{
  process.stderr.write("SMN-40 REC-04 evidence unavailable; no restore performed.\n");
  process.exitCode=2;
 });
