/**
 * SMN-40 — audit sémantique conservateur des deux preuves REC-04.
 * Aucune valeur personnelle/clé/nom d'équipe/table métier libre dans la sortie.
 * Uniquement pg_catalog, information_schema et agrégats anonymisés en READ ONLY.
 */
import {Client} from "pg";
import {resolve} from "node:path";
import {installedDatabaseUri} from "../src/server/auth/database";
import {safePrivacyScope} from "./smn-40-isolated-privacy-audit";
import {COLLECTIVE_FAMILIES} from "../src/server/backup/collective-retention-policy";
const FIRST="smn_restore_test_latest_backup_20261111";
const SECOND="smn_restore_test_latest_compare_20261111";
const BASE="smn_restore_test_rec04_sandbox";
const norm=(p:string)=>resolve(p).replaceAll("\\","/").replace(/\/$/,"").toLowerCase();
const FAMILY_NAMES={
 "velocity":/velocity|story_point|sprint_metric/i,
 "capacity":/capacity|member_assignment|working_day|absence/i,
 "story-points-per-day":/story.point|spjh|productivity|indicator/i,
 "sprint-report":/sprint|report|ceremon|cycle/i,
 "indicator-v33":/indicator/i,
 "dashboard-builder":/dashboard|layout|widget/i,
 "frozen-snapshot":/snapshot|histor|archive|revision/i
} as const;
type Col={table_name:string;column_name:string;udt_name:string};
type Fk={source:string;target:string};
type Schema={columns:Col[];foreignKeys:Fk[];tables:string[]};
export function parseSemanticArgs(args:readonly string[]){
 if(args.length===1&&args[0]==="--check")return true;
 throw Error("semantic-check-only");
}
const bounded=(n:number)=>Number.isSafeInteger(n)&&n>=0&&n<=1000;
export function assessSemanticCatalog(schema:Schema){
 const names=new Set(schema.tables);
 if(names.size!==schema.tables.length||names.size<1||names.size>1000)
  throw Error("semantic-schema-unverified");
 const columns=new Map<string,Set<string>>();
 for(const col of schema.columns){
  if(!names.has(col.table_name))throw Error("semantic-schema-unverified");
  const set=columns.get(col.table_name)??new Set<string>();
  set.add(col.column_name);columns.set(col.table_name,set);
 }
 const has=(table:string,col:string)=>columns.get(table)?.has(col)??false;
 const familyTables=COLLECTIVE_FAMILIES.map(family=>{
  const matches=schema.tables.filter(t=>FAMILY_NAMES[family].test(t));
  const personalLinks=matches.filter(t=>[...columns.get(t)??[]]
   .some(c=>/(^|_)(member|account|user|actor|author|employee|assignee|owner)(_id|_name)?$/.test(c))).length;
  const jsonFields=matches.filter(t=>schema.columns.some(c=>c.table_name===t&&
   (c.udt_name==="json"||c.udt_name==="jsonb"))).length;
  return {family,matchingTables:matches.length,
   personalLinkTableSignals:personalLinks,jsonTableSignals:jsonFields,
   review:"required" as const,retentionAuthorized:false as const};
 });
 const connected=new Set<string>();
 for(const edge of schema.foreignKeys){
  if(names.has(edge.source)&&names.has(edge.target)){
   connected.add(edge.source);connected.add(edge.target);
  }
 }
 const teamSprints=has("smn_sprint","team_id")&&has("smn_sprint","id");
 const assignments=has("smn_member_assignment","team_id")&&
  has("smn_member_assignment","member_id")&&
  has("smn_member_assignment","start_on")&&
  has("smn_member_assignment","end_on");
 const metrics=has("smn_indicator_manual_value","team_id")&&
  has("smn_indicator_computed_result","team_id")&&
  has("smn_indicator_definition","id");
 return {tables:schema.tables.length,
  columns:schema.columns.length,foreignKeys:schema.foreignKeys.length,
  tablesReferencedByForeignKeys:connected.size,
  tablesWithoutDeclaredForeignKeyConnections: names.size-connected.size,
  coreRelations:{teamSprints,memberAssignments:assignments,indicatorV33:metrics},
  families:familyTables,semanticMappingComplete:false as const};
}
export function cohortRiskBuckets(cohorts:readonly number[]){
 if(cohorts.some(x=>!bounded(x)))throw Error("cohort-count-invalid");
 return {teamCount:cohorts.length,empty:cohorts.filter(x=>x===0).length,
  singleMember:cohorts.filter(x=>x===1).length,
  twoToFour:cohorts.filter(x=>x>=2&&x<=4).length,
  fiveOrMore:cohorts.filter(x=>x>=5).length,
  risk:"not-excluded" as const};
}
async function inspect(uri:string,expectedDir:string,expectedDb:string){
 const db=new Client({connectionString:uri,connectionTimeoutMillis:3500,
  statement_timeout:120000,application_name:"smn40-semantic-readonly"});
 try{
  await db.connect();
  await db.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const meta=await db.query<{ver:string;dir:string;name:string;schema:number}>(`
   SELECT current_setting('server_version') AS ver,current_setting('data_directory') AS dir,
    current_database() AS name,
    (SELECT schema_version FROM public.smn_installation WHERE id='singleton') AS schema`);
  if(meta.rows.length!==1||!meta.rows[0].ver.startsWith("18.")||
   norm(meta.rows[0].dir)!==norm(expectedDir)||
   meta.rows[0].name!==expectedDb||meta.rows[0].schema!==33)
   throw Error("semantic-identity-mismatch");
  const tables=(await db.query<{tablename:string}>(`
   SELECT tablename FROM pg_catalog.pg_tables
   WHERE schemaname='public' ORDER BY tablename`)).rows.map(x=>x.tablename);
  const columns=(await db.query<Col>(`
   SELECT table_name,column_name,udt_name FROM information_schema.columns
   WHERE table_schema='public' ORDER BY table_name,ordinal_position`)).rows;
  const foreignKeys=(await db.query<Fk>(`
   SELECT DISTINCT src.relname AS source,dst.relname AS target
   FROM pg_catalog.pg_constraint fk
   JOIN pg_catalog.pg_class src ON src.oid=fk.conrelid
   JOIN pg_catalog.pg_namespace ns ON ns.oid=src.relnamespace
   JOIN pg_catalog.pg_class dst ON dst.oid=fk.confrelid
   WHERE fk.contype='f' AND ns.nspname='public'
   ORDER BY source,target`)).rows;
  const assessment=assessSemanticCatalog({tables,columns,foreignKeys});
  if(!assessment.coreRelations.memberAssignments||
   !assessment.coreRelations.teamSprints||!assessment.coreRelations.indicatorV33)
   throw Error("semantic-core-schema-missing");
  // Historical overlap: distinct assigned members per sprint interval.
  // Only integer group sizes cross the DB boundary, never member/team IDs.
  const cohortRows=(await db.query<{headcount:number}>(`
   SELECT count(DISTINCT ma.member_id)::integer AS headcount
   FROM public.smn_sprint s
   LEFT JOIN public.smn_member_assignment ma
     ON ma.team_id=s.team_id
    AND ma.start_on<=s.end_at::date
    AND (ma.end_on IS NULL OR ma.end_on>=s.start_at::date)
   GROUP BY s.id`)).rows;
  const teamRows=(await db.query<{headcount:number}>(`
   SELECT count(DISTINCT ma.member_id)::integer AS headcount
   FROM public.smn_team t
   LEFT JOIN public.smn_member_assignment ma ON ma.team_id=t.id
   GROUP BY t.id`)).rows;
  const outcome={assessment,
   sprintCohorts:cohortRiskBuckets(cohortRows.map(x=>x.headcount)),
   teamHistoricalCohorts:cohortRiskBuckets(teamRows.map(x=>x.headcount))};
  await db.query("ROLLBACK");
  return outcome;
 }finally{
  await db.query("ROLLBACK").catch(()=>undefined);
  await db.end().catch(()=>undefined);
 }
}
export function compareSemanticResults(a:Awaited<ReturnType<typeof inspect>>,
 b:Awaited<ReturnType<typeof inspect>>){
 return {equivalent:JSON.stringify(a)===JSON.stringify(b),
  first:a,signalDifferenceDetected:JSON.stringify(a)!==JSON.stringify(b),
  differencesDisclosed:false as const};
}
async function main(){
 parseSemanticArgs(process.argv.slice(2));
 if(!process.env.SMN_DATABASE_URL){
  try{process.loadEnvFile(".env.local");}catch{/* none */}
 }
 const url=process.env.SMN40_REC04_DATABASE_URL;
 const dir=process.env.SMN40_REC04_CLUSTER_DIR;
 if(!url||!dir)throw Error("isolated-connection-unconfigured");
 if(!safePrivacyScope(url,await installedDatabaseUri(),dir))
  throw Error("isolated-scope-denied");
 const admin=new URL(url);admin.pathname="/postgres";
 const maintenance=new Client({connectionString:admin.toString(),connectionTimeoutMillis:3500,
  statement_timeout:15000,application_name:"smn40-semantic-maintenance-readonly"});
 try{
  await maintenance.connect();await maintenance.query("BEGIN TRANSACTION READ ONLY");
  const observed=await maintenance.query<{dir:string;version:string}>(`
   SELECT current_setting('data_directory') AS dir,
    current_setting('server_version') AS version`);
  if(norm(observed.rows[0]?.dir??"")!==norm(dir)||
   !observed.rows[0]?.version.startsWith("18."))
   throw Error("isolated-cluster-unverified");
  const found=await maintenance.query<{datname:string}>(`
   SELECT datname FROM pg_catalog.pg_database WHERE datname=ANY($1::text[])`,
   [[BASE,FIRST,SECOND]]);
  if(new Set(found.rows.map(x=>x.datname)).size!==3)
   throw Error("restored-evidence-databases-missing");
  await maintenance.query("ROLLBACK");
 }finally{
  await maintenance.query("ROLLBACK").catch(()=>undefined);
  await maintenance.end().catch(()=>undefined);
 }
 const firstUrl=new URL(url);firstUrl.pathname="/"+FIRST;
 const secondUrl=new URL(url);secondUrl.pathname="/"+SECOND;
 const a=await inspect(firstUrl.toString(),dir,FIRST);
 const b=await inspect(secondUrl.toString(),dir,SECOND);
 const result=compareSemanticResults(a,b);
 process.stdout.write(JSON.stringify({
  mode:"semantic-isolated-read-only",
  semanticComparisonEquivalent:result.equivalent,
  tableCount:a.assessment.tables,
  catalog:a.assessment,
  sprintCohortSignals:a.sprintCohorts,
  historicalTeamCohortSignals:a.teamHistoricalCohorts,
  cohortMethod:"sprint-date-overlapping-assignments-and-team-history; not effective allocation or individual attendance",
  crossReportReidentificationExcluded:false,
  perCycleIndividualInferencesExcluded:false,
  jsonContentReviewed:false,
  unmappedSemanticRelationsQualified:false,
  reviewRequired:true,
  isolatedDatabasesModified:false,
  restorationAuthorized:false
 },null,2)+"\n");
 if(!result.equivalent)process.exitCode=2;
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-40-isolated-semantic-audit.ts"))
 main().catch((e:unknown)=>{
  const known=new Set(["semantic-check-only","isolated-connection-unconfigured",
   "isolated-scope-denied","semantic-identity-mismatch",
   "isolated-cluster-unverified","restored-evidence-databases-missing",
   "semantic-core-schema-missing","semantic-schema-unverified","cohort-count-invalid"]);
  const reason=e instanceof Error&&known.has(e.message)?e.message:"unverified";
  process.stderr.write(JSON.stringify({mode:"semantic-isolated-read-only",
   status:"blocked",reason,isolatedDatabasesModified:false,
   restorationAuthorized:false})+"\n");process.exitCode=2;
 });
