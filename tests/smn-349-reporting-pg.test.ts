import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {applyCatalogCommand} from "../src/server/indicators/catalog";
import {readIndicatorReporting} from "../src/server/indicators/reporting";

test("SMN-349 PostgreSQL: configured screens, all statuses, NULL and team isolation",{timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const base=new URL(ci&&process.env.SMN_TEST_DATABASE_URL?process.env.SMN_TEST_DATABASE_URL:await installedDatabaseUri());
 if(!(base.pathname==="/smn"||ci&&base.pathname==="/smn_ci")||!["127.0.0.1","localhost","[::1]"].includes(base.hostname))throw Error("Isolated local PG required");
 const name="smn_349_"+randomBytes(6).toString("hex"),adminUri=new URL(base),uri=new URL(base);
 adminUri.pathname="/postgres";uri.pathname="/"+name;
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});
 await admin.connect();let created=false;
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  assert.deepEqual(await installExpress({adminUsername:"admin349",adminEmail:"admin349@example.test",password:"test-only-password349"},uri.toString()),{ok:true});
  const db=new Client({connectionString:uri.toString(),connectionTimeoutMillis:3500});await db.connect();
  try{
   const account=(await db.query<{id:string}>("SELECT id FROM public.smn_account WHERE role='admin'")).rows[0].id;
   await db.query("UPDATE public.smn_account SET must_change_password=false WHERE id=$1",[account]);
   const actor={accountId:account,role:"admin" as const};
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES('team349a','singleton','A','scrum'),('team349b','singleton','B','scrum'),('team349k','singleton','K','kanban')");
   await db.query("INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status) VALUES ('s349a','team349a',1,'Planned','2026-09-01','2026-09-15','Europe/Paris','planned'),('s349b','team349a',2,'Finished','2026-09-16','2026-09-30','Europe/Paris','finished'),('s349c','team349a',3,'Closed','2026-10-01','2026-10-15','Europe/Paris','closed'),('s349other','team349b',1,'Other','2026-10-01','2026-10-15','Europe/Paris','closed')");
   await db.query("INSERT INTO public.smn_kanban_period(id,team_id,name,start_on,end_on,time_zone,status) VALUES('k349','team349k','Kanban',current_date-15,current_date-1,'Europe/Paris','closed')");
   const createdIndicator=await applyCatalogCommand(db,actor,{action:"create",tag:"CUSTOM349",name:"Custom duration",unitShort:"d",indicatorType:"manual"});
   if(typeof createdIndicator.id!=="string")throw Error("missing id");
   const id=createdIndicator.id;
   for(const teamId of ["team349a","team349k"])await applyCatalogCommand(db,actor,{action:"selection",teamId,indicatorId:id,active:true});
   await applyCatalogCommand(db,actor,{action:"preference",teamId:"team349a",indicatorId:id,screenKey:"cycle_list",visible:true,order:2,style:"number"});
   await applyCatalogCommand(db,actor,{action:"preference",teamId:"team349a",indicatorId:id,screenKey:"trends",visible:true,order:1,style:"line"});
   await applyCatalogCommand(db,actor,{action:"preference",teamId:"team349k",indicatorId:id,screenKey:"trends",visible:true,order:1,style:"bar"});
   await db.query("INSERT INTO public.smn_indicator_manual_value(team_id,cycle_type,cycle_id,indicator_id,value,updated_by) VALUES('team349a','scrum','s349a',$1,0,$2),('team349a','scrum','s349c',$1,5,$2),('team349k','kanban','k349',$1,9,$2)",[id,account]);
   const list=await readIndicatorReporting(db,"team349a","cycle_list","scrum");
   assert.deepEqual(list.columns.map(x=>x.tag),["CUSTOM349"]);
   assert.deepEqual(list.cycles.map(x=>x.status),["planned","finished","closed"]);
   assert.deepEqual(list.cycles.map(x=>x.values[id]),["0",null,"5"]);
   assert.ok(list.cycles.every(x=>x.id!=="s349other"));
   const trends=await readIndicatorReporting(db,"team349a","trends","scrum");
   assert.deepEqual(trends.cycles.map(x=>x.values[id]),["0",undefined,"5"]);
   assert.equal(trends.columns[0].style,"line");
   const kanban=await readIndicatorReporting(db,"team349k","trends","kanban");
   assert.equal(kanban.columns[0].style,"bar");assert.equal(kanban.cycles[0].values[id],"9");
   const hidden=await readIndicatorReporting(db,"team349b","trends","scrum");
   assert.deepEqual(hidden.columns,[]);
  }finally{await db.end();}
 }finally{try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');}finally{await admin.end();}}
});
