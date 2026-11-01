import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {applyCatalogCommand} from "../src/server/indicators/catalog";
import {readReportIndicatorProjection} from "../src/server/reports/dynamic-indicators";
test("SMN-350: ephemeral ordering, NULL, provenance, team isolation and Kanban",{timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const base=new URL(ci&&process.env.SMN_TEST_DATABASE_URL?process.env.SMN_TEST_DATABASE_URL:await installedDatabaseUri());
 if(!(base.pathname==="/smn"||ci&&base.pathname==="/smn_ci")||!["127.0.0.1","localhost","[::1]"].includes(base.hostname))throw Error("Isolated local PG required");
 const name="smn_350_"+randomBytes(6).toString("hex"),adminUri=new URL(base),uri=new URL(base);adminUri.pathname="/postgres";uri.pathname="/"+name;
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});await admin.connect();let created=false;
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  assert.deepEqual(await installExpress({adminUsername:"admin350",adminEmail:"admin350@example.test",password:"test-only-password350"},uri.toString()),{ok:true});
  const db=new Client({connectionString:uri.toString(),connectionTimeoutMillis:3500});await db.connect();
  try{
   const account=(await db.query<{id:string}>("SELECT id FROM public.smn_account WHERE role='admin'")).rows[0].id;
   await db.query("UPDATE public.smn_account SET must_change_password=false WHERE id=$1",[account]);
   const actor={accountId:account,role:"admin" as const};
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES('team350a','singleton','A','scrum'),('team350b','singleton','B','scrum'),('team350k','singleton','K','kanban')");
   await db.query("INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status) VALUES('cycle350','team350a',1,'Cycle','2026-10-01','2026-10-15','Europe/Paris','closed'),('other350','team350b',1,'Other','2026-10-01','2026-10-15','Europe/Paris','closed')");
   await db.query("INSERT INTO public.smn_kanban_period(id,team_id,name,start_on,end_on,time_zone,status) VALUES('period350','team350k','Period',current_date-15,current_date-1,'Europe/Paris','closed')");
   const a=await applyCatalogCommand(db,actor,{action:"create",tag:"ALPHA350",name:"Alpha",unitShort:"sp",indicatorType:"manual"});
   const b=await applyCatalogCommand(db,actor,{action:"create",tag:"BETA350",name:"Beta",unitShort:"tck",indicatorType:"manual"});
   if(typeof a.id!=="string"||typeof b.id!=="string")throw Error("create failed");
   for(const teamId of ["team350a","team350k"])for(const id of [a.id,b.id])await applyCatalogCommand(db,actor,{action:"selection",teamId,indicatorId:id,active:true});
   await applyCatalogCommand(db,actor,{action:"preference",teamId:"team350a",indicatorId:a.id,screenKey:"reports",visible:true,order:9,style:"number"});
   await applyCatalogCommand(db,actor,{action:"preference",teamId:"team350a",indicatorId:b.id,screenKey:"reports",visible:true,order:1,style:"number"});
   await db.query("INSERT INTO public.smn_indicator_manual_value(team_id,cycle_type,cycle_id,indicator_id,value,updated_by) VALUES('team350a','scrum','cycle350',$1,0,$3),('team350k','kanban','period350',$2,7,$3)",[a.id,b.id,account]);
   const initial=await readReportIndicatorProjection(db,"team350a","scrum","cycle350");
   assert.deepEqual(initial.map(x=>x.tag),["BETA350","ALPHA350"]);
   assert.deepEqual(initial.map(x=>x.value),[null,"0"]);
   assert.deepEqual(initial.map(x=>x.source),["manual","manual"]);
   const reversed=await readReportIndicatorProjection(db,"team350a","scrum","cycle350",[a.id,b.id]);
   assert.deepEqual(reversed.map(x=>x.tag),["ALPHA350","BETA350"]);
   assert.deepEqual(await readReportIndicatorProjection(db,"team350a","scrum","cycle350",[]),[]);
   const prefs=await db.query<{display_order:number}>( "SELECT display_order FROM public.smn_indicator_display_preference WHERE team_id='team350a' AND indicator_id=$1 AND screen_key='reports'",[a.id]);
   assert.equal(prefs.rows[0].display_order,9);
   await assert.rejects(()=>readReportIndicatorProjection(db,"team350b","scrum","other350",[a.id]));
   await assert.rejects(()=>readReportIndicatorProjection(db,"team350a","scrum","other350",[a.id]));
   const kanban=await readReportIndicatorProjection(db,"team350k","kanban","period350",[b.id,a.id]);
   assert.deepEqual(kanban.map(x=>x.value),["7",null]);
   assert.equal(kanban[0].unit,"tck");
  }finally{await db.end();}
 }finally{try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');}finally{await admin.end();}}
});
