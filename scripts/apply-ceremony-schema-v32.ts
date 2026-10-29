import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
/** Additive, explicit materialization of Scrum ceremonies infrastructure for schema v32. */
export const ceremonyStatements=[
  "CREATE TABLE IF NOT EXISTS public.smn_sprint_ceremony(\n id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n kind text NOT NULL CHECK(kind IN ('planning','daily','review','retrospective')),\n starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,\n minutes integer NOT NULL CHECK(minutes>0),generated_at timestamptz NOT NULL DEFAULT now(),\n CHECK(ends_at>starts_at),UNIQUE(sprint_id,kind,starts_at)\n )",
  "ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS generation_source text NOT NULL DEFAULT 'standard'",
  "CREATE TABLE IF NOT EXISTS public.smn_sprint_ceremony_segment(\n ceremony_id text NOT NULL REFERENCES public.smn_sprint_ceremony(id) ON DELETE CASCADE,\n position integer NOT NULL CHECK(position>0),\n starts_at timestamptz NOT NULL,\n ends_at timestamptz NOT NULL,\n minutes integer NOT NULL CHECK(minutes>0),\n PRIMARY KEY(ceremony_id,position),\n CHECK(ends_at>starts_at))",
  "CREATE TABLE IF NOT EXISTS public.smn_scrum_ceremony_template(\n id text PRIMARY KEY,\n team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,\n name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 120),\n frequency text NOT NULL CHECK(frequency IN ('daily','weekly','sprint')),\n weekday integer CHECK(weekday BETWEEN 1 AND 7),\n position text CHECK(position IN ('start','end')),\n local_time time NOT NULL,\n duration_minutes integer NOT NULL CHECK(duration_minutes BETWEEN 1 AND 480),\n active boolean NOT NULL DEFAULT true,\n revision integer NOT NULL DEFAULT 1,\n created_at timestamptz NOT NULL DEFAULT now(),\n updated_at timestamptz NOT NULL DEFAULT now(),\n CHECK((frequency='daily' AND weekday IS NULL AND position IS NULL)\n OR (frequency='weekly' AND weekday IS NOT NULL AND position IS NULL)\n OR (frequency='sprint' AND weekday IS NULL AND position IS NOT NULL)))",
  "CREATE TABLE IF NOT EXISTS public.smn_scrum_ceremony_template_history(\n id text PRIMARY KEY,\n template_id text NOT NULL REFERENCES public.smn_scrum_ceremony_template(id) ON DELETE RESTRICT,\n revision integer NOT NULL,\n before_values jsonb,\n after_values jsonb NOT NULL,\n actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n changed_at timestamptz NOT NULL DEFAULT now(),\n UNIQUE(template_id,revision))",
  "CREATE TABLE IF NOT EXISTS public.smn_scrum_lunch(\n team_id text PRIMARY KEY REFERENCES public.smn_team(id) ON DELETE RESTRICT,\n start_time time NOT NULL DEFAULT '12:00',end_time time NOT NULL DEFAULT '13:00',\n revision integer NOT NULL DEFAULT 1 CHECK(revision>0),\n updated_at timestamptz NOT NULL DEFAULT now(),\n CHECK(start_time<end_time))",
  "ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS provenance text NOT NULL DEFAULT 'generated'",
  "ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS occurrence_status text NOT NULL DEFAULT 'scheduled'",
  "ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1",
  "CREATE TABLE IF NOT EXISTS public.smn_sprint_ceremony_history(\n  id text PRIMARY KEY,ceremony_id text NOT NULL REFERENCES public.smn_sprint_ceremony(id) ON DELETE RESTRICT,\n  revision integer NOT NULL,previous_values jsonb NOT NULL,next_values jsonb NOT NULL,\n  changed_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n  changed_at timestamptz NOT NULL DEFAULT now(),UNIQUE(ceremony_id,revision))",
  "CREATE TABLE IF NOT EXISTS public.smn_sprint_exceptional_meeting(\n id text PRIMARY KEY,sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 160),\n starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,\n duration_minutes integer NOT NULL CHECK(duration_minutes BETWEEN 1 AND 480),\n status text NOT NULL DEFAULT 'scheduled',\n created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n created_at timestamptz NOT NULL DEFAULT now(),\n revised_at timestamptz,\n CHECK(ends_at>starts_at))",
  "CREATE TABLE IF NOT EXISTS public.smn_sprint_exceptional_meeting_history(\n id text PRIMARY KEY,meeting_id text NOT NULL REFERENCES public.smn_sprint_exceptional_meeting(id) ON DELETE RESTRICT,\n action text NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n occurred_at timestamptz NOT NULL DEFAULT now(),details jsonb NOT NULL)",
  "CREATE TABLE IF NOT EXISTS public.smn_scrum_template_occurrence(\n id text PRIMARY KEY,\n template_id text NOT NULL REFERENCES public.smn_scrum_ceremony_template(id) ON DELETE RESTRICT,\n template_revision integer NOT NULL,\n sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n name text NOT NULL,\n starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,\n created_at timestamptz NOT NULL DEFAULT now(),\n CHECK(ends_at>starts_at),UNIQUE(template_id,sprint_id,starts_at))",
  "ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'scheduled'",
  "ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS status_explicit boolean NOT NULL DEFAULT false",
  "ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS generation_source text NOT NULL DEFAULT 'standard'",
  "ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS actual_minutes integer CHECK(actual_minutes BETWEEN 0 AND 1440)",
  "ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'scheduled'",
  "ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS status_explicit boolean NOT NULL DEFAULT false",
  "ALTER TABLE public.smn_sprint_exceptional_meeting ADD COLUMN IF NOT EXISTS status_explicit boolean NOT NULL DEFAULT false",
  "ALTER TABLE public.smn_sprint_exceptional_meeting ADD COLUMN IF NOT EXISTS generation_source text NOT NULL DEFAULT 'manual'",
  "ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS status_explicit boolean NOT NULL DEFAULT false",
  "CREATE TABLE IF NOT EXISTS public.smn_sprint_ceremony_status_history(\n   id text PRIMARY KEY,ceremony_id text NOT NULL REFERENCES public.smn_sprint_ceremony(id) ON DELETE RESTRICT,\n   previous_status text NOT NULL,next_status text NOT NULL,\n   reason text,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n   changed_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_scrum_template_occurrence_status_history(\n   id text PRIMARY KEY,occurrence_id text NOT NULL REFERENCES public.smn_scrum_template_occurrence(id) ON DELETE RESTRICT,\n   previous_status text NOT NULL,next_status text NOT NULL,\n   reason text,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n   changed_at timestamptz NOT NULL DEFAULT now())",
  "CREATE TABLE IF NOT EXISTS public.smn_sprint_exceptional_meeting_status_history(\n   id text PRIMARY KEY,meeting_id text NOT NULL REFERENCES public.smn_sprint_exceptional_meeting(id) ON DELETE RESTRICT,\n   previous_status text NOT NULL,next_status text NOT NULL,\n   reason text,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n   changed_at timestamptz NOT NULL DEFAULT now())",
  "ALTER TABLE public.smn_sprint_ceremony ADD COLUMN IF NOT EXISTS actual_minutes integer CHECK(actual_minutes>=0 AND actual_minutes<=1440)",
  "ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS actual_minutes integer CHECK(actual_minutes>=0 AND actual_minutes<=1440)",
  "ALTER TABLE public.smn_sprint_exceptional_meeting ADD COLUMN IF NOT EXISTS actual_minutes integer CHECK(actual_minutes>=0 AND actual_minutes<=1440)",
  "CREATE TABLE IF NOT EXISTS public.smn_meeting_actual_duration_audit(\n  id text PRIMARY KEY,kind text NOT NULL CHECK(kind IN ('standard','custom','exceptional')),\n  event_id text NOT NULL,previous_minutes integer,new_minutes integer NOT NULL,\n  planned_minutes integer NOT NULL,actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n  changed_at timestamptz NOT NULL DEFAULT now())",
  "ALTER TABLE public.smn_scrum_template_occurrence ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1 CHECK(revision>=1)",
  "ALTER TABLE public.smn_sprint_exceptional_meeting ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1 CHECK(revision>=1)",
  "CREATE TABLE IF NOT EXISTS public.smn_calendar_meeting_schedule_history(\n  id text PRIMARY KEY,\n  meeting_kind text NOT NULL CHECK(meeting_kind IN ('ceremony','template','exceptional')),\n  meeting_id text NOT NULL,previous_values jsonb NOT NULL,next_values jsonb NOT NULL,\n  actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n  changed_at timestamptz NOT NULL DEFAULT now()\n )"
] as const;
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-ceremony-schema-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:30000});
 await db.connect();
 try{await db.query("BEGIN");try{
  await db.query("SELECT pg_advisory_xact_lock(20261029,34)");
  const state=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
  if(state.rows.length!==1||state.rows[0].schema_version!==32||state.rows[0].state!=="initialized")throw Error("Installation initialisée v32 requise");
  for(const sql of ceremonyStatements)await db.query(sql);
  await db.query("COMMIT");
 }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}}
 finally{await db.end();}
 console.log("Schéma des cérémonies v32 matérialisé : pnpm db:diagnose");
}
if(process.argv[1]?.includes("apply-ceremony-schema-v32"))main().catch(e=>{console.error(e);process.exitCode=1});
