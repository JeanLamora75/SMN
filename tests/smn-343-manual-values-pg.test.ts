import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {readManualCycleValues,writeManualValues,validateManualWrite} from "../src/server/indicators/manual-values";

test("saisie manuelle v33 atomique, révisions, NULL, équipe et cycles clos",{timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const origin=new URL(ci&&process.env.SMN_TEST_DATABASE_URL?process.env.SMN_TEST_DATABASE_URL:await installedDatabaseUri());
 if(!(origin.pathname==="/smn"||ci&&origin.pathname==="/smn_ci")||!["127.0.0.1","localhost","[::1]"].includes(origin.hostname))
  throw Error("Local source SMN required");
 const name="smn_343_"+randomBytes(6).toString("hex");
 const adminUri=new URL(origin);adminUri.pathname="/postgres";
 const uri=new URL(origin);uri.pathname="/"+name;
 const admin=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});
 await admin.connect();let created=false;
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  const install=await installExpress({adminUsername:"admin343",adminEmail:"admin343@example.test",password:"test-only-password343"},uri.toString());
  assert.deepEqual(install,{ok:true});
  const db=new Client({connectionString:uri.toString(),connectionTimeoutMillis:3500});
  await db.connect();
  try{
   await db.query("UPDATE public.smn_account SET must_change_password=false WHERE role='admin'");
   const actor=(await db.query<{id:string}>("SELECT id FROM public.smn_account WHERE role='admin' LIMIT 1")).rows[0].id;
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES('team-a','singleton','Équipe A','scrum'),('team-b','singleton','Équipe B','scrum')");
   await db.query("INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status) VALUES "+
    "('sprint-a','team-a',1,'Sprint A',now()-interval '15 days',now()-interval '1 day','Europe/Paris','closed'),"+
    "('sprint-b','team-b',1,'Sprint B',now()-interval '15 days',now()-interval '1 day','Europe/Paris','closed')");
   await db.query("INSERT INTO public.smn_indicator_definition(id,tag,name,indicator_type) VALUES "+
    "('m1','M1','Nombre de tickets','manual'),('m2','M2','Points','manual')");
   await db.query("INSERT INTO public.smn_indicator_definition(id,tag,name,indicator_type,formula) VALUES('calc','CALC','Calcul','computed','M1+M2')");
   await db.query("INSERT INTO public.smn_indicator_team_selection(team_id,indicator_id) VALUES "+
    "('team-a','m1'),('team-a','m2'),('team-b','m1')");
   const input={teamId:"team-a",cycleType:"scrum" as const,cycleId:"sprint-a",expectedRevision:0,changes:[
    {indicatorId:"m1",value:"0"},{indicatorId:"m2",value:"-1.25"}]};
   assert.equal(validateManualWrite(input),true);
   assert.deepEqual(await writeManualValues(db,actor,input),{ok:true,revision:1});
   let read=await readManualCycleValues(db,"team-a","scrum","sprint-a");
   assert.equal(read.revision,1);
   assert.deepEqual(read.values,[{indicator_id:"m1",value:"0"},{indicator_id:"m2",value:"-1.25"}]);
   assert.deepEqual(await writeManualValues(db,actor,input),{ok:false,error:"conflict"});
   assert.deepEqual(await writeManualValues(db,actor,{...input,expectedRevision:1,changes:[
    {indicatorId:"m1",value:null},{indicatorId:"m2",value:"0"}]}),{ok:true,revision:2});
   read=await readManualCycleValues(db,"team-a","scrum","sprint-a");
   assert.deepEqual(read.values,[{indicator_id:"m1",value:null},{indicator_id:"m2",value:"0"}]);
   assert.deepEqual(await writeManualValues(db,actor,{...input,expectedRevision:2,changes:[
    {indicatorId:"m1",value:"12"},{indicatorId:"calc",value:"1"}]}),{ok:false,error:"indicator-unavailable"});
   assert.equal((await readManualCycleValues(db,"team-a","scrum","sprint-a")).revision,2);
   assert.deepEqual(await writeManualValues(db,actor,{...input,expectedRevision:0,teamId:"team-b"}),
    {ok:false,error:"not-found"});
   assert.equal((await readManualCycleValues(db,"team-b","scrum","sprint-b")).values.length,0);
   const system=await db.query<{revision:string}>("SELECT revision::text FROM public.smn_indicator_system_revision WHERE singleton_key='singleton'");
   assert.equal(system.rows[0].revision,"2");
   assert.equal(validateManualWrite({...input,changes:[{indicatorId:"m1",value:"1e2"}]}),false);
   assert.equal(validateManualWrite({...input,changes:[{indicatorId:"m1",value:"1"},{indicatorId:"m1",value:"2"}]}),false);
  }finally{await db.end()}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)')}
  finally{await admin.end()}
 }
});
