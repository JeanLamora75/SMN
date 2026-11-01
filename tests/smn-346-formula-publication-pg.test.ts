import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {previewFormula,publishFormula,FormulaPublicationError} from "../src/server/indicators/formula-publication";

test("SMN-346 : simulation sans écritures, publication atomique, stale et rollback",{timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const origin=new URL(ci&&process.env.SMN_TEST_DATABASE_URL?process.env.SMN_TEST_DATABASE_URL:await installedDatabaseUri());
 if(!(origin.pathname==="/smn"||ci&&origin.pathname==="/smn_ci")||!["127.0.0.1","localhost","[::1]"].includes(origin.hostname))
  throw Error("isolated local database required");
 const name="smn_346_"+randomBytes(6).toString("hex"),adminUri=new URL(origin),uri=new URL(origin);
 adminUri.pathname="/postgres";uri.pathname="/"+name;
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});
 await admin.connect();let created=false;
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  assert.deepEqual(await installExpress({adminUsername:"admin346",adminEmail:"admin346@example.test",password:"test-only-password346"},uri.toString()),{ok:true});
  const db=new Client({connectionString:uri.toString(),connectionTimeoutMillis:3500});await db.connect();
  try{
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES('team346','singleton','Scrum','scrum')");
   await db.query("INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status) VALUES "+
    "('s346a','team346',1,'Closed','2026-10-01','2026-10-14','Europe/Paris','closed'),"+
    "('s346b','team346',2,'Planned','2026-11-01','2026-11-14','Europe/Paris','planned')");
   await db.query("INSERT INTO public.smn_indicator_definition(id,tag,name,indicator_type,formula,formula_revision) VALUES "+
    "('a346','A346','Manual','manual',null,0),"+
    "('b346','B346','Calculated','computed','A346+1',1),"+
    "('c346','C346','Dependent','computed','B346*2',1)");
   await db.query("INSERT INTO public.smn_indicator_dependency(id,indicator_id,source_type,source_indicator_id) VALUES "+
    "('ba346','b346','indicator','a346'),('cb346','c346','indicator','b346')");
   await db.query("INSERT INTO public.smn_indicator_manual_value(team_id,cycle_type,cycle_id,indicator_id,value) VALUES "+
    "('team346','scrum','s346a','a346',2),('team346','scrum','s346b','a346',5)");
   const proposal={indicatorId:"b346",formula:"A346+3"};
   const preview=await previewFormula(db,proposal);
   assert.equal(preview.cycles,2);assert.equal(preview.results,4);
   assert.deepEqual(preview.affectedIndicators,["b346","c346"]);
   assert.equal(preview.unavailable,0);
   assert.equal((await db.query("SELECT formula FROM public.smn_indicator_definition WHERE id='b346'")).rows[0].formula,"A346+1");
   assert.equal((await db.query("SELECT count(*)::int AS n FROM public.smn_indicator_computed_result")).rows[0].n,0);
   await db.query("UPDATE public.smn_indicator_system_revision SET revision=revision+1 WHERE singleton_key='singleton'");
   assert.deepEqual(await publishFormula(db,proposal,preview),{ok:false,error:"stale_preview"});
   const contentPreview=await previewFormula(db,proposal);
   await db.query("UPDATE public.smn_indicator_manual_value SET value=9 WHERE team_id='team346' AND cycle_id='s346a' AND indicator_id='a346'");
   assert.deepEqual(await publishFormula(db,proposal,contentPreview),{ok:false,error:"stale_preview"});
   await db.query("UPDATE public.smn_indicator_manual_value SET value=2 WHERE team_id='team346' AND cycle_id='s346a' AND indicator_id='a346'");
   const fresh=await previewFormula(db,proposal);
   assert.notEqual(fresh.fingerprint,preview.fingerprint);
   const done=await publishFormula(db,proposal,fresh);
   assert.deepEqual(done,{ok:true,revision:"2",cycles:2,results:4});
   const rows=await db.query<{cycle_id:string;indicator_id:string;value:string;formula_revision:string}>(
    "SELECT cycle_id,indicator_id,value::text,formula_revision::text FROM public.smn_indicator_computed_result ORDER BY cycle_id,indicator_id");
   assert.deepEqual(rows.rows.map(r=>[r.cycle_id,r.indicator_id,r.value]),[
    ["s346a","b346","5"],["s346a","c346","10"],["s346b","b346","8"],["s346b","c346","16"]]);
   assert.equal(rows.rows[0].formula_revision,"2");
   assert.deepEqual(await publishFormula(db,proposal,fresh),{ok:false,error:"stale_preview"});
   await assert.rejects(()=>previewFormula(db,{indicatorId:"b346",formula:"C346+1"}),e=>e instanceof FormulaPublicationError&&e.code==="invalid_formula");
   assert.equal((await db.query("SELECT formula FROM public.smn_indicator_definition WHERE id='b346'")).rows[0].formula,"A346+3");
   const next={indicatorId:"b346",formula:"A346+4"};
   const beforeFail=await previewFormula(db,next);
   await db.query("CREATE FUNCTION public.smn_346_fail() RETURNS trigger LANGUAGE plpgsql AS "+
    "$$ BEGIN IF NEW.indicator_id='c346' THEN RAISE EXCEPTION 'forced-publish-failure'; END IF; RETURN NEW; END; $$");
   await db.query("CREATE TRIGGER smn_346_fail BEFORE UPDATE ON public.smn_indicator_computed_result FOR EACH ROW EXECUTE FUNCTION public.smn_346_fail()");
   await assert.rejects(()=>publishFormula(db,next,beforeFail),/forced-publish-failure/);
   assert.equal((await db.query("SELECT formula FROM public.smn_indicator_definition WHERE id='b346'")).rows[0].formula,"A346+3");
   assert.deepEqual((await db.query("SELECT id,indicator_id,source_indicator_id FROM public.smn_indicator_dependency WHERE indicator_id='b346'")).rows.map(x=>[x.indicator_id,x.source_indicator_id]),[["b346","a346"]]);
   assert.equal((await db.query<{revision:string}>("SELECT revision::text FROM public.smn_indicator_system_revision WHERE singleton_key='singleton'")).rows[0].revision,"2");
  }finally{await db.end();}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');}
  finally{await admin.end();}
 }
});
