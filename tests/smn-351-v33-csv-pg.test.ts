import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes,randomUUID} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {previewCsvV33,confirmCsvV33} from "../src/server/historical-csv/v33";

test("SMN-351 PG: mapped CSV v33 inserts, preserves, replaces, journals and rejects stale/closed/wrong-team writes",{timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const source=new URL(ci&&process.env.SMN_TEST_DATABASE_URL?process.env.SMN_TEST_DATABASE_URL:await installedDatabaseUri());
 if(!(source.pathname==="/smn"||ci&&source.pathname==="/smn_ci")||!["localhost","127.0.0.1","[::1]"].includes(source.hostname))
  throw Error("Local SMN PostgreSQL source required");
 const database="smn_351_csv_"+randomBytes(6).toString("hex");
 const maintenance=new URL(source);maintenance.pathname="/postgres";
 const isolated=new URL(source);isolated.pathname="/"+database;
 const admin=new Client({connectionString:maintenance.toString(),connectionTimeoutMillis:3500});
 let created=false;
 await admin.connect();
 try{
  await admin.query('CREATE DATABASE "'+database+'"');created=true;
  assert.deepEqual(await installExpress({adminUsername:"admin351csv",adminEmail:"admin351csv@example.test",password:"test-only-password351"},isolated.toString()),{ok:true});
  const db=new Client({connectionString:isolated.toString(),connectionTimeoutMillis:3500});
  await db.connect();
  try{
   const account=(await db.query<{id:string}>("SELECT id FROM public.smn_account WHERE role='admin'")).rows[0].id;
   const team=randomUUID(),otherTeam=randomUUID(),cycle=randomUUID(),closed=randomUUID(),indicator=randomUUID();
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES($1,'singleton','CSV Team','scrum'),($2,'singleton','Other Team','scrum')",[team,otherTeam]);
   await db.query(`INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status)
    VALUES($1,$2,1,'CSV Open',now()-interval '14 days',now()-interval '7 days','Europe/Paris','finished'),
    ($3,$2,2,'CSV Closed',now()-interval '7 days',now(),'Europe/Paris','closed')`,[cycle,team,closed]);
   await db.query("INSERT INTO public.smn_indicator_definition(id,tag,name,indicator_type,unit_short) VALUES($1,'CSV351','CSV test','manual','sp')",[indicator]);
   await db.query("INSERT INTO public.smn_indicator_team_selection(team_id,indicator_id,is_active) VALUES($1,$2,true)",[team,indicator]);
   const input=(cycleId:string,value:number)=>({teamId:team,mode:"scrum" as const,csv:`cycle_id,metric_code,value,quality\n${cycleId},SP_INITIAL,${value},known\n`,mappings:[{code:"SP_INITIAL",indicatorId:indicator}]});
   const first=input(cycle,5);
   const preview=await previewCsvV33(db,first);
   assert.equal(preview.ok,true);if(!preview.ok)return;
   assert.equal(preview.preview[0].existingValue,null);
   const added=await confirmCsvV33(db,account,first,[{line:2,decision:"insert",expectedValue:null}]);
   assert.equal(added.ok,true);if(!added.ok)return;
   assert.equal(added.inserted,1);
   const value=async()=> (await db.query<{value:string}>("SELECT value::text FROM public.smn_indicator_manual_value WHERE team_id=$1 AND cycle_id=$2 AND indicator_id=$3",[team,cycle,indicator])).rows[0]?.value;
   assert.equal(await value(),"5");
   const second=input(cycle,9);
   const current=await previewCsvV33(db,second);
   assert.equal(current.ok,true);if(!current.ok)return;
   assert.equal(current.preview[0].existingValue,"5");
   const preserved=await confirmCsvV33(db,account,second,[{line:2,decision:"keep",expectedValue:"5"}]);
   assert.equal(preserved.ok,true);assert.equal(await value(),"5");
   const stale=await confirmCsvV33(db,account,second,[{line:2,decision:"replace",expectedValue:"4"}]);
   assert.deepEqual(stale,{ok:false,error:"stale-preview"});
   assert.equal(await value(),"5");
   const replaced=await confirmCsvV33(db,account,second,[{line:2,decision:"replace",expectedValue:"5"}]);
   assert.equal(replaced.ok,true);assert.equal(await value(),"9");
   const journal=await db.query<{n:string}>("SELECT count(*)::text AS n FROM public.smn_historical_csv_change WHERE cycle_id=$1",[cycle]);
   assert.equal(journal.rows[0].n,"2");
   const revised=await db.query<{revision:string}>("SELECT revision::text FROM public.smn_indicator_cycle_revision WHERE team_id=$1 AND cycle_id=$2 AND cycle_type='scrum'",[team,cycle]);
   assert.equal(revised.rows[0].revision,"2");
   const deniedClosed=await confirmCsvV33(db,account,input(closed,3),[{line:2,decision:"insert",expectedValue:null}]);
   assert.deepEqual(deniedClosed,{ok:false,error:"closed-period"});
   const wrongTeam=await previewCsvV33(db,{...first,teamId:otherTeam});
   assert.equal(wrongTeam.ok,false);
   const unselected=await previewCsvV33(db,{...first,mappings:[{code:"SP_INITIAL",indicatorId:randomUUID()}]});
   assert.deepEqual(unselected,{ok:false,error:"indicator-unavailable"});
   assert.equal(await value(),"9");
  }finally{await db.end();}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+database+'" WITH (FORCE)');}
  finally{await admin.end();}
 }
});
