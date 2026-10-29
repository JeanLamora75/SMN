import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
/** Schéma central Sprint, nécessaire avant la migration des agrégats. */
export const sprintCoreStatements=[
  "CREATE TABLE IF NOT EXISTS public.smn_sprint(\n id text PRIMARY KEY,\n team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,\n number integer NOT NULL CHECK(number>0),\n name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 160),\n start_at timestamptz NOT NULL,\n end_at timestamptz NOT NULL,\n time_zone text NOT NULL,\n status text NOT NULL DEFAULT 'planned',\n created_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n created_at timestamptz NOT NULL DEFAULT now(),\n deleted_at timestamptz,\n deleted_by text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n CHECK(end_at>start_at),\n UNIQUE(team_id,number)\n )",
  "CREATE TABLE IF NOT EXISTS public.smn_sprint_audit(\n id text PRIMARY KEY, sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,\n action text NOT NULL, actor_id text REFERENCES public.smn_account(id) ON DELETE SET NULL,\n occurred_at timestamptz NOT NULL DEFAULT now(), details jsonb NOT NULL\n )"
] as const;
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-sprint-core-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
 await db.connect();
 try{await db.query("BEGIN");try{
  await db.query("SELECT pg_advisory_xact_lock(20261029,43)");
  const state=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
  if(state.rows.length!==1||state.rows[0].schema_version!==32||state.rows[0].state!=="initialized")throw Error("Installation v32 initialisée requise");
  if(!(await db.query<{ready:boolean}>("SELECT to_regclass('public.smn_team') IS NOT NULL AND to_regclass('public.smn_account') IS NOT NULL AS ready")).rows[0]?.ready)throw Error("Socle équipe/compte manquant");
  for(const sql of sprintCoreStatements)await db.query(sql);
  const relations=await db.query<{name:string}>(`SELECT relname AS name FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p')
   AND relname=ANY($1::text[])`,[["smn_sprint","smn_sprint_audit"]]);
  if(relations.rows.length!==2)throw Error("Tables centrales Sprint manquantes");
  await db.query("COMMIT");
 }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}}
 finally{await db.end();}
 console.log("Tables centrales Sprint v32 disponibles");
}
if(process.argv[1]?.includes("apply-sprint-core-v32"))main().catch(e=>{console.error(e);process.exitCode=1});
