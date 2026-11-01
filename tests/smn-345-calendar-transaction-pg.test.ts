import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {saveCompanyClosureV31} from "../src/server/closures/company-service";
import {saveMemberAbsence} from "../src/server/members/absence";
import {lockIndicatorRevisionBeforeCalendarWrite,recalculateCalendarImpactWithinTransaction} from "../src/server/indicators/calendar-integration";

test("SMN-345 transaction partagée : changements non committés, impact dates, rollback",{timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const origin=new URL(ci&&process.env.SMN_TEST_DATABASE_URL?process.env.SMN_TEST_DATABASE_URL:await installedDatabaseUri());
 if(!(origin.pathname==="/smn"||ci&&origin.pathname==="/smn_ci")||
  !["127.0.0.1","localhost","[::1]"].includes(origin.hostname))throw Error("Local test database required");
 const name="smn_345_"+randomBytes(6).toString("hex");
 const adminUri=new URL(origin);adminUri.pathname="/postgres";
 const uri=new URL(origin);uri.pathname="/"+name;
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});
 await admin.connect();let created=false;
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  assert.deepEqual(await installExpress({adminUsername:"admin345",adminEmail:"admin345@example.test",password:"test-only-password345"},uri.toString()),{ok:true});
  const db=new Client({connectionString:uri.toString(),connectionTimeoutMillis:3500});
  await db.connect();
  try{
   await db.query("INSERT INTO public.smn_capacity_settings(installation_id,hours_per_jh) VALUES('singleton',8) ON CONFLICT(installation_id) DO NOTHING");
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES('team345','singleton','Scrum','scrum')");
   await db.query("INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status) VALUES "+
    "('sprint345','team345',1,'Sprint', '2026-11-01','2026-11-14','Europe/Paris','closed'),"+
    "('outside345','team345',2,'Outside','2027-01-01','2027-01-14','Europe/Paris','planned')");
   const company="8999a8a8-6ee2-45a2-8d7f-51f733456782";
   await db.query("INSERT INTO public.smn_company(id,installation_id,name,color) VALUES($1,'singleton','Company','blue')",[company]);
   await db.query("INSERT INTO public.smn_member_batch(id,installation_id,team_id,requested_count) VALUES('batch345','singleton','team345',3)");
   await db.query("INSERT INTO public.smn_member(id,installation_id,batch_id,member_number,display_name,company_id) VALUES('123e4567-e89b-42d3-a456-426614174345','singleton','batch345',1,'Member 345',$1)",[company]);
   await db.query("INSERT INTO public.smn_member_assignment(id,member_id,team_id,start_on,agile_role) VALUES('assignment345','123e4567-e89b-42d3-a456-426614174345','team345','2026-10-01','developer')");
   await db.query("INSERT INTO public.smn_indicator_definition(id,tag,name,indicator_type,formula) VALUES "+
    "('capacity345','CAP345','Capacity','computed','CAL_CAPACITY_JH+1')");
   await db.query("INSERT INTO public.smn_indicator_dependency(id,indicator_id,source_type,source_calendar_tag) VALUES "+
    "('edge345','capacity345','calendar','CAL_CAPACITY_JH')");
   await db.query("BEGIN");
   assert.equal(await lockIndicatorRevisionBeforeCalendarWrite(db),true);
   await db.query("UPDATE public.smn_sprint SET name='Uncommitted' WHERE id='sprint345'");
   const changed=await recalculateCalendarImpactWithinTransaction(db,{
    teamIds:['team345'],startOn:'2026-11-02',endOn:'2026-11-03'
   });
   assert.deepEqual(changed,{cycles:1,results:1});
   const current=await db.query<{result_state:string;value:string|null;unavailable_reason:string|null}>(
    "SELECT result_state,value::text,unavailable_reason FROM public.smn_indicator_computed_result WHERE cycle_id='sprint345'");
   assert.deepEqual(current.rows,[{result_state:"unavailable",value:null,unavailable_reason:"missing_source"}]);
   await db.query("ROLLBACK");
   assert.equal((await db.query<{name:string}>("SELECT name FROM public.smn_sprint WHERE id='sprint345'")).rows[0].name,'Sprint');
   assert.equal((await db.query("SELECT indicator_id FROM public.smn_indicator_computed_result WHERE cycle_id='sprint345'")).rows.length,0);
   await db.query("BEGIN");
   await lockIndicatorRevisionBeforeCalendarWrite(db);
   await db.query("UPDATE public.smn_sprint SET name='Still uncommitted' WHERE id='sprint345'");
   const competitor=new Client({connectionString:uri.toString(),connectionTimeoutMillis:3500});
   await competitor.connect();
   try{
    await competitor.query("BEGIN");
    await competitor.query("SET LOCAL lock_timeout='200ms'");
    await assert.rejects(()=>lockIndicatorRevisionBeforeCalendarWrite(competitor),
      error=>(error as {code?:string}).code==="55P03");
    await competitor.query("ROLLBACK");
   }finally{await competitor.end();}
   await db.query("CREATE FUNCTION public.smn_345_reject() RETURNS trigger LANGUAGE plpgsql AS "+
    "$$ BEGIN RAISE EXCEPTION 'forced-calendar-result-error'; END; $$");
   await db.query("CREATE TRIGGER smn_345_reject BEFORE INSERT ON public.smn_indicator_computed_result FOR EACH ROW EXECUTE FUNCTION public.smn_345_reject()");
   await assert.rejects(()=>recalculateCalendarImpactWithinTransaction(db,{
    teamIds:['team345'],startOn:'2026-11-02',endOn:'2026-11-03'
   }),/forced-calendar-result-error/);
   await db.query("ROLLBACK");
   assert.equal((await db.query<{name:string}>("SELECT name FROM public.smn_sprint WHERE id='sprint345'")).rows[0].name,'Sprint');
   const actor=(await db.query<{id:string}>("SELECT id FROM public.smn_account WHERE role='admin' LIMIT 1")).rows[0].id;
   await db.query("UPDATE public.smn_account SET must_change_password=false WHERE id=$1",[actor]);
   await db.query("INSERT INTO public.smn_absence_category(id,name,color) VALUES('vacation345','Vacances','#336699')");
   const changedClosure=await saveCompanyClosureV31(db,actor,{
    action:"create",companyId:company,name:"Test closure",startOn:"2026-11-02",endOn:"2026-11-03"
   });
   assert.equal(changedClosure.ok,true);
   assert.equal((await db.query<{revision:string}>("SELECT revision::text FROM public.smn_indicator_system_revision WHERE singleton_key='singleton'")).rows[0].revision,"1");
   assert.equal((await db.query("SELECT indicator_id FROM public.smn_indicator_computed_result WHERE cycle_id='sprint345'")).rows.length,1);
   const absence=await saveMemberAbsence(db,"123e4567-e89b-42d3-a456-426614174345",actor,{
    action:"create",revision:0,categoryId:"vacation345",
    startOn:"2026-11-04",endOn:"2026-11-05",startSlot:"morning",endSlot:"afternoon",
    isPlanned:true,reason:"Congé"
   },{actor:{accountId:actor,role:"admin"},teamId:"team345"});
   assert.equal(absence.ok,true);
   assert.equal((await db.query<{revision:string}>("SELECT revision::text FROM public.smn_indicator_system_revision WHERE singleton_key='singleton'")).rows[0].revision,"2");

  }finally{await db.end();}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');}
  finally{await admin.end();}
 }
});
