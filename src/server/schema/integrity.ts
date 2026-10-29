import type {Client} from "pg";
import {evaluateSchemaCapability,type SchemaCapability} from "./compatibility";

/** Requirements are deliberately explicit, and are not trusted solely from schema_version. */
type Requirement=Readonly<{tables:readonly string[];columns:readonly string[];constraints:readonly string[];migration:string}>;
const requirements:Readonly<Record<SchemaCapability,Requirement>>={
 "multi-team":{
  tables:["smn_team_context","smn_team_context_audit","smn_account_team_preference"],
  columns:["smn_team:installation_id","smn_team:product_id","smn_team_context:team_id","smn_account_team_preference:team_id"],
  constraints:["smn_team_installation_pair_key","smn_team_pref_team_same_installation_fk"],
  migration:"20261026_smn282_multi_teams"
 },
 "per-team-agile-mode":{
  tables:["smn_team"],
  columns:["smn_team:agile_mode","smn_team:is_archived"],
  constraints:["smn_team_agile_mode_check"],
  migration:"20261029_smn_team_agile_mode_v32"
 },
 "company-catalog":{
  tables:["smn_company","smn_company_closure"],
  columns:["smn_company:id","smn_company:installation_id","smn_member:company_id","smn_company_closure:company_id"],
  constraints:[],
  migration:"20261028_smn316_company_catalog"
 },
 "links":{
  tables:["smn_link","smn_link_category","smn_link_audit"],
  columns:["smn_link:installation_id","smn_link:team_id","smn_link:category_id"],
  constraints:["smn_link_scope_team_check","smn_link_team_same_installation_fk"],
  migration:"20261027_smn306_links"
 },
 "country-consolidation":{
  tables:["smn_country","smn_country_name_audit","smn_country_lifecycle_audit","smn_national_holiday_manual_audit","smn_national_calendar_validation_audit"],
  columns:["smn_country:code"],
  constraints:[],
  migration:"20261028_smn270_281_country_consolidation"
 }
};
export type IntegrityResult=
 |Readonly<{ok:true;version:number;capability:SchemaCapability}>
 |Readonly<{ok:false;capability:SchemaCapability;reason:"version-invalid"|"migration-missing"|"structure-incomplete";details:readonly string[]}>;

/** Pure contract evaluation, usable with fake DB snapshots in unit tests. */
export function assessSchemaIntegrity(
 capability:SchemaCapability,version:unknown,
 actual:Readonly<{tables:readonly string[];columns:readonly string[];constraints:readonly string[];migrations:readonly string[]}>
):IntegrityResult{
 const verdict=evaluateSchemaCapability(version,capability);
 if(!verdict.ok)return {ok:false,capability,reason:"version-invalid",details:[verdict.reason]};
 const required=requirements[capability];
 if(!actual.migrations.includes(required.migration))
  return {ok:false,capability,reason:"migration-missing",details:[required.migration]};
 const absent=[
  ...required.tables.filter(x=>!actual.tables.includes(x)).map(x=>"table:"+x),
  ...required.columns.filter(x=>!actual.columns.includes(x)).map(x=>"column:"+x),
  ...required.constraints.filter(x=>!actual.constraints.includes(x)).map(x=>"constraint:"+x)
 ];
 return absent.length?{ok:false,capability,reason:"structure-incomplete",details:absent}:
  {ok:true,capability,version:verdict.version};
}

/** SELECT-only; does not create, repair, or migrate database structures. */
export async function inspectSchemaCapability(db:Pick<Client,"query">,capability:SchemaCapability):Promise<IntegrityResult>{
 const state=await db.query<{schema_version:number;state:string}>(
  "SELECT schema_version,state FROM public.smn_installation WHERE id='singleton'");
 const row=state.rows[0];
 if(row?.state!=="initialized")
  return {ok:false,capability,reason:"version-invalid",details:["installation-not-initialized"]};
 const versionCheck=evaluateSchemaCapability(row.schema_version,capability);
 if(!versionCheck.ok)
  return {ok:false,capability,reason:"version-invalid",details:[versionCheck.reason]};
 const required=requirements[capability];
 const history=await db.query<{migration_name:string}>(`
  SELECT migration_name FROM public._prisma_migrations
  WHERE migration_name=$1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL
  LIMIT 1`,[required.migration]);
 if(history.rows.length!==1)
  return {ok:false,capability,reason:"migration-missing",details:[required.migration]};
 const tables=await db.query<{name:string}>(`
  SELECT c.relname AS name FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
  AND c.relname=ANY($1::text[])`,[required.tables]);
 const columns=await db.query<{name:string}>(`
  SELECT table_name||':'||column_name AS name FROM information_schema.columns
  WHERE table_schema='public' AND table_name||':'||column_name=ANY($1::text[])`,[required.columns]);
 const constraints=await db.query<{name:string}>(`
  SELECT con.conname AS name FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_namespace n ON n.oid=con.connamespace
  WHERE n.nspname='public' AND con.convalidated AND con.conname=ANY($1::text[])`,[required.constraints]);
 return assessSchemaIntegrity(capability,row.schema_version,{
  tables:tables.rows.map(x=>x.name),columns:columns.rows.map(x=>x.name),
  constraints:constraints.rows.map(x=>x.name),migrations:history.rows.map(x=>x.migration_name)
 });
}
export async function requireSchemaCapability(db:Pick<Client,"query">,capability:SchemaCapability):Promise<number>{
 const result=await inspectSchemaCapability(db,capability);
 if(!result.ok)throw Error("smn-schema-"+result.reason+":"+result.details.join(","));
 return result.version;
}
