import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
/** Lot A: matériel SQL des agrégats de base du registre, ordre des dépendances conservé. */
export const registryCoreStatements = [
  "CREATE TABLE IF NOT EXISTS public.smn_registry_item(\n id text PRIMARY KEY,installation_id text NOT NULL REFERENCES public.smn_installation(id),\n team_id text NOT NULL REFERENCES public.smn_team(id),\n type text NOT NULL CHECK(type IN ('risk','obstacle','dependency','decision','action','highlight')),\n title text NOT NULL CHECK(length(btrim(title)) BETWEEN 1 AND 240),\n occurred_on date NOT NULL,status text NOT NULL,\n description text,owner_name text,due_on date,comment text,\n revision integer NOT NULL DEFAULT 1 CHECK(revision>0),\n created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n created_at timestamptz NOT NULL DEFAULT now(),\n updated_at timestamptz NOT NULL DEFAULT now())",
  "CREATE INDEX IF NOT EXISTS smn_registry_item_team_type_date\n ON public.smn_registry_item(team_id,type,occurred_on DESC,id)",
  "CREATE TABLE IF NOT EXISTS public.smn_registry_item_audit(\n id text PRIMARY KEY,item_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n revision integer NOT NULL CHECK(revision>0),\n before_values jsonb,after_values jsonb NOT NULL,\n actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n changed_at timestamptz NOT NULL DEFAULT now(),UNIQUE(item_id,revision))",
  "CREATE TABLE IF NOT EXISTS public.smn_registry_linked_request(\n    request_id text PRIMARY KEY,\n    source_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n    actor_id text NOT NULL REFERENCES public.smn_account(id) ON DELETE RESTRICT,\n    request_fingerprint text NOT NULL,\n    new_item_id text NOT NULL UNIQUE REFERENCES public.smn_registry_item(id)\n     DEFERRABLE INITIALLY DEFERRED,\n    created_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_registry_relation(\n id text PRIMARY KEY,source_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n target_kind text NOT NULL CHECK(target_kind IN ('record','goal')),\n target_id text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),\n UNIQUE(source_id,target_kind,target_id))",
  "CREATE TABLE IF NOT EXISTS public.smn_registry_relation_audit(\n id text PRIMARY KEY,source_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n target_kind text NOT NULL,target_id text NOT NULL,action text NOT NULL CHECK(action IN ('linked','unlinked')),\n actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,changed_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_registry_comment(\n  id text PRIMARY KEY,\n  item_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n  body text NOT NULL CHECK(length(btrim(body)) BETWEEN 1 AND 4000),\n  revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),\n  author_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n  author_name text NOT NULL,\n  created_at timestamptz NOT NULL DEFAULT now(),\n  edited_at timestamptz,\n  editor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n  editor_name text,\n  withdrawn_at timestamptz,\n  withdrawn_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n  withdrawn_by_name text,\n  CHECK(withdrawn_at IS NULL OR withdrawn_by_name IS NOT NULL))",
  "CREATE INDEX IF NOT EXISTS smn_registry_comment_item_date\n  ON public.smn_registry_comment(item_id,created_at DESC,id DESC)",
  "CREATE TABLE IF NOT EXISTS public.smn_registry_comment_revision(\n  id text PRIMARY KEY,\n  comment_id text NOT NULL REFERENCES public.smn_registry_comment(id) ON DELETE RESTRICT,\n  revision integer NOT NULL CHECK(revision>=1),\n  action text NOT NULL CHECK(action IN ('created','edited','withdrawn')),\n  before_text text,\n  after_text text,\n  actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n  actor_name text NOT NULL,\n  changed_at timestamptz NOT NULL DEFAULT now(),\n  UNIQUE(comment_id,revision))",
  "CREATE TABLE IF NOT EXISTS public.smn_risk_assessment(\n item_id text PRIMARY KEY REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n probability smallint CHECK(probability BETWEEN 1 AND 3),\n impact smallint CHECK(impact BETWEEN 1 AND 3),\n revision integer NOT NULL DEFAULT 1 CHECK(revision>0),\n updated_at timestamptz NOT NULL DEFAULT now(),\n updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL)",
  "CREATE TABLE IF NOT EXISTS public.smn_risk_assessment_audit(\n id text PRIMARY KEY,item_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n revision integer NOT NULL,old_values jsonb,new_values jsonb NOT NULL,\n actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n changed_at timestamptz NOT NULL DEFAULT now(),UNIQUE(item_id,revision))",
  "CREATE TABLE IF NOT EXISTS public.smn_risk_roam(\n item_id text PRIMARY KEY REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n classification text NOT NULL CHECK(classification IN ('resolved','owned','accepted','mitigated')),\n revision integer NOT NULL DEFAULT 1 CHECK(revision>0),\n updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n updated_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_risk_roam_audit(\n id text PRIMARY KEY,item_id text NOT NULL REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,\n revision integer NOT NULL CHECK(revision>0),\n previous_classification text,next_classification text NOT NULL,\n actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n changed_at timestamptz NOT NULL DEFAULT now(),\n UNIQUE(item_id,revision))"
] as const;
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-registry-core-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:30000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,38)");
   const state=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(state.rows.length!==1||state.rows[0].schema_version!==32||state.rows[0].state!=="initialized")throw Error("Installation v32 initialisée requise");
   for(const sql of registryCoreStatements)await db.query(sql);
   await db.query("COMMIT");
  }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
 }finally{await db.end();}
 console.log("Registres: schéma principal matérialisé sans suppression");
}
if(process.argv[1]?.includes("apply-registry-core-v32"))main().catch(e=>{console.error(e);process.exitCode=1});
