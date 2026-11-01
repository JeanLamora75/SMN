import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";

const protectedObjects=[
 "smn_sprint_closure_snapshot","smn_kanban_closure","smn_kanban_capacity_opening",
 "smn_sprint_capacity","smn_sprint_capacity_kpis","smn_sprint_goal",
 "smn_sprint_ceremony","smn_sprint","smn_kanban_period",
 "smn_capacity_actual_override","smn_capacity_actual_override_history",
 "smn_capacity_actual_snapshot","smn_capacity_historical_quality",
 "smn_capacity_historical_quality_history","smn_capacity_initial_snapshot",
 "smn_capacity_period_override","smn_capacity_period_override_history",
 "smn_capacity_replanning","smn_capacity_replanning_history",
 "smn_capacity_settings","smn_capacity_settings_audit",
 "smn_company_capacity_recalc","smn_company_closure","smn_company_closure_history",
 "smn_exceptional_capacity_impact_history","smn_report_studio_archive_snapshot",
 "smn_sprint_capacity_kpi","smn_sprint_capacity_kpi_audit",
 "smn_sprint_capacity_trigger","smn_sprint_closure_audit",
 "smn_sprint_historical_actual_capacity","smn_sprint_historical_actual_capacity_audit",
 "smn_sprint_historical_capacity","smn_sprint_historical_capacity_audit",
 "smn_indicator_definition","smn_indicator_team_selection",
 "smn_indicator_display_preference","smn_indicator_manual_value",
 "smn_indicator_computed_result","smn_indicator_dependency",
 "smn_indicator_cycle_revision","smn_indicator_system_revision",
 "smn_indicator_team_grant"
] as const;
const legacyCandidates=[
 "smn_sprint_story_points","smn_sprint_ticket_counts",
 "smn_sprint_confidence_clarity","smn_sprint_indicator_scores",
 "smn_sprint_story_points_audit","smn_sprint_ticket_counts_audit"
] as const;

export async function auditLegacyIndicators(db:Client){
 const objects=await db.query<{name:string;kind:string}>(
  "SELECT c.relname AS name,c.relkind AS kind FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m') ORDER BY c.relname");
 const dependencies=await db.query<{object:string;dependent:string}>(
  "SELECT referred.relname AS object,dependent.relname AS dependent FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_class referred ON referred.oid=d.refobjid JOIN pg_catalog.pg_class dependent ON dependent.oid=d.objid WHERE referred.relnamespace='public'::regnamespace AND dependent.relnamespace='public'::regnamespace AND d.refobjid<>d.objid ORDER BY referred.relname,dependent.relname");
 const names=new Set(objects.rows.map(x=>x.name));
 const candidates=legacyCandidates.filter(x=>names.has(x)).map(name=>({name,dependentObjects:dependencies.rows.filter(x=>x.object===name).map(x=>x.dependent)}));
 const preserved=protectedObjects.filter(x=>names.has(x));
 const unknown=objects.rows.filter(x=>/indicator|story_points|ticket_counts|confidence_clarity|capacity|snapshot|closure/.test(x.name)&&!legacyCandidates.includes(x.name as typeof legacyCandidates[number])&&!protectedObjects.includes(x.name as typeof protectedObjects[number]));
 return {schemaVersion:(await db.query<{schema_version:number}>("SELECT schema_version FROM public.smn_installation WHERE id='singleton'")).rows[0]?.schema_version??null,candidates,preserved,unknown,destructiveOperationExecuted:false};
}
async function main(){
 if(process.argv.slice(2).join(" ")!=="--check")throw Error("Usage: pnpm exec tsx scripts/smn-351-legacy-audit.ts --check (read-only)");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:10000});
 await db.connect();
 try{await db.query("BEGIN READ ONLY");try{const report=await auditLegacyIndicators(db);await db.query("COMMIT");console.log(JSON.stringify(report,null,2));if(report.schemaVersion!==33)process.exitCode=2;}catch(e){await db.query("ROLLBACK");throw e;}}finally{await db.end();}
}
if(process.argv[1]?.replaceAll("\\","/").endsWith("/smn-351-legacy-audit.ts"))main().catch(e=>{console.error(e);process.exitCode=1;});
