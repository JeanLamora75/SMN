import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {recalculateIndicatorResults} from "../src/server/indicators/recalculation";
import {writeManualValues} from "../src/server/indicators/manual-values";

test("SMN-344 : v33 résultats différentiés, cascade et rollback",{timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const origin=new URL(ci&&process.env.SMN_TEST_DATABASE_URL?process.env.SMN_TEST_DATABASE_URL:await installedDatabaseUri());
 if(!(origin.pathname==="/smn"||ci&&origin.pathname==="/smn_ci")||
  !["127.0.0.1","localhost","[::1]"].includes(origin.hostname))throw Error("Local SMN source required");
 const name="smn_344_"+randomBytes(6).toString("hex");
 const adminUri=new URL(origin);adminUri.pathname="/postgres";
 const uri=new URL(origin);uri.pathname="/"+name;
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});
 await admin.connect();let created=false;
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  const result=await installExpress({adminUsername:"admin344",adminEmail:"admin344@example.test",password:"test-only-password344"},uri.toString());
  assert.deepEqual(result,{ok:true});
  const db=new Client({connectionString:uri.toString(),connectionTimeoutMillis:3500});await db.connect();
  try{
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES('t-s','singleton','Scrum','scrum'),('t-k','singleton','Kanban','kanban')");
   await db.query("INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status) VALUES "+
    "('s-one','t-s',1,'One',now()-interval '30 days',now()-interval '20 days','Europe/Paris','closed'),"+
    "('s-two','t-s',2,'Two',now()-interval '19 days',now()+interval '5 days','Europe/Paris','active'),"+
    "('s-three','t-s',3,'Three',now()+interval '6 days',now()+interval '15 days','Europe/Paris','planned')");
   await db.query("INSERT INTO public.smn_kanban_period(id,team_id,name,start_on,end_on,time_zone,status) VALUES "+
    "('k-one','t-k','Kanban',current_date-20,current_date-10,'Europe/Paris','closed')");
   await db.query("INSERT INTO public.smn_indicator_definition(id,tag,name,indicator_type,formula,formula_revision) VALUES "+
    "('a','A','A','manual',null,0),('b','B','B','computed','A+1',2),"+
    "('c','C','C','computed','B*2',5),('d','D','D','computed','1/0',1),"+
    "('e','E','E','computed','CAL_WORKING_DAYS+1',6)");
   await db.query("INSERT INTO public.smn_indicator_dependency(id,indicator_id,source_type,source_indicator_id) VALUES "+
    "('ab','b','indicator','a'),('bc','c','indicator','b')");
   await db.query("INSERT INTO public.smn_indicator_manual_value(team_id,cycle_type,cycle_id,indicator_id,value) VALUES "+
    "('t-s','scrum','s-one','a',0),('t-s','scrum','s-two','a',3),('t-k','kanban','k-one','a',7)");
   await db.query("INSERT INTO public.smn_indicator_dependency(id,indicator_id,source_type,source_calendar_tag) VALUES('ce','e','calendar','CAL_WORKING_DAYS')");
   const first=await recalculateIndicatorResults(db,{teamId:"t-s"});
   assert.deepEqual(first,{cycles:3,results:12});
   const read=()=>db.query<{cycle_id:string;indicator_id:string;result_state:string;value:string|null;unavailable_reason:string|null;unavailable_source_tag:string|null;formula_revision:string}>(
    "SELECT cycle_id,indicator_id,result_state,value::text,unavailable_reason,unavailable_source_tag,formula_revision::text "+
    "FROM public.smn_indicator_computed_result WHERE team_id='t-s' ORDER BY cycle_id,indicator_id");
   const stored=(await read()).rows;
   assert.deepEqual(stored.filter(x=>x.cycle_id==="s-one").map(x=>[x.indicator_id,x.value,x.unavailable_reason]),[
    ["b","1",null],["c","2",null],["d",null,"division_by_zero"],["e",null,"missing_source"]]);
   assert.equal(stored.find(x=>x.indicator_id==="c")?.formula_revision,"5");
   const only=await recalculateIndicatorResults(db,{teamId:"t-s",changedIndicatorIds:["a"],cycles:[{teamId:"t-s",cycleType:"scrum",cycleId:"s-one"}]});
   assert.deepEqual(only,{cycles:1,results:2});
   await db.query("UPDATE public.smn_indicator_manual_value SET value=NULL WHERE team_id='t-s' AND cycle_id='s-one' AND indicator_id='a'");
   await recalculateIndicatorResults(db,{teamId:"t-s",changedIndicatorIds:["a"],cycles:[{teamId:"t-s",cycleType:"scrum",cycleId:"s-one"}]});
   const missing=(await read()).rows;
   assert.equal(missing.find(x=>x.cycle_id==="s-one"&&x.indicator_id==="b")?.unavailable_reason,"missing_source");
   assert.equal(missing.find(x=>x.cycle_id==="s-one"&&x.indicator_id==="c")?.unavailable_reason,"dependency_unavailable");
   assert.equal(missing.find(x=>x.cycle_id==="s-one"&&x.indicator_id==="c")?.unavailable_source_tag,"B");
   const changedCalendar=await recalculateIndicatorResults(db,{
    teamId:"t-s",changedCalendarTags:["CAL_WORKING_DAYS"],
    cycles:[{teamId:"t-s",cycleType:"scrum",cycleId:"s-one"}],
    calendarSources:{"scrum:s-one":{CAL_WORKING_DAYS:"4"}}
   });
   assert.deepEqual(changedCalendar,{cycles:1,results:1});
   assert.equal((await read()).rows.find(x=>x.cycle_id==="s-one"&&x.indicator_id==="e")?.value,"5");
   const kanban=await recalculateIndicatorResults(db,{teamId:"t-k"});
   assert.deepEqual(kanban,{cycles:1,results:4});
   await db.query("CREATE FUNCTION public.smn_344_reject() RETURNS trigger LANGUAGE plpgsql AS "+
    "$$ BEGIN IF NEW.indicator_id='c' THEN RAISE EXCEPTION 'forced-result-failure'; END IF; RETURN NEW; END; $$");
   await db.query("CREATE TRIGGER smn_344_reject BEFORE INSERT OR UPDATE ON public.smn_indicator_computed_result FOR EACH ROW EXECUTE FUNCTION public.smn_344_reject()");
   await db.query("INSERT INTO public.smn_indicator_team_selection(team_id,indicator_id) VALUES('t-s','a')");
   await db.query("UPDATE public.smn_account SET must_change_password=false WHERE role='admin'");
   const actor=(await db.query<{id:string}>("SELECT id FROM public.smn_account WHERE role='admin' LIMIT 1")).rows[0].id;
   const beforeManual=(await db.query<{value:string|null}>("SELECT value::text FROM public.smn_indicator_manual_value WHERE team_id='t-s' AND cycle_id='s-one' AND indicator_id='a'")).rows[0].value;
   await assert.rejects(()=>writeManualValues(db,actor,{teamId:"t-s",cycleType:"scrum",cycleId:"s-one",expectedRevision:0,changes:[{indicatorId:"a",value:"42"}]}),/forced-result-failure/);
   assert.equal((await db.query<{value:string|null}>("SELECT value::text FROM public.smn_indicator_manual_value WHERE team_id='t-s' AND cycle_id='s-one' AND indicator_id='a'")).rows[0].value,beforeManual);
   assert.equal((await db.query<{n:string}>("SELECT count(*)::text AS n FROM public.smn_indicator_cycle_revision WHERE team_id='t-s' AND cycle_id='s-one'")).rows[0].n,"0");
   const before=(await read()).rows;
   await assert.rejects(()=>recalculateIndicatorResults(db,{teamId:"t-s"}),/forced-result-failure/);
   assert.deepEqual((await read()).rows,before);
   await db.query("DROP TRIGGER smn_344_reject ON public.smn_indicator_computed_result");
   await db.query("DROP FUNCTION public.smn_344_reject()");
   await assert.rejects(()=>recalculateIndicatorResults(db,{teamId:"t-s",cycles:[{teamId:"t-s",cycleType:"scrum",cycleId:"k-one"}]}));
   assert.equal((await db.query("SELECT count(*)::int AS n FROM public.smn_indicator_computed_result WHERE team_id='t-k'")).rows[0].n,4);
  }finally{await db.end();}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)')}
  finally{await admin.end();}
 }
});
