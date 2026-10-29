import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
/** Dépendances secondaires des Registres : exécuter après apply-registry-core-v32. */
export const registryExtensionStatements=[
  "CREATE TABLE IF NOT EXISTS public.smn_action_link(\n   action_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n   related_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n   PRIMARY KEY(action_id,related_id))",
  "CREATE TABLE IF NOT EXISTS public.smn_action_link_audit(\n   id text PRIMARY KEY,action_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n   related_id text NOT NULL,action text NOT NULL CHECK(action IN ('linked','unlinked')),\n   actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n   changed_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_automatic_highlight(\n id text PRIMARY KEY,category text NOT NULL,source_kind text NOT NULL,\n source_id text NOT NULL,source_revision integer NOT NULL CHECK(source_revision>0),\n title text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),\n actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n UNIQUE(category,source_kind,source_id,source_revision))",
  "CREATE TABLE IF NOT EXISTS public.smn_registry_deadline_settings(\n  id text PRIMARY KEY CHECK(id='singleton'),days integer NOT NULL CHECK(days BETWEEN 0 AND 365),\n  revision integer NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),\n  updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL)",
  "CREATE TABLE IF NOT EXISTS public.smn_decision_detail(\n item_id text PRIMARY KEY REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n rationale text, replaces_id text REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n revision integer NOT NULL DEFAULT 1 CHECK(revision>0),\n updated_at timestamptz NOT NULL DEFAULT now(),\n updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL)",
  "CREATE TABLE IF NOT EXISTS public.smn_decision_detail_audit(\n id text PRIMARY KEY,item_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n revision integer NOT NULL,before_values jsonb,after_values jsonb NOT NULL,\n actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n changed_at timestamptz NOT NULL DEFAULT now(),UNIQUE(item_id,revision))",
  "CREATE TABLE IF NOT EXISTS public.smn_dependency_parties(\n item_id text PRIMARY KEY REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n requester jsonb NOT NULL,contributor jsonb NOT NULL,\n revision integer NOT NULL CHECK(revision>0),\n updated_at timestamptz NOT NULL DEFAULT now(),\n updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL)",
  "CREATE TABLE IF NOT EXISTS public.smn_dependency_parties_audit(\n id text PRIMARY KEY,item_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n revision integer NOT NULL,before_values jsonb,after_values jsonb NOT NULL,\n actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n changed_at timestamptz NOT NULL DEFAULT now(),UNIQUE(item_id,revision))",
  "CREATE TABLE IF NOT EXISTS public.smn_dependency_vigilance(\n item_id text PRIMARY KEY REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n at_risk boolean NOT NULL DEFAULT false,revision integer NOT NULL DEFAULT 1,\n updated_at timestamptz NOT NULL DEFAULT now(),\n updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL)",
  "CREATE TABLE IF NOT EXISTS public.smn_dependency_vigilance_audit(\n id text PRIMARY KEY,item_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n revision integer NOT NULL,before_values jsonb,after_values jsonb NOT NULL,\n actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n changed_at timestamptz NOT NULL DEFAULT now(),UNIQUE(item_id,revision))",
  "CREATE TABLE IF NOT EXISTS public.smn_fact_selection(\n origin text NOT NULL CHECK(origin IN ('manual','automatic')),fact_id text NOT NULL,\n hidden boolean NOT NULL DEFAULT false,promoted boolean NOT NULL DEFAULT false,\n selected boolean NOT NULL DEFAULT true,revision integer NOT NULL DEFAULT 1,\n updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(origin,fact_id))",
  "CREATE TABLE IF NOT EXISTS public.smn_fact_selection_audit(\n id text PRIMARY KEY,origin text NOT NULL,fact_id text NOT NULL,\n previous_values jsonb,next_values jsonb NOT NULL,\n actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n changed_at timestamptz NOT NULL DEFAULT now())",
  "ALTER TABLE public.smn_automatic_highlight ADD COLUMN IF NOT EXISTS invalidated_at timestamptz",
  "ALTER TABLE public.smn_automatic_highlight ADD COLUMN IF NOT EXISTS invalidated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL",
  "ALTER TABLE public.smn_automatic_highlight ADD COLUMN IF NOT EXISTS invalidation_reason text"
] as const;
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-registry-extensions-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:30000});
 await db.connect();try{
 await db.query("BEGIN");try{
 await db.query("SELECT pg_advisory_xact_lock(20261029,39)");
 const v=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
 if(v.rows[0]?.schema_version!==32||v.rows[0]?.state!=="initialized")throw Error("Installation initialisée v32 requise");
 if(!(await db.query<{exists:boolean}>("SELECT to_regclass('public.smn_registry_item') IS NOT NULL AS exists")).rows[0]?.exists)throw Error("Migration noyau Registres requise");
 for(const sql of registryExtensionStatements)await db.query(sql);
 await db.query("COMMIT");
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await db.end();}
 console.log("Registres: extensions matérialisées sans suppression");
}
if(process.argv[1]?.includes("apply-registry-extensions-v32"))main().catch(e=>{console.error(e);process.exitCode=1});
