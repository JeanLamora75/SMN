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
  "CREATE TABLE IF NOT EXISTS public.smn_report_section_options_audit(\n   id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n   revision integer NOT NULL,options jsonb NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n   changed_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_report_link_selection(\n   sprint_id text PRIMARY KEY REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n   link_ids jsonb NOT NULL,revision integer NOT NULL CHECK(revision>0),\n   updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n   updated_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_report_logo(\n  sprint_id text PRIMARY KEY REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n  mime text NOT NULL CHECK (mime IN ('image/png','image/jpeg')),data bytea NOT NULL,\n  updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n  updated_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_report_document(\n id text PRIMARY KEY,\n sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,\n title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),\n language text NOT NULL CHECK(language IN ('fr','en')),\n status text NOT NULL DEFAULT 'draft' CHECK(status='draft'),\n template_id text NOT NULL,\n template_version integer NOT NULL CHECK(template_version>=0),\n content jsonb NOT NULL CHECK(jsonb_typeof(content)='object'),\n revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),\n created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n updated_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n created_at timestamptz NOT NULL DEFAULT now(),\n updated_at timestamptz NOT NULL DEFAULT now()\n)",
  "CREATE INDEX IF NOT EXISTS smn_report_document_sprint_idx ON public.smn_report_document(sprint_id,updated_at DESC)",
  "ALTER TABLE public.smn_report_document ADD COLUMN IF NOT EXISTS creation_request_id text",
  "CREATE TABLE IF NOT EXISTS public.smn_report_document_session_write(document_id text NOT NULL REFERENCES public.smn_report_document(id) ON DELETE CASCADE, session_id text NOT NULL, last_sequence integer NOT NULL CHECK(last_sequence>=1), PRIMARY KEY(document_id,session_id))",
  "CREATE UNIQUE INDEX IF NOT EXISTS smn_report_document_create_request_idx ON public.smn_report_document(creation_request_id) WHERE creation_request_id IS NOT NULL"
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
