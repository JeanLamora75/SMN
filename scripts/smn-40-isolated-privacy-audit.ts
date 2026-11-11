/**
 * SMN-40: audit prudent, non destructif, des deux restaurations REC-04.
 * Métadonnées de schéma, indices de divulgation et empreintes; aucun enregistrement
 * métier, identifiant, secret, hash de ligne, ni nom libre en sortie.
 * Ne peut pas prouver l'anonymat ou autoriser la restauration active.
 */
import {Client} from "pg";
import {resolve} from "node:path";
import {installedDatabaseUri} from "../src/server/auth/database";
import {fingerprintPublicTables,compareFingerprints} from "../src/server/backup/restore-row-fingerprint";
import {COLLECTIVE_FAMILIES,type CollectiveFamily} from "../src/server/backup/collective-retention-policy";

const FIRST="smn_restore_test_latest_backup_20261111";
const SECOND="smn_restore_test_latest_compare_20261111";
const BASE="smn_restore_test_rec04_sandbox";
const FAMILY_RULES:Readonly<Record<CollectiveFamily,RegExp>>={
 "velocity":/velocity|story_point|sprint_metric/i,
 "capacity":/capacity|availability|working_day|member_assignment/i,
 "story-points-per-day":/story.point|point.*day|spjh|productivity/i,
 "sprint-report":/sprint|report|ceremon|iteration|cycle/i,
 "indicator-v33":/indicator|metric|formula/i,
 "dashboard-builder":/dashboard|widget|layout/i,
 "frozen-snapshot":/snapshot|histor|archive|revision|freeze/i
};
const IDENT=/^(member|person|user|employee|assignee|owner|author|actor|email|phone|name|first_name|last_name|participant|contact)(_|$)/i;
const FREE_TEXT=/(description|comment|notes|content|payload|metadata|json|body|text|summary|title|freeform)/i;
type Column={table_name:string;column_name:string;data_type:string;udt_name:string};
type Catalog=Readonly<{table:string;identifiers:boolean;freeText:boolean;json:boolean}>;
const normalized=(s:string)=>resolve(s).replaceAll("\\","/").replace(/\/$/,"").toLowerCase();
export function parsePrivacyAuditArgs(args:readonly string[]){
 if(args.length===1&&args[0]==="--check")return true;
 throw Error("isolated-privacy-check-only");
}
export function safePrivacyScope(rec04:string,live:string,clusterDir:string){
 try{
  const a=new URL(rec04),b=new URL(live);
  return !!clusterDir&&resolve(clusterDir)===clusterDir&&
   ["postgres:","postgresql:"].includes(a.protocol)&&
   a.hostname==="127.0.0.1"&&a.port==="57186"&&
   decodeURIComponent(a.pathname)==="/"+BASE&&!!a.username&&!!a.password&&
   !a.search&&!a.hash&&
   ["postgres:","postgresql:"].includes(b.protocol)&&
   b.hostname==="127.0.0.1"&&b.port!=="57186"&&
   decodeURIComponent(b.pathname)==="/smn"&&!!b.username&&!!b.password&&
   b.username!==a.username&&!b.username.startsWith("smn_restore_test_")&&
   !b.search&&!b.hash;
 }catch{return false;}
}
export function summarizePrivacySignals(
 catalog:readonly Catalog[],counts:ReadonlyMap<string,number>){
 const families=COLLECTIVE_FAMILIES.map(family=>{
  const matches=catalog.filter(t=>FAMILY_RULES[family].test(t.table));
  const populated=matches.filter(t=>(counts.get(t.table)??0)>0);
  const identifiers=populated.filter(t=>t.identifiers).length;
  const freeText=populated.filter(t=>t.freeText).length;
  const json=populated.filter(t=>t.json).length;
  const sparse=populated.filter(t=>(counts.get(t.table)??0)<5).length;
  return {family,matchingTables:matches.length,populatedTables:populated.length,
   tablesWithIdentifierFields:identifiers,
   tablesWithFreeTextFields:freeText,
   tablesWithOpaqueJsonFields:json,
   smallRecordTableSignals:sparse,
   cohortSizeRisk:"not-measured" as const,
   crossReportLinkabilityRisk:"not-excluded" as const,
   manualReview:"required" as const,
   retentionAuthorized:false as const};
 });
 return {families,allSevenQualified:false as const,
  caveat:"Small record counts are NOT person cohort sizes; field patterns are indicators, not proof."};
}
function catalogFromColumns(cols:readonly Column[]):Catalog[]{
 const map=new Map<string,Column[]>();
 for(const col of cols){
  if(!/^[a-z_][a-z0-9_]{0,62}$/.test(col.table_name)||
   !/^[a-z_][a-z0-9_]{0,62}$/.test(col.column_name))
   throw Error("catalog-invalid-name");
  const items=map.get(col.table_name)??[];items.push(col);map.set(col.table_name,items);
 }
 return [...map.entries()].map(([table,items])=>({
  table,identifiers:items.some(c=>IDENT.test(c.column_name)),
  freeText:items.some(c=>FREE_TEXT.test(c.column_name)),
  json:items.some(c=>c.udt_name==="jsonb"||c.udt_name==="json")
 }));
}
async function snapshot(uri:string,expected:string){
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:120000,application_name:"smn40-isolated-privacy-readonly"});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const r=await db.query<{version:string;directory:string;schema:number;name:string}>(`
   SELECT current_setting('server_version') AS version,
    current_setting('data_directory') AS directory,current_database() AS name,
    (SELECT schema_version FROM public.smn_installation WHERE id='singleton') AS schema`);
  if(!r.rows[0]?.version.startsWith("18.")||r.rows[0]?.schema!==33||
   normalized(r.rows[0].directory)!==normalized(expected)||
   ![FIRST,SECOND].includes(r.rows[0].name))
   throw Error("isolated-snapshot-identity-mismatch");
  const columns=await db.query<Column>(`
   SELECT c.table_name,c.column_name,c.data_type,c.udt_name
   FROM information_schema.columns c
   JOIN pg_catalog.pg_tables t ON t.schemaname='public' AND t.tablename=c.table_name
   WHERE c.table_schema='public' ORDER BY c.table_name,c.ordinal_position`);
  const fingerprints=await fingerprintPublicTables(db);
  const catalog=catalogFromColumns(columns.rows);
  if(fingerprints.tables.length!==catalog.length||
   fingerprints.tables.some(t=>!catalog.some(c=>c.table===t.table)))
   throw Error("schema-inventory-incomplete");
  await db.query("ROLLBACK");
  return {fingerprints,catalog};
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
async function main(){
 parsePrivacyAuditArgs(process.argv.slice(2));
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* optional */}
 }
 const rec04=process.env.SMN40_REC04_DATABASE_URL;
 const dir=process.env.SMN40_REC04_CLUSTER_DIR;
 if(!rec04||!dir)throw Error("isolated-connection-unconfigured");
 const live=await installedDatabaseUri();
 if(!safePrivacyScope(rec04,live,dir))throw Error("isolated-scope-denied");
 const admin=new URL(rec04);admin.pathname="/postgres";
 const db=new Client({connectionString:admin.toString(),connectionTimeoutMillis:3500,
  statement_timeout:10000,application_name:"smn40-privacy-cluster-check"});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION READ ONLY");
  const state=await db.query<{directory:string;version:string}>(`
   SELECT current_setting('data_directory') AS directory,
    current_setting('server_version') AS version`);
  if(normalized(state.rows[0]?.directory??"")!==normalized(dir)||
   !state.rows[0]?.version.startsWith("18."))
   throw Error("physical-cluster-mismatch");
  const existing=await db.query<{datname:string}>(`
   SELECT datname FROM pg_catalog.pg_database WHERE datname=ANY($1::text[])`,
   [[BASE,FIRST,SECOND]]);
  if(existing.rows.length!==3||
   new Set(existing.rows.map(x=>x.datname)).size!==3)
   throw Error("restored-evidence-databases-missing");
  await db.query("ROLLBACK");
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
 const url1=new URL(rec04);url1.pathname="/"+FIRST;
 const url2=new URL(rec04);url2.pathname="/"+SECOND;
 const a=await snapshot(url1.toString(),dir);
 const b=await snapshot(url2.toString(),dir);
 const differences=compareFingerprints(a.fingerprints,b.fingerprints);
 const byTable=new Map(a.fingerprints.tables.map(t=>[t.table,t.rows]));
 const summary=summarizePrivacySignals(a.catalog,byTable);
 // Only categories and counts leave the process; no raw names or data.
 const outcome={
  mode:"isolated-privacy-read-only",
  firstAndSecondRestorationsCompared:true,
  tablesAudited:a.fingerprints.tables.length,
  equivalentRowsAndTables:differences.equivalent,
  differingTablesCount:differences.differences.length,
  schemaMetadataConsistent:JSON.stringify(a.catalog)===JSON.stringify(b.catalog),
  familyInventory:summary,
  unmappedTableCount:a.catalog.filter(c=>
   !COLLECTIVE_FAMILIES.some(f=>FAMILY_RULES[f].test(c.table))).length,
  coverage:"heuristic-not-exhaustive",
  directAndIndirectReidentificationExcluded:false,
  historicalErasureAbsenceProven:false,
  externalCopiesReconciled:false,
  humanOfficeReviewComplete:false,
  databasesModifiedByThisAudit:false,
  productionCutoverQualified:false,
  restorationAuthorized:false
 };
 process.stdout.write(JSON.stringify(outcome,null,2)+"\n");
 if(!differences.equivalent||!outcome.schemaMetadataConsistent)process.exitCode=2;
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-40-isolated-privacy-audit.ts"))
 main().catch((err:unknown)=>{
  const known=new Set(["isolated-privacy-check-only","isolated-connection-unconfigured",
   "isolated-scope-denied","physical-cluster-mismatch",
   "restored-evidence-databases-missing","isolated-snapshot-identity-mismatch",
   "schema-inventory-incomplete","catalog-invalid-name",
   "fingerprint-table-too-large"]);
  const reason=err instanceof Error&&known.has(err.message)?err.message:"unverified";
  process.stderr.write(JSON.stringify({mode:"isolated-privacy-read-only",
   status:"blocked",reason,databasesModifiedByThisAudit:false,
   restorationAuthorized:false})+"\n");
  process.exitCode=2;
 });
