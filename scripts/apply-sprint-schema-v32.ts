import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {sprintCoreStatements} from "./apply-sprint-core-v32";
import {sprintAggregateStatements} from "./apply-sprint-aggregates-v32";

/** Migration transactionnelle du module Sprint (lot A). */
const statements=[...sprintCoreStatements,...sprintAggregateStatements] as const;
const requiredColumns={
 smn_sprint:["id","team_id","deleted_at","deleted_by","auto_suspended"],
 smn_sprint_exceptional_meeting:["generation_source","status_explicit"],
 smn_sprint_scores:["sprint_id","confidence","clarity","revision"],
 smn_sprint_story_points:["sprint_id"],
 smn_sprint_ticket_counts:["sprint_id","initial_tickets","done_tickets"]
} as const;
async function main(){
 if(process.argv.slice(2).join(" ")!=="--apply")throw Error("Usage: pnpm exec tsx scripts/apply-sprint-schema-v32.ts --apply");
 const db=new Client({connectionString:await installedDatabaseUri(),connectionTimeoutMillis:3500,statement_timeout:60000});
 await db.connect();
 try{
  await db.query("BEGIN");
  try{
   await db.query("SELECT pg_advisory_xact_lock(20261029,44)");
   const installation=await db.query<{schema_version:number;state:string}>("SELECT schema_version,state FROM public.smn_installation WHERE id='singleton' FOR UPDATE");
   if(installation.rows.length!==1||installation.rows[0].schema_version!==32||installation.rows[0].state!=="initialized")
    throw Error("Installation v32 initialisée requise");
   const pre=await db.query<{ok:boolean}>(`SELECT
     to_regclass('public.smn_team') IS NOT NULL AND
     to_regclass('public.smn_account') IS NOT NULL AND
     to_regclass('public.smn_sprint_exceptional_meeting') IS NOT NULL AS ok`);
   if(!pre.rows[0]?.ok)throw Error("Équipes, comptes et Cérémonies doivent être migrés en premier");
   for(const sql of statements)await db.query(sql);
   const requiredTables=[...new Set(statements.filter(sql=>sql.startsWith("CREATE TABLE IF NOT EXISTS public."))
     .map(sql=>sql.match(/^CREATE TABLE IF NOT EXISTS public\\.([a-z0-9_]+)/)?.[1]).filter((v):v is string=>!!v))];
   const rows=await db.query<{relname:string}>(`SELECT relname FROM pg_class WHERE relnamespace='public'::regnamespace
     AND relkind IN ('r','p') AND relname=ANY($1::text[])`,[requiredTables]);
   const actual=new Set(rows.rows.map(row=>row.relname));
   for(const name of requiredTables)if(!actual.has(name))throw Error("Table Sprint absente: "+name);
   const columns=await db.query<{table_name:string;column_name:string}>(`SELECT table_name,column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name=ANY($1::text[])`,[Object.keys(requiredColumns)]);
   for(const [table,names] of Object.entries(requiredColumns))
    for(const column of names)
     if(!columns.rows.some(x=>x.table_name===table&&x.column_name===column))
      throw Error("Colonne Sprint absente: "+table+"."+column);
   await db.query("COMMIT");
  }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
 }finally{await db.end();}
 console.log("Sprint v32: tables centrales et agrégats prêts, sans suppression");
}
if(process.argv[1]?.includes("apply-sprint-schema-v32"))main().catch(e=>{console.error(e);process.exitCode=1});
