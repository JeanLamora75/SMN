import assert from "node:assert/strict";
import {test} from "node:test";
import {Client} from "pg";
import {registryCoreStatements} from "../scripts/apply-registry-core-v32";
import {registryExtensionStatements} from "../scripts/apply-registry-extensions-v32";
import {outcomeDDL} from "../scripts/apply-meeting-outcome-schema-v32";

const source=process.env.SMN_TEST_DATABASE_URL;
const runId=process.env.GITHUB_RUN_ID;
const enabled=process.env.GITHUB_ACTIONS==="true"&&process.env.CI==="true"&&
 typeof source==="string"&&/^postgresql:\/\/smn_ci:[^@]+@127\.0\.0\.1:5432\/smn_ci$/.test(source)&&
 typeof runId==="string"&&/^\d{5,20}$/.test(runId);
test("Registres v32: migration réelle idempotente et données conservées dans une base CI jetable",
 {skip:!enabled,timeout:60000},async()=>{
 if(!enabled||!source||!runId)throw Error("Test DB indisponible");
 const database="smn_ci_registry_"+runId;
 const maintenance=new URL(source);maintenance.pathname="/postgres";
 const target=new URL(source);target.pathname="/"+database;
 const admin=new Client({connectionString:maintenance.toString()});
 await admin.connect();
 let created=false;
 try{
  await admin.query('CREATE DATABASE "'+database+'"');
  created=true;
  const db=new Client({connectionString:target.toString()});
  await db.connect();
  try{
   await db.query("BEGIN");
   await db.query("CREATE TABLE public.smn_installation(id text PRIMARY KEY,schema_version integer NOT NULL,state text NOT NULL)");
   await db.query("CREATE TABLE public.smn_team(id text PRIMARY KEY)");
   await db.query("CREATE TABLE public.smn_account(id text PRIMARY KEY)");
   await db.query("CREATE TABLE public.smn_sprint(id text PRIMARY KEY)");
   await db.query("INSERT INTO public.smn_installation VALUES('singleton',32,'initialized')");
   await db.query("INSERT INTO public.smn_team VALUES('team')");
   await db.query("INSERT INTO public.smn_account VALUES('admin')");
   await db.query("INSERT INTO public.smn_sprint VALUES('sprint')");
   const statements=[...registryCoreStatements,...registryExtensionStatements,...outcomeDDL];
   for(const sql of statements)await db.query(sql);
   const count=await db.query<{total:string}>(`SELECT count(*)::text AS total FROM pg_class c
     JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
     AND c.relkind='r' AND c.relname LIKE 'smn_%'`);
   assert.equal(Number(count.rows[0]?.total),30,"4 tables de socle + 26 tables Registres");
   await db.query(`INSERT INTO public.smn_registry_item
    (id,installation_id,team_id,type,title,occurred_on,status,created_by)
    VALUES('record','singleton','team','risk','Risque conservé','2026-10-29','open','admin')`);
   await db.query(`INSERT INTO public.smn_registry_comment
    (id,item_id,body,author_name) VALUES('comment','record','Historique conservé','admin')`);
   for(const sql of statements)await db.query(sql);
   const rows=await db.query<{title:string;body:string}>(`SELECT r.title,c.body FROM public.smn_registry_item r
     JOIN public.smn_registry_comment c ON c.item_id=r.id WHERE r.id='record'`);
   assert.deepEqual(rows.rows,[{title:"Risque conservé",body:"Historique conservé"}]);
   const indexes=await db.query<{indexname:string}>(`SELECT indexname FROM pg_indexes
     WHERE schemaname='public' AND indexname=ANY($1::text[])`,
    [["smn_registry_item_team_type_date","smn_registry_comment_item_date","smn_calendar_meeting_outcome_by_event"]]);
   assert.equal(indexes.rows.length,3);
   await db.query("ROLLBACK");
  }catch(error){await db.query("ROLLBACK").catch(()=>undefined);throw error;}
  finally{await db.end();}
 }finally{
  if(created)await admin.query('DROP DATABASE IF EXISTS "'+database+'" WITH (FORCE)');
  await admin.end();
 }
});
