import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {randomBytes} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";

test("SMN-338 : DDL et contraintes sur une base PostgreSQL temporaire dédiée", {timeout:90000},async()=>{
 const source=new URL(await installedDatabaseUri());
 if(!["postgres:","postgresql:"].includes(source.protocol))throw Error("URI PostgreSQL requise");
 if(source.pathname!=="/smn")throw Error("Sécurité : connexion source attendue sur la base smn ; aucune opération exécutée");
 if(source.hostname!== "127.0.0.1" && source.hostname!=="localhost" && source.hostname!=="::1")
  throw Error("Sécurité : serveur PostgreSQL local obligatoire");
 const name="smn_338_test_"+randomBytes(6).toString("hex");
 const adminUrl=new URL(source.toString());adminUrl.pathname="/postgres";
 const testUrl=new URL(source.toString());testUrl.pathname="/"+name;
 const admin=new Client({connectionString:adminUrl.toString(),connectionTimeoutMillis:3500,statement_timeout:15000});
 await admin.connect();let created=false;
 try{
  const identity=await admin.query<{name:string;can_create:boolean}>(`SELECT current_database() AS name,
   (SELECT rolcreatedb OR rolsuper FROM pg_catalog.pg_roles WHERE rolname=current_user) AS can_create`);
  assert.equal(identity.rows[0]?.name,"postgres");
  if(!identity.rows[0]?.can_create)throw Error("Le rôle PostgreSQL local ne possède pas CREATEDB. Aucune modification.");
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  const db=new Client({connectionString:testUrl.toString(),connectionTimeoutMillis:3500,statement_timeout:15000});
  await db.connect();
  try{
   assert.equal((await db.query<{name:string}>("SELECT current_database() AS name")).rows[0]?.name,name);
   await db.query("BEGIN");
   await db.query("CREATE TABLE public.smn_team(id text PRIMARY KEY)");
   await db.query("CREATE TABLE public.smn_account(id text PRIMARY KEY)");
   const ddl=readFileSync(new URL("../_bmad-output/planning-artifacts/SMN-338-DDL-ADDITIF-DRAFT.sql",import.meta.url),"utf8");
   assert.doesNotMatch(ddl,/\\b(?:DROP|TRUNCATE)\\s+(?:TABLE|DATABASE|SCHEMA)\\b/i);
   await db.query(ddl);
   const tables=await db.query<{n:string}>(`SELECT count(*)::text AS n FROM pg_catalog.pg_class
    WHERE relnamespace='public'::regnamespace AND relkind='r' AND relname LIKE 'smn_indicator_%'`);
   assert.equal(tables.rows[0]?.n,"8");
   await db.query("INSERT INTO public.smn_team(id) VALUES ('team-1'),('team-2')");
   await db.query("INSERT INTO public.smn_account(id) VALUES ('account')");
   await db.query(`INSERT INTO public.smn_indicator_definition(id,tag,name,indicator_type)
    VALUES('ind-a','IND_A','A','manual'),('ind-b','IND_B','B','manual')`);
   await db.query("INSERT INTO public.smn_indicator_team_selection(team_id,indicator_id) VALUES('team-1','ind-a')");
   await db.query(`INSERT INTO public.smn_indicator_manual_value(team_id,cycle_type,cycle_id,indicator_id,value)
    VALUES('team-1','scrum','sprint-1','ind-a',NULL),('team-1','scrum','sprint-2','ind-a',0)`);
   const values=await db.query<{cycle_id:string;value:string|null}>(`SELECT cycle_id,value::text FROM public.smn_indicator_manual_value ORDER BY cycle_id`);
   assert.equal(values.rows[0]?.value,null);
   assert.equal(values.rows[1]?.value,"0");
   // pg_triggers and FK checks are exercised with SAVEPOINTs, without committing any test data.
   async function mustReject(sql:string,params:unknown[]=[]){
    await db.query("SAVEPOINT smn338_probe");
    try{await db.query(sql,params);assert.fail("Requête invalide acceptée : "+sql)}
    catch(e){if(e instanceof assert.AssertionError)throw e}
    finally{await db.query("ROLLBACK TO SAVEPOINT smn338_probe");await db.query("RELEASE SAVEPOINT smn338_probe")}
   }
   await mustReject(`INSERT INTO public.smn_indicator_definition(id,tag,name,indicator_type)
    VALUES('bad','bad','Bad','manual')`);
   await mustReject(`INSERT INTO public.smn_indicator_team_selection(team_id,indicator_id)
    VALUES('missing-team','ind-a')`);
   await mustReject(`INSERT INTO public.smn_indicator_display_preference(team_id,indicator_id,screen_key)
    VALUES('team-2','ind-a','dashboard')`);
   await mustReject(`INSERT INTO public.smn_indicator_manual_value(team_id,cycle_type,cycle_id,indicator_id)
    VALUES('team-1','wrong','x','ind-a')`);
   await mustReject(`INSERT INTO public.smn_indicator_computed_result
    (team_id,cycle_type,cycle_id,indicator_id,result_state,value,formula_revision)
    VALUES('team-1','scrum','sprint-1','ind-b','available',NULL,1)`);
   await mustReject(`INSERT INTO public.smn_indicator_computed_result
    (team_id,cycle_type,cycle_id,indicator_id,result_state,value,formula_revision)
    VALUES('team-1','scrum','sprint-1','ind-b','unavailable',NULL,1)`);
   await mustReject(`INSERT INTO public.smn_indicator_dependency(id,indicator_id,source_type,source_indicator_id)
    VALUES('self','ind-a','indicator','ind-a')`);
   await db.query(`INSERT INTO public.smn_indicator_dependency(id,indicator_id,source_type,source_indicator_id)
    VALUES('dep-1','ind-b','indicator','ind-a')`);
   await mustReject(`INSERT INTO public.smn_indicator_dependency(id,indicator_id,source_type,source_indicator_id)
    VALUES('dep-2','ind-b','indicator','ind-a')`);
   await db.query(`INSERT INTO public.smn_indicator_dependency(id,indicator_id,source_type,source_calendar_tag)
    VALUES('cal-1','ind-b','calendar','HOLIDAYS')`);
   await mustReject(`INSERT INTO public.smn_indicator_dependency(id,indicator_id,source_type,source_calendar_tag)
    VALUES('cal-2','ind-b','calendar','HOLIDAYS')`);
   const crossTeam=await db.query<{n:string}>(`SELECT count(*)::text n FROM public.smn_indicator_manual_value WHERE team_id='team-2'`);
   assert.equal(crossTeam.rows[0]?.n,"0");
   await db.query("ROLLBACK");
   // Temporary database is dropped, no DDL/records reach the installed SMN database.
  }catch(e){await db.query("ROLLBACK").catch(()=>undefined);throw e}
  finally{await db.end().catch(()=>undefined)}
 }finally{
  if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');
  await admin.end().catch(()=>undefined);
 }
});
