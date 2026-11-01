import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";

// Socles v32 minimaux : ce test ne remplace PAS une restauration de baseline complète.
test("SMN-338 : recette additive et convergence sur deux bases jetables", {timeout:120000},async()=>{
 const uri=new URL(await installedDatabaseUri());
 if(!["postgres:","postgresql:"].includes(uri.protocol)||uri.pathname!=="/smn"||
  !["localhost","127.0.0.1","::1"].includes(uri.hostname))throw Error("Base SMN locale obligatoire");
 const adminUri=new URL(uri.toString());adminUri.pathname="/postgres";
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500,statement_timeout:20000});
 const names=["historique","native"].map(x=>"smn338_"+x+"_"+randomBytes(5).toString("hex"));
 const created:string[]=[];
 const signatures:string[]=[];
 await admin.connect();
 try{
  const role=await admin.query("SELECT current_database() db,(SELECT rolcreatedb OR rolsuper FROM pg_roles WHERE rolname=current_user) allowed");
  assert.equal(role.rows[0]?.db,"postgres");
  assert.equal(role.rows[0]?.allowed,true);
  const ddl=readFileSync(new URL("../_bmad-output/planning-artifacts/SMN-338-DDL-ADDITIF-DRAFT.sql",import.meta.url),"utf8");
  for(let i=0;i<2;i++){
   const name=names[i];
   await admin.query('CREATE DATABASE "'+name+'"');created.push(name);
   const target=new URL(uri.toString());target.pathname="/"+name;
   const db=new Client({connectionString:target.toString(),connectionTimeoutMillis:3500,statement_timeout:20000});
   await db.connect();
   try{
    await db.query("BEGIN");
    for(const sql of [
     "CREATE TABLE public.smn_team(id text PRIMARY KEY)",
     "CREATE TABLE public.smn_account(id text PRIMARY KEY)",
     "CREATE TABLE public.smn_sprint(id text PRIMARY KEY,team_id text NOT NULL REFERENCES public.smn_team(id))",
     "CREATE TABLE public.smn_kanban_period(id text PRIMARY KEY,team_id text NOT NULL REFERENCES public.smn_team(id))",
     "CREATE TABLE public.smn_installation(id text PRIMARY KEY,schema_version integer NOT NULL,state text NOT NULL)",
     "CREATE TABLE public._prisma_migrations(id text PRIMARY KEY,finished_at timestamptz NOT NULL)"
    ])await db.query(sql);
    await db.query("INSERT INTO public.smn_installation VALUES('singleton',32,'initialized')");
    await db.query("INSERT INTO public.smn_team VALUES('team-test')");
    await db.query("INSERT INTO public.smn_sprint VALUES('cycle-test','team-test')");
    const historyCount=i===0?32:1;
    for(let j=0;j<historyCount;j++)await db.query("INSERT INTO public._prisma_migrations VALUES($1,now())",["migration-"+j]);
    await db.query(ddl);
    const tables=await db.query("SELECT relname FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' AND relname LIKE 'smn_indicator_%' ORDER BY relname");
    assert.equal(tables.rows.length,8);
    const columns=await db.query("SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name LIKE 'smn_indicator_%' ORDER BY table_name,ordinal_position");
    const indexes=await db.query("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename LIKE 'smn_indicator_%' ORDER BY tablename,indexname");
    const constraints=await db.query("SELECT table_name,constraint_name,constraint_type FROM information_schema.table_constraints WHERE table_schema='public' AND table_name LIKE 'smn_indicator_%' ORDER BY table_name,constraint_name");
    const triggers=await db.query("SELECT tgname FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE NOT t.tgisinternal AND c.relname LIKE 'smn_indicator_%' ORDER BY tgname");
    assert.equal(triggers.rows.length,3);
    signatures.push(JSON.stringify([tables.rows,columns.rows,indexes.rows,constraints.rows,triggers.rows]));
    const prior=await db.query("SELECT count(*)::int AS n FROM public._prisma_migrations");
    assert.equal(prior.rows[0]?.n,historyCount);
    const data=await db.query("SELECT s.id FROM public.smn_sprint s JOIN public.smn_team t ON t.id=s.team_id");
    assert.equal(data.rows[0]?.id,"cycle-test");
    // Simulation du changement de version, entièrement annulée.
    await db.query("UPDATE public.smn_installation SET schema_version=33");
    await db.query("INSERT INTO public._prisma_migrations VALUES('candidate-v33',now())");
    const state=await db.query("SELECT schema_version FROM public.smn_installation");
    assert.equal(state.rows[0]?.schema_version,33);
    await db.query("ROLLBACK");
    const after=await db.query("SELECT to_regclass('public.smn_indicator_definition') AS indicator");
    assert.equal(after.rows[0]?.indicator,null);
   }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e}
   finally{await db.end().catch(()=>undefined)}
  }
  assert.equal(signatures[0],signatures[1]);
  console.log("Convergence du DDL sur deux socles v32 minimaux : OK (sans migration réelle)");
 }finally{
  try{for(const n of created.reverse())await admin.query('DROP DATABASE "'+n+'" WITH (FORCE)')}
  finally{await admin.end().catch(()=>undefined)}
 }
});
