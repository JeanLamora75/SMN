import assert from "node:assert/strict";
import {test} from "node:test";
import {Client} from "pg";
import {sprintAggregateStatements} from "../scripts/apply-sprint-aggregates-v32";
import {sprintCoreStatements} from "../scripts/apply-sprint-core-v32";

const uri=process.env.SMN_TEST_DATABASE_URL,run=process.env.GITHUB_RUN_ID;
const enabled=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true"&&
 typeof uri==="string"&&/^postgresql:\/\/smn_ci:[^@]+@127\.0\.0\.1:5432\/smn_ci$/.test(uri)&&
 typeof run==="string"&&/^\d{5,20}$/.test(run);
test("Sprint v32: migrations agrégées idempotentes sur PostgreSQL isolé avec données conservées",
 {skip:!enabled,timeout:60000},async()=>{
 if(!enabled||!uri||!run)throw Error("Base CI indisponible");
 const name="smn_ci_sprint_"+run;
 const adminUri=new URL(uri);adminUri.pathname="/postgres";
 const targetUri=new URL(uri);targetUri.pathname="/"+name;
 const admin=new Client({connectionString:adminUri.toString()});
 await admin.connect();let created=false;
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  const db=new Client({connectionString:targetUri.toString()});
  await db.connect();
  try{
   await db.query("BEGIN");
   for(const sql of [
    "CREATE TABLE public.smn_installation(id text PRIMARY KEY)",
    "CREATE TABLE public.smn_team(id text PRIMARY KEY)",
    "CREATE TABLE public.smn_account(id text PRIMARY KEY)",
    "CREATE TABLE public.smn_sprint_exceptional_meeting(id text PRIMARY KEY)"
   ])await db.query(sql);
   for(const sql of sprintCoreStatements)await db.query(sql);
   await db.query("INSERT INTO public.smn_team(id) VALUES('team')");
   await db.query("INSERT INTO public.smn_account(id) VALUES('admin')");
   await db.query("INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone) VALUES('sprint','team',1,'Sprint CI','2026-10-01T00:00:00Z','2026-10-15T00:00:00Z','Europe/Paris')");
   for(const sql of sprintAggregateStatements)await db.query(sql);
   await db.query("INSERT INTO public.smn_sprint_scores(sprint_id) VALUES('sprint')");
   for(const sql of [...sprintCoreStatements,...sprintAggregateStatements])await db.query(sql);
   const rows=await db.query<{sprint_id:string}>("SELECT sprint_id FROM public.smn_sprint_scores WHERE sprint_id='sprint'");
   assert.equal(rows.rows[0]?.sprint_id,"sprint");
   const tables=sprintAggregateStatements.filter(sql=>sql.startsWith("CREATE TABLE IF NOT EXISTS public."))
    .map(sql=>sql.match(/^CREATE TABLE IF NOT EXISTS public\\.([a-z0-9_]+)/)?.[1]).filter(Boolean);
   const found=await db.query<{relname:string}>(`SELECT relname FROM pg_class WHERE relnamespace='public'::regnamespace
    AND relkind='r' AND relname=ANY($1::text[])`,[tables]);
   assert.equal(found.rows.length,new Set(tables).size);
   await db.query("ROLLBACK");
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e;}
  finally{await db.end();}
 }finally{
  if(created)await admin.query('DROP DATABASE IF EXISTS "'+name+'" WITH (FORCE)');
  await admin.end();
 }
});
