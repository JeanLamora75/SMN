import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {applyCatalogCommand} from "../src/server/indicators/catalog";
import {updateIndicatorGrant,requireIndicatorTeam} from "../src/server/indicators/team-access";
import {previewIndicatorInput} from "../src/server/indicators/input-preview";
import {writeManualValues,readManualCycleValues} from "../src/server/indicators/manual-values";

test("SMN-348: live preview is read-only, grouped save is atomic and team scoped",{timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const base=new URL(ci&&process.env.SMN_TEST_DATABASE_URL?process.env.SMN_TEST_DATABASE_URL:await installedDatabaseUri());
 if(!(base.pathname==="/smn"||ci&&base.pathname==="/smn_ci")||!["127.0.0.1","localhost","[::1]"].includes(base.hostname))throw Error("Isolated local PG required");
 const name="smn_348_"+randomBytes(6).toString("hex"),adminUri=new URL(base),uri=new URL(base);
 adminUri.pathname="/postgres";uri.pathname="/"+name;
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});
 await admin.connect();let created=false;
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  assert.deepEqual(await installExpress({adminUsername:"admin348",adminEmail:"admin348@example.test",password:"test-only-password348"},uri.toString()),{ok:true});
  const db=new Client({connectionString:uri.toString(),connectionTimeoutMillis:3500});await db.connect();
  try{
   const adminId=(await db.query<{id:string}>("SELECT id FROM public.smn_account WHERE role='admin'")).rows[0].id;
   await db.query("UPDATE public.smn_account SET must_change_password=false WHERE id=$1",[adminId]);
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES('team348a','singleton','A','scrum'),('team348b','singleton','B','scrum')");
   await db.query("INSERT INTO public.smn_sprint(id,team_id,name,start_at,end_at,status) VALUES('cycle348','team348a','Test','2026-10-01','2026-10-15','open')");
   await db.query("INSERT INTO public.smn_account(id,installation_id,username,email,role,password_hash,must_change_password,is_active) SELECT 'user348','singleton','user348','user348@example.test','user',password_hash,false,true FROM public.smn_account WHERE id=$1",[adminId]);
   const adminActor={accountId:adminId,role:"admin" as const},user={accountId:"user348",role:"user" as const};
   await updateIndicatorGrant(db,adminActor,user.accountId,"team348a",true);
   const m=await applyCatalogCommand(db,adminActor,{action:"create",tag:"INPUT_348",name:"Input",indicatorType:"manual"});
   const f=await applyCatalogCommand(db,adminActor,{action:"create",tag:"RESULT_348",name:"Result",indicatorType:"computed",formula:"INPUT_348*2"});
   if(!("id" in m)||!("id" in f))throw Error("missing defs");
   await applyCatalogCommand(db,adminActor,{action:"selection",teamId:"team348a",indicatorId:m.id,active:true});
   await applyCatalogCommand(db,adminActor,{action:"selection",teamId:"team348a",indicatorId:f.id,active:true});
   const input={teamId:"team348a",cycleType:"scrum" as const,cycleId:"cycle348",expectedRevision:0,changes:[{indicatorId:m.id,value:"4"}]};
   await assert.rejects(()=>previewIndicatorInput(db,user,{...input,teamId:"team348b"}));
   const preview=await previewIndicatorInput(db,user,input);
   assert.equal(preview.revision,0);
   assert.ok(preview.systemRevision>=4);
   assert.equal(preview.results.find(x=>x.indicatorId===f.id)?.kind,"available");
   assert.deepEqual((await readManualCycleValues(db,input.teamId,input.cycleType,input.cycleId)).values,[]);
   const saved=await writeManualValues(db,user.accountId,{...input,expectedSystemRevision:preview.systemRevision},async(a,t,client)=>{await requireIndicatorTeam(client,{accountId:a,role:"user"},t);return true;});
   assert.deepEqual(saved,{ok:true,revision:1});
   assert.equal((await readManualCycleValues(db,input.teamId,input.cycleType,input.cycleId)).revision,1);
   const computed=await db.query<{value:string}>("SELECT value::text FROM public.smn_indicator_computed_result WHERE team_id=$1 AND cycle_id=$2 AND indicator_id=$3",[input.teamId,input.cycleId,f.id]);
   assert.equal(Number(computed.rows[0].value),8);
   assert.deepEqual(await writeManualValues(db,user.accountId,{...input,expectedSystemRevision:preview.systemRevision},async()=>true),{ok:false,error:"conflict"});
   await updateIndicatorGrant(db,adminActor,user.accountId,"team348a",false);
   await assert.rejects(()=>writeManualValues(db,user.accountId,{...input,expectedRevision:1},async(a,t,client)=>{await requireIndicatorTeam(client,{accountId:a,role:"user"},t);return true;}));
   assert.equal((await readManualCycleValues(db,input.teamId,input.cycleType,input.cycleId)).revision,1);
  }finally{await db.end();}
 }finally{try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');}finally{await admin.end();}}
});
