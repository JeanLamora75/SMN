import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
/** Explicit, additive, transactionally safe cross-module migration. Registry tables must exist first. */
export const outcomeDDL=[
`CREATE TABLE IF NOT EXISTS public.smn_calendar_meeting_outcome_link(
 registry_item_id text PRIMARY KEY REFERENCES public.smn_registry_item(id) ON DELETE RESTRICT,
 sprint_id text NOT NULL REFERENCES public.smn_sprint(id) ON DELETE RESTRICT,
 team_id text NOT NULL REFERENCES public.smn_team(id) ON DELETE RESTRICT,
 meeting_kind text NOT NULL CHECK(meeting_kind IN ('ceremony','template','exceptional')),
 meeting_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
)`,
`CREATE INDEX IF NOT EXISTS smn_calendar_meeting_outcome_by_event
 ON public.smn_calendar_meeting_outcome_link(meeting_kind,meeting_id,created_at)`
] as const;
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-meeting-outcome-schema-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:30000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,35)");
   const state=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(state.rows.length!==1||state.rows[0].schema_version!==32||state.rows[0].state!=="initialized")throw Error("Installation v32 initialisée requise");
   const required=["smn_registry_item","smn_sprint","smn_team"];
   const present=await db.query<{name:string}>(`SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE n.nspname='public' AND c.relname=ANY($1::text[]) AND c.relkind IN ('r','p')`,[required]);
   const available=new Set(present.rows.map(x=>x.name));
   if(required.some(name=>!available.has(name)))throw Error("Migration Registres requise avant résultats des réunions");
   for(const sql of outcomeDDL)await db.query(sql);
   const columns=await db.query<{column_name:string}>(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='smn_calendar_meeting_outcome_link'`);
   for(const field of ["registry_item_id","sprint_id","team_id","meeting_kind","meeting_id","created_at"])
    if(!columns.rows.some(c=>c.column_name===field))throw Error("Colonne manquante: "+field);
   await db.query("COMMIT");
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
 }finally{await db.end();}
 console.log("Schéma résultats de réunions matérialisé sans suppression");
}
if(process.argv[1]?.includes("apply-meeting-outcome-schema-v32"))main().catch(e=>{console.error(e);process.exitCode=1});
