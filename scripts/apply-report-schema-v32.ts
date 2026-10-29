import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
export const reportSchemaStatements=[
  "CREATE TABLE IF NOT EXISTS public.smn_report_analysis_choice(\n sprint_id text PRIMARY KEY,selected_ids jsonb NOT NULL DEFAULT '[]'::jsonb,\n updated_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_report_archive_grant(\n   archive_id text NOT NULL REFERENCES public.smn_report_pdf_archive(id) ON DELETE RESTRICT,\n   user_id text NOT NULL REFERENCES public.smn_account(id) ON DELETE RESTRICT,\n   granted_by text NOT NULL,granted_at timestamptz NOT NULL DEFAULT now(),\n   revoked_at timestamptz,PRIMARY KEY(archive_id,user_id))",
  "CREATE TABLE IF NOT EXISTS public.smn_report_archive_visibility(\n archive_id text PRIMARY KEY REFERENCES public.smn_report_pdf_archive(id) ON DELETE RESTRICT,\n hidden_at timestamptz NOT NULL DEFAULT now(),hidden_by text NOT NULL,reason text NOT NULL)",
  "CREATE TABLE IF NOT EXISTS public.smn_report_content_options(\n   sprint_id text PRIMARY KEY REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n   options jsonb NOT NULL,revision integer NOT NULL CHECK(revision>0),\n   updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n   updated_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_report_content_options_audit(\n   id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n   revision integer NOT NULL,options jsonb NOT NULL,\n   actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n   changed_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_report_history_options(\n sprint_id text PRIMARY KEY REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n depth integer NOT NULL CHECK(depth BETWEEN 1 AND 5),revision integer NOT NULL CHECK(revision>0),\n updated_at timestamptz NOT NULL DEFAULT now(),updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL)",
  "CREATE TABLE IF NOT EXISTS public.smn_report_language(\n sprint_id text PRIMARY KEY REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n language text NOT NULL CHECK(language IN ('fr','en')),revision integer NOT NULL CHECK(revision>0),\n updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n updated_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_report_render_reference(\n id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n created_at timestamptz NOT NULL DEFAULT now(),created_by text NOT NULL,\n sha256 text NOT NULL,payload jsonb NOT NULL)",
  "CREATE TABLE IF NOT EXISTS public.smn_report_section_options (\n   sprint_id text PRIMARY KEY REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n   options jsonb NOT NULL,revision integer NOT NULL CHECK(revision>0),\n   updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n   updated_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_report_section_options_audit(\n   id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n   revision integer NOT NULL,options jsonb NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n   changed_at timestamptz NOT NULL DEFAULT now())"
] as const;
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-report-schema-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
 await db.connect();
 try{await db.query("BEGIN");try{
  await db.query("SELECT pg_advisory_xact_lock(20261029,41)");
  const r=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
  if(r.rows.length!==1||r.rows[0].schema_version!==32||r.rows[0].state!=="initialized")throw Error("Installation initialisée v32 requise");
  for(const sql of reportSchemaStatements)await db.query(sql);
  await db.query("COMMIT");
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}}
 finally{await db.end();}
 console.log("Schéma Rapports additionnel v32 matérialisé sans suppression");
}
if(process.argv[1]?.includes("apply-report-schema-v32"))main().catch(e=>{console.error(e);process.exitCode=1});
