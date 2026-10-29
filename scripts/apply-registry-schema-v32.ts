import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {registryCoreStatements} from "./apply-registry-core-v32";
import {registryExtensionStatements} from "./apply-registry-extensions-v32";
import {outcomeDDL} from "./apply-meeting-outcome-schema-v32";

/** Point d'entrée unique du lot Registres v32 : transaction atomique et non destructive. */
const expectedTables=[
 "smn_registry_item","smn_registry_item_audit","smn_registry_linked_request",
 "smn_registry_relation","smn_registry_relation_audit",
 "smn_registry_comment","smn_registry_comment_revision",
 "smn_risk_assessment","smn_risk_assessment_audit","smn_risk_roam","smn_risk_roam_audit",
 "smn_registry_cycle_link","smn_registry_cycle_link_audit",
 "smn_action_link","smn_action_link_audit","smn_decision_detail","smn_decision_detail_audit",
 "smn_dependency_parties","smn_dependency_parties_audit",
 "smn_dependency_vigilance","smn_dependency_vigilance_audit",
 "smn_fact_selection","smn_fact_selection_audit","smn_registry_deadline_settings",
 "smn_automatic_highlight","smn_calendar_meeting_outcome_link"
] as const;
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-registry-schema-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,40)");
   const install=await db.query<{schema_version:number;state:string}>(
    "SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(install.rows.length!==1||install.rows[0].schema_version!==32||install.rows[0].state!=="initialized")
    throw Error("Installation v32 initialisée requise");
   const base=await db.query<{present:boolean}>(`SELECT to_regclass('public.smn_team') IS NOT NULL
      AND to_regclass('public.smn_account') IS NOT NULL
      AND to_regclass('public.smn_sprint') IS NOT NULL AS present`);
   if(!base.rows[0]?.present)throw Error("Socle équipes et sprints requis avant les Registres");
   for(const sql of [...registryCoreStatements,...registryExtensionStatements,...outcomeDDL])await db.query(sql);
   const found=await db.query<{relname:string}>(`SELECT c.relname FROM pg_class c
     JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname=ANY($1::text[])`,[expectedTables]);
   const installed=new Set(found.rows.map(row=>row.relname));
   for(const name of expectedTables)if(!installed.has(name))throw Error("Table Registres manquante: "+name);
   const indexes=await db.query<{name:string}>(`SELECT indexname AS name FROM pg_indexes
      WHERE schemaname='public' AND indexname=ANY($1::text[])`,
      [["smn_registry_item_team_type_date","smn_registry_comment_item_date","smn_calendar_meeting_outcome_by_event"]]);
   const names=new Set(indexes.rows.map(row=>row.name));
   for(const name of ["smn_registry_item_team_type_date","smn_registry_comment_item_date","smn_calendar_meeting_outcome_by_event"])
    if(!names.has(name))throw Error("Index Registres manquant: "+name);
   await db.query("COMMIT");
  }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
 }finally{await db.end();}
 console.log("Registres v32: noyau, extensions et résultats de réunion matérialisés atomiquement");
}
if(process.argv[1]?.includes("apply-registry-schema-v32"))main().catch(e=>{console.error(e);process.exitCode=1});
