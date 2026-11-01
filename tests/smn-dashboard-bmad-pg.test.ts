import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {assignDashboardSlot,readDashboardSlots} from "../src/server/indicators/dashboard-slots";
import {readDashboardCockpit} from "../src/server/indicators/dashboard-cockpit";
import {applyDashboardSlots} from "../scripts/apply-dashboard-slots";

test("Dashboard B01/B02 PG: native schema, 4/2/2 limits, collision, team isolation and frozen snapshot",{timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const source=new URL(ci&&process.env.SMN_TEST_DATABASE_URL?process.env.SMN_TEST_DATABASE_URL:await installedDatabaseUri());
 if(!(source.pathname==="/smn"||ci&&source.pathname==="/smn_ci")||!["127.0.0.1","localhost","[::1]"].includes(source.hostname))throw Error("Local PostgreSQL source required");
 const name="smn_dashboard_bmad_"+randomBytes(6).toString("hex");
 const maintenance=new URL(source);maintenance.pathname="/postgres";
 const target=new URL(source);target.pathname="/"+name;
 const admin=new Client({connectionString:maintenance.toString(),connectionTimeoutMillis:3500});
 let created=false;await admin.connect();
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  assert.deepEqual(await installExpress({adminUsername:"adminDash",adminEmail:"admin-dash@example.test",password:"test-only-password-dashboard"},target.toString()),{ok:true});
  const db=new Client({connectionString:target.toString(),connectionTimeoutMillis:3500});
  await db.connect();
  try{
   assert.equal((await applyDashboardSlots(db,false)).alreadyInstalled,true);
   const a=(await db.query<{id:string}>("SELECT id FROM public.smn_account WHERE role='admin'")).rows[0].id;
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES('dashteam1','singleton','Dashboard Team','scrum'),('dashteam2','singleton','Other Team','scrum')");
   await db.query("INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status) VALUES('dashsprint1','dashteam1',1,'Dashboard Sprint',now()-interval '15 days',now()-interval '1 day','Europe/Paris','closed')");
   await db.query("INSERT INTO public.smn_indicator_definition(id,tag,name,indicator_type,unit_short) VALUES('dashmetric1','DASH_METRIC','Dashboard metric','manual','sp')");
   await db.query("INSERT INTO public.smn_indicator_team_selection(team_id,indicator_id,is_active) VALUES('dashteam1','dashmetric1',true)");
   await db.query("INSERT INTO public.smn_indicator_manual_value(team_id,cycle_type,cycle_id,indicator_id,value,updated_by) VALUES('dashteam1','scrum','dashsprint1','dashmetric1',77,$1)",[a]);
   await assignDashboardSlot(db,"dashteam1","story_points",1,"dashmetric1");
   assert.equal((await readDashboardSlots(db,"dashteam1")).length,1);
   assert.equal((await readDashboardSlots(db,"dashteam2")).length,0);
   await assert.rejects(()=>assignDashboardSlot(db,"dashteam1","story_points",5,"dashmetric1"),/invalid-input/);
   await assert.rejects(()=>assignDashboardSlot(db,"dashteam1","tickets",3,"dashmetric1"),/invalid-input/);
   await db.query("INSERT INTO public.smn_sprint_closure_snapshot(id,sprint_id,version,snapshot,actor_id) VALUES($1,'dashsprint1',1,$2::jsonb,$3)",[randomUUID(),JSON.stringify({indicatorsV33:[{id:"dashmetric1",tag:"DASH_METRIC",name:"Dashboard metric",unit:"sp",type:"manual",state:"available",value:"12"}]}),a]);
   const blocks=await readDashboardCockpit(db,"dashteam1","scrum","dashsprint1");
   assert.deepEqual(blocks.map(b=>b.positions.length),[4,2,2]);
   assert.equal(blocks[0].positions[0].indicator?.value,"12");
   assert.equal(blocks[0].positions[1].indicator,null);
   await db.query("UPDATE public.smn_indicator_manual_value SET value=99 WHERE team_id='dashteam1' AND indicator_id='dashmetric1'");
   assert.equal((await readDashboardCockpit(db,"dashteam1","scrum","dashsprint1"))[0].positions[0].indicator?.value,"12");
   assert.equal((await readDashboardCockpit(db,"dashteam2","scrum"))[0].positions[0].indicator,null);
  }finally{await db.end();}
 }finally{try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');}finally{await admin.end();}}
});
