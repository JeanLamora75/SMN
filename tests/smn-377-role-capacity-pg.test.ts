import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {Client} from "pg";
import {installExpress} from "../src/server/installation/install";
import {installedDatabaseUri} from "../src/server/auth/database";
import {loadRoleCapacityResolver} from "../src/server/indicators/formula/role-context";
import {recalculateIndicatorResults} from "../src/server/indicators/recalculation";

test("SMN-377 PG: role capacity is period-scoped, distinguishes absences and recalculates", {timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const origin=new URL(ci&&process.env.SMN_TEST_DATABASE_URL?process.env.SMN_TEST_DATABASE_URL:await installedDatabaseUri());
 if(!(origin.pathname==="/smn"||ci&&origin.pathname==="/smn_ci")||
  !["127.0.0.1","localhost","[::1]"].includes(origin.hostname))
  throw Error("Disposable local PostgreSQL source required");
 const name="smn_377_"+randomBytes(6).toString("hex");
 const adminUri=new URL(origin);adminUri.pathname="/postgres";
 const dbUri=new URL(origin);dbUri.pathname="/"+name;
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});
 await admin.connect();let created=false;
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  assert.deepEqual(await installExpress({
   adminUsername:"admin377",adminEmail:"admin377@example.test",password:"test-only-password377"
  },dbUri.toString()),{ok:true});
  const db=new Client({connectionString:dbUri.toString(),connectionTimeoutMillis:3500});
  await db.connect();
  try{
   await db.query("INSERT INTO public.smn_capacity_settings(installation_id,hours_per_jh) VALUES('singleton',8) ON CONFLICT(installation_id) DO NOTHING");
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES('team377','singleton','Capacity team','scrum'),('outside377','singleton','Other team','scrum')");
   await db.query(`INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status) VALUES
    ('sprint377','team377',1,'Sprint 377','2026-11-09T00:00:00+01','2026-11-10T23:59:59+01','Europe/Paris','planned'),
    ('outside377','outside377',1,'Other sprint','2026-11-09T00:00:00+01','2026-11-10T23:59:59+01','Europe/Paris','planned')`);
   await db.query("INSERT INTO public.smn_member_batch(id,installation_id,team_id,requested_count) VALUES('batch377','singleton','team377',3)");
   await db.query(`INSERT INTO public.smn_member(id,installation_id,batch_id,member_number,display_name)
    VALUES('123e4567-e89b-42d3-a456-426614174377','singleton','batch377',1,'Membre 377')`);
   await db.query(`INSERT INTO public.smn_member_assignment(id,member_id,team_id,start_on,agile_role)
    VALUES('assignment377','123e4567-e89b-42d3-a456-426614174377','team377','2026-10-01','developer')`);
   await db.query(`INSERT INTO public.smn_member_assignment_version
    (id,assignment_id,revision,effective_from,allocation_percent,contract_percent,contribution_percent,scrum_master_percent,product_owner_percent,developer_percent)
    VALUES('version377','assignment377',1,'2026-10-01',100,100,100,50,0,50)`);
   await db.query("INSERT INTO public.smn_absence_category(id,name,color) VALUES('leave','Congés','#4F83CC'),('sick','Maladie','#D17B38') ON CONFLICT(id) DO NOTHING");
   await db.query(`INSERT INTO public.smn_member_absence
    (id,member_id,category_id,start_on,end_on,start_slot,end_slot,is_planned,reason) VALUES
    ('absence377a','123e4567-e89b-42d3-a456-426614174377','leave','2026-11-09','2026-11-09','morning','afternoon',true,'Congés'),
    ('absence377b','123e4567-e89b-42d3-a456-426614174377','sick','2026-11-10','2026-11-10','morning','afternoon',false,'Imprévu')`);
   const scope={teamId:"team377",cycleType:"scrum" as const,cycleId:"sprint377"};
   const requests=[
    {name:"ROLE_MAX_JH" as const,role:"DEVELOPER" as const},
    {name:"ROLE_JH_PLANNED" as const,role:"DEVELOPER" as const},
    {name:"ROLE_JH" as const,role:"DEVELOPER" as const},
    {name:"ROLE_MAX_JH" as const,role:"SCRUM_MASTER" as const}
   ];
   const first=await loadRoleCapacityResolver(db,scope,requests);
   assert.deepEqual(first("ROLE_MAX_JH","DEVELOPER"),{kind:"available",value:"1"});
   assert.deepEqual(first("ROLE_JH_PLANNED","DEVELOPER"),{kind:"available",value:"0.5"});
   assert.deepEqual(first("ROLE_JH","DEVELOPER"),{kind:"available",value:"0"});
   assert.deepEqual(first("ROLE_MAX_JH","SCRUM_MASTER"),{kind:"available",value:"1"});
   const outside=await loadRoleCapacityResolver(db,{...scope,teamId:"outside377",cycleId:"outside377"},requests);
   assert.equal(outside("ROLE_JH","DEVELOPER").kind,"unavailable");
   await db.query(`INSERT INTO public.smn_indicator_definition(id,tag,name,indicator_type,formula)
    VALUES('role377','ROLE_IMPACT_377','Capacité perdue','computed',
    'ROLE_JH_PLANNED("DEVELOPER")-ROLE_JH("DEVELOPER")')`);
   const calc=await recalculateIndicatorResults(db,{teamId:"team377"});
   assert.deepEqual(calc,{cycles:1,results:1});
   const get=async()=> (await db.query<{value:string|null;result_state:string}>(
    "SELECT value::text,result_state FROM public.smn_indicator_computed_result WHERE team_id='team377' AND cycle_id='sprint377' AND indicator_id='role377'")).rows[0];
   assert.deepEqual(await get(),{value:"0.5",result_state:"available"});
   await db.query("UPDATE public.smn_member_absence SET is_planned=false WHERE id='absence377a'");
   await db.query("UPDATE public.smn_sprint SET status='closed' WHERE id='sprint377'");
   const refreshed=await recalculateIndicatorResults(db,{teamId:"team377",
    changedCalendarTags:["CAL_ABSENCE_DAYS"],cycles:[scope]});
   assert.deepEqual(refreshed,{cycles:1,results:1});
   assert.deepEqual(await get(),{value:"1",result_state:"available"});
  }finally{await db.end().catch(()=>undefined)}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)')}
  finally{await admin.end().catch(()=>undefined)}
 }
});
