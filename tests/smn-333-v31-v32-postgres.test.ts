import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {randomUUID} from "node:crypto";
import {test} from "node:test";
import {Client} from "pg";
import {assessSchemaIntegrity} from "../src/server/schema/integrity";

const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
const uri=ci?process.env.SMN_TEST_DATABASE_URL:undefined;
const approved=!!uri&&/^postgresql:\/\/smn_ci:[^@]+@127\.0\.0\.1:5432\/smn_ci$/.test(uri);
const sql=readFileSync(new URL("../prisma/migrations/20261029_smn_team_agile_mode_v32/migration.sql",import.meta.url),"utf8");

test("SMN-333: v31 vers v32 conserve les cycles Scrum et Kanban sur PostgreSQL 18",{
 skip:!ci
},async()=>{
 assert.ok(approved,"Base PostgreSQL éphémère smn_ci requise");
 const admin=new Client({connectionString:uri});
 await admin.connect();
 const name="smn333_"+randomUUID().replaceAll("-","").slice(0,16);
 let db:Client|undefined;
 try{
  await admin.query('CREATE DATABASE "'+name+'"');
  const isolated=new URL(uri!);isolated.pathname="/"+name;
  db=new Client({connectionString:isolated.toString()});await db.connect();
  const version=await db.query<{server_version_num:string}>("SHOW server_version_num");
  assert.equal(Math.floor(Number(version.rows[0].server_version_num)/10000),18);
  await db.query(`CREATE TABLE public.smn_installation(id text PRIMARY KEY,state text NOT NULL,schema_version integer NOT NULL,mode text NOT NULL);
   CREATE TABLE public.smn_team(id text PRIMARY KEY,installation_id text NOT NULL,name text NOT NULL);
   CREATE TABLE public.smn_sprint(id text PRIMARY KEY,team_id text NOT NULL,name text NOT NULL);
   CREATE TABLE public.smn_kanban_period(id text PRIMARY KEY,team_id text NOT NULL,name text NOT NULL);
   INSERT INTO public.smn_installation VALUES('singleton','initialized',31,'scrum');
   INSERT INTO public.smn_team VALUES('koala','singleton','Team Koala'),('panda','singleton','Team Panda');
   INSERT INTO public.smn_sprint VALUES('sprint-1','koala','Sprint historique');
   INSERT INTO public.smn_kanban_period VALUES('period-1','panda','Période historique');`);
  await db.query("BEGIN");
  await db.query(sql);
  // Une équipe Panda existante est conservée et peut recevoir son mode Kanban explicitement.
  await db.query("UPDATE public.smn_team SET agile_mode='kanban' WHERE id='panda'");
  await db.query("COMMIT");
  const rows=await db.query<{id:string;agile_mode:string;is_archived:boolean}>(`SELECT id,agile_mode,is_archived FROM public.smn_team ORDER BY id`);
  assert.deepEqual(rows.rows,[{id:"koala",agile_mode:"scrum",is_archived:false},{id:"panda",agile_mode:"kanban",is_archived:false}]);
  assert.equal((await db.query("SELECT id FROM public.smn_sprint WHERE team_id='koala'")).rows[0]?.id,"sprint-1");
  assert.equal((await db.query("SELECT id FROM public.smn_kanban_period WHERE team_id='panda'")).rows[0]?.id,"period-1");
  assert.equal((await db.query("SELECT schema_version FROM public.smn_installation")).rows[0]?.schema_version,32);
  await assert.rejects(()=>db!.query("UPDATE public.smn_team SET agile_mode='invalid' WHERE id='koala'"),/check constraint/i);
 }finally{
  if(db)await db.end().catch(()=>undefined);
  await admin.query('DROP DATABASE IF EXISTS "'+name+'" WITH (FORCE)').catch(()=>undefined);
  await admin.end();
 }
});
test("SMN-333: une migration v32 invalide annule les modifications atomiquement",{skip:!ci},async()=>{
 assert.ok(approved,"Base CI temporaire requise");
 const admin=new Client({connectionString:uri});await admin.connect();
 const name="smn333rollback_"+randomUUID().replaceAll("-","").slice(0,12);
 let db:Client|undefined;
 try{
  await admin.query('CREATE DATABASE "'+name+'"');
  const target=new URL(uri!);target.pathname="/"+name;
  db=new Client({connectionString:target.toString()});await db.connect();
  await db.query(`CREATE TABLE public.smn_installation(id text PRIMARY KEY,state text NOT NULL,schema_version integer NOT NULL,mode text NOT NULL);
   CREATE TABLE public.smn_team(id text PRIMARY KEY,installation_id text NOT NULL,name text NOT NULL);
   INSERT INTO public.smn_installation VALUES('singleton','initialized',31,'invalid');
   INSERT INTO public.smn_team VALUES('koala','singleton','Koala');`);
  await db.query("BEGIN");
  try{await db.query(sql);await db.query("COMMIT");assert.fail("Une migration incohérente ne doit pas être validée");}
  catch(e){await db.query("ROLLBACK");assert.match(String(e),/constraint|check|invalid/i);}
  assert.equal((await db.query("SELECT schema_version FROM public.smn_installation")).rows[0].schema_version,31);
  assert.equal((await db.query("SELECT id FROM public.smn_team")).rows[0].id,"koala");
  assert.equal((await db.query("SELECT count(*)::int n FROM information_schema.columns WHERE table_name='smn_team' AND column_name='agile_mode'")).rows[0].n,0);
 }finally{
  if(db)await db.end().catch(()=>undefined);
  await admin.query('DROP DATABASE IF EXISTS "'+name+'" WITH (FORCE)').catch(()=>undefined);
  await admin.end();
 }
});
test("SMN-333: v32 incomplète refusée par le contrat d'intégrité",()=>{
 const result=assessSchemaIntegrity("per-team-agile-mode",32,{
  tables:["smn_team"],columns:["smn_team:agile_mode"],constraints:[],
  migrations:["20261029_smn_team_agile_mode_v32"]
 });
 assert.equal(result.ok,false);
 if(!result.ok)assert.equal(result.reason,"structure-incomplete");
});
