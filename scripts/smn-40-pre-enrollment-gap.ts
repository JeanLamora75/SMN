/**
 * SMN-40 — Audit non destructif de la fenêtre entre archive et enrôlement.
 * Signale les traces observées sans prétendre démontrer l'absence de suppressions
 * non journalisées. Aucune identité, aucun chemin ni secret n'est émis.
 * Usage: pnpm exec tsx scripts/smn-40-pre-enrollment-gap.ts --archive UUID --check
 */
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {previewBackupReadOnly} from "../src/server/backup/restore-audit-preview";
import {readErasureLedger} from "../src/server/backup/erasure-ledger";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parseGapArgs(args:readonly string[]):string{
 if(args.length===3&&args[0]==="--archive"&&UUID.test(args[1])&&args[2]==="--check")
  return args[1];
 throw Error("smn40-gap-arguments-invalid");
}
const sources=[
 {key:"member-removal",table:"smn_member_removal_audit",date:"removed_at"},
 {key:"exceptional-erasure",table:"smn_privacy_erasure_receipt",date:"committed_at"}
] as const;
export type GapSource={key:string;status:"observed"|"unavailable"|"unverifiable";count:number|null};
export function interpretGapObservations(items:readonly GapSource[]){
 return {historicalAbsenceProven:false as const,
  auditCoverage:"partial" as const,
  outcome:items.some(x=>x.status==="unavailable"||x.status==="unverifiable")?
   "incomplete-sources" as const:
   items.some(x=>x.count!==null&&x.count>0)?
    "recorded-operations-found" as const:"no-recorded-operations-found" as const};
}
export async function inspectGapRecords(db:Pick<Client,"query">,start:string,end:string):Promise<GapSource[]>{
 const output:GapSource[]=[];
 for(const source of sources){
  const schema=await db.query<{present:boolean;date_column:boolean}>(`
   SELECT to_regclass($1) IS NOT NULL AS present,
    EXISTS(SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$2 AND column_name=$3) AS date_column`,
    ["public."+source.table,source.table,source.date]);
  if(schema.rows[0]?.present!==true||schema.rows[0]?.date_column!==true){
   output.push({key:source.key,status:"unavailable",count:null});continue;
  }
  // Column and table names come exclusively from the constant allowlist.
  const result=await db.query<{n:string}>(`
   SELECT count(*)::text AS n FROM public.${source.table}
   WHERE ${source.date}>$1::timestamptz AND ${source.date}<$2::timestamptz`,
   [start,end]);
  const n=Number(result.rows[0]?.n);
  output.push(Number.isSafeInteger(n)&&n>=0?
   {key:source.key,status:"observed",count:n}:
   {key:source.key,status:"unverifiable",count:null});
 }
 return output;
}
async function main(){
 const id=parseGapArgs(process.argv.slice(2));
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const preview=await previewBackupReadOnly(id);
 const start=preview.archive.createdAt;
 if(preview.archive.status!=="verified"||!preview.archive.integrityVerified||!start)
  throw Error("smn40-gap-archive-unverified");
 const ledger=await readErasureLedger();
 const end=ledger.coverageStart;
 if(!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end))||
  new Date(start).toISOString()!==start||new Date(end).toISOString()!==end||
  start>=end)throw Error("smn40-gap-interval-invalid");
 const uri=await installedDatabaseUri();
 const u=new URL(uri);
 if(!["postgres:","postgresql:"].includes(u.protocol)||
  !["localhost","127.0.0.1","[::1]","::1"].includes(u.hostname)||
  !/^smn(?:_[a-z0-9_-]+)?$/i.test(decodeURIComponent(u.pathname.slice(1)))||
  u.search||u.hash)throw Error("smn40-gap-target-invalid");
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:15000,application_name:"smn40-gap-readonly"});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const records=await inspectGapRecords(db,start,end);
  await db.query("ROLLBACK");
  process.stdout.write(JSON.stringify({
   mode:"read-only",archiveId:id,interval:{archiveCreatedAt:start,ledgerCoverageStart:end},
   sources:records,assessment:interpretGapObservations(records),
   archiveContentReview:"not-qualified",
   collectiveDataReview:"not-qualified",
   windowsCutover:"not-qualified",
   restorationAuthorized:false
  },null,2)+"\n");
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-40-pre-enrollment-gap.ts"))
 main().catch(()=>{
  process.stderr.write("SMN-40 : audit de période indisponible, aucune restauration effectuée.\n");
  process.exitCode=2;
 });
