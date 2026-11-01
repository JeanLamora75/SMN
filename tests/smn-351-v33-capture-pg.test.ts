import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {captureCycleIndicators} from "../src/server/indicators/closure-snapshot";
import {readIndicatorReporting} from "../src/server/indicators/reporting";
test("SMN-351 PG: selected v33 metric snapshot is frozen while live value changes", {timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const source=new URL(ci&&process.env.SMN_TEST_DATABASE_URL?process.env.SMN_TEST_DATABASE_URL:await installedDatabaseUri());
 if(!(source.pathname==="/smn"||ci&&source.pathname==="/smn_ci")||!["127.0.0.1","localhost","[::1]"].includes(source.hostname))throw Error("Local PostgreSQL source required");
 const name="smn_351_capture_"+randomBytes(6).toString("hex");
 const maintenance=new URL(source);maintenance.pathname="/postgres";
 const target=new URL(source);target.pathname="/"+name;
 const admin=new Client({connectionString:maintenance.toString(),connectionTimeoutMillis:3500});
 let created=false;await admin.connect();
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  assert.deepEqual(await installExpress({adminUsername:"admin351",adminEmail:"admin351@example.test",password:"test-only-password351"},target.toString()),{ok:true});
  const db=new Client({connectionString:target.toString(),connectionTimeoutMillis:3500});
  await db.connect();
  try{
   const account=(await db.query<{id:string}>("SELECT id FROM public.smn_account WHERE role='admin'")).rows[0].id;
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES('team351','singleton','Team 351','scrum')");
   await db.query("INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status) VALUES('sprint351','team351',1,'Sprint 351',now()-interval '15 days',now()-interval '1 day','Europe/Paris','finished')");
   await db.query("INSERT INTO public.smn_indicator_definition(id,tag,name,indicator_type,unit_short) VALUES('metric351','METRIC351','Tickets completed','manual','tck')");
   await db.query("INSERT INTO public.smn_indicator_team_selection(team_id,indicator_id,is_active) VALUES('team351','metric351',true)");
   await db.query("INSERT INTO public.smn_indicator_display_preference(team_id,indicator_id,screen_key,is_visible,display_order,display_style) VALUES('team351','metric351','reports',true,1,'number')");
   await db.query("INSERT INTO public.smn_indicator_manual_value(team_id,cycle_type,cycle_id,indicator_id,value,updated_by) VALUES('team351','scrum','sprint351','metric351',0,$1)",[account]);
   const frozen=await captureCycleIndicators(db,"team351","sprint351");
   assert.deepEqual(frozen.map(v=>({tag:v.tag,value:v.value,state:v.state})),[{tag:"METRIC351",value:"0",state:"available"}]);
   const live=await readIndicatorReporting(db,"team351","reports","scrum",["sprint351"]);
   assert.equal(live.cycles[0].values.metric351,"0");
   await db.query("UPDATE public.smn_indicator_manual_value SET value=7 WHERE team_id='team351' AND indicator_id='metric351'");
   assert.equal((await readIndicatorReporting(db,"team351","reports","scrum",["sprint351"])).cycles[0].values.metric351,"7");
   assert.equal(frozen[0].value,"0","previously captured values must not be recalculated");
  }finally{await db.end();}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');}
  finally{await admin.end();}
 }
});
