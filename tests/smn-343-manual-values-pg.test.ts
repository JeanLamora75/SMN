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
   await db.query("INSERT INTO public.smn_indicator_dependency(id,indicator_id,source_type,source_indicator_id) VALUES "+
    "('calc-m1','calc','indicator','m1'),('calc-m2','calc','indicator','m2')");
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
   await db.query("INSERT INTO public.smn_account(id,installation_id,username,email,role,password_hash,must_change_password) "+
    "VALUES('user-343','singleton','user343','user343@example.test','user','disabled-test-password-hash',false)");
   assert.deepEqual(await writeManualValues(db,"user-343",{...input,expectedRevision:2}),
    {ok:false,error:"forbidden"});
   let checkedScope="";
   assert.deepEqual(await writeManualValues(db,"user-343",{...input,expectedRevision:2,changes:[{indicatorId:"m1",value:"7"}]},
    async (account,team)=>{assert.equal(account,"user-343");checkedScope=team;return team==="team-a";}),
    {ok:true,revision:3});
   assert.equal(checkedScope,"team-a");
   assert.deepEqual(await writeManualValues(db,"user-343",{...input,teamId:"team-b",cycleId:"sprint-b",expectedRevision:0},
    async()=>false),{ok:false,error:"forbidden"});
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES('team-k','singleton','Kanban','kanban')");
   await db.query("INSERT INTO public.smn_kanban_period(id,team_id,name,start_on,end_on,time_zone,status) "+
    "VALUES('period-k','team-k','Période K',current_date-15,current_date-1,'Europe/Paris','closed')");
   await db.query("INSERT INTO public.smn_indicator_team_selection(team_id,indicator_id) VALUES('team-k','m1')");
   assert.deepEqual(await writeManualValues(db,actor,{
    teamId:"team-k",cycleType:"kanban",cycleId:"period-k",expectedRevision:0,changes:[{indicatorId:"m1",value:"3"}]
   }),{ok:true,revision:1});
   assert.deepEqual((await readManualCycleValues(db,"team-k","kanban","period-k")).values,[{indicator_id:"m1",value:"3"}]);
   const other=new Client({connectionString:uri.toString(),connectionTimeoutMillis:3500});await other.connect();
   try{
    const concurrent={...input,expectedRevision:3,changes:[{indicatorId:"m1",value:"10"}]};
    const [first,second]=await Promise.all([
     writeManualValues(db,actor,concurrent),
     writeManualValues(other,actor,{...concurrent,changes:[{indicatorId:"m1",value:"11"}]})
    ]);
    assert.equal([first,second].filter(v=>v.ok).length,1);
    assert.equal([first,second].filter(v=>!v.ok&&v.error==="conflict").length,1);
    assert.equal((await readManualCycleValues(db,"team-a","scrum","sprint-a")).revision,4);
   }finally{await other.end();}
   await db.query("CREATE FUNCTION public.smn_343_fail_second() RETURNS trigger LANGUAGE plpgsql AS "+
    "$$ BEGIN IF NEW.indicator_id='m2' THEN RAISE EXCEPTION 'forced-second-write-failure'; END IF; RETURN NEW; END; $$");
   await db.query("CREATE TRIGGER smn_343_fail_second BEFORE INSERT OR UPDATE "+
    "ON public.smn_indicator_manual_value FOR EACH ROW EXECUTE FUNCTION public.smn_343_fail_second()");
   const beforeFailedBatch=await readManualCycleValues(db,"team-a","scrum","sprint-a");
   await assert.rejects(()=>writeManualValues(db,actor,{...input,expectedRevision:4,changes:[
    {indicatorId:"m1",value:"99"},{indicatorId:"m2",value:"99"}]}),/forced-second-write-failure/);
   assert.deepEqual(await readManualCycleValues(db,"team-a","scrum","sprint-a"),beforeFailedBatch,
    "Aucune valeur ni révision ne doit survivre à l'échec de la seconde écriture");
   await db.query("DROP TRIGGER smn_343_fail_second ON public.smn_indicator_manual_value");
   await db.query("DROP FUNCTION public.smn_343_fail_second()");
   const system=await db.query<{revision:string}>("SELECT revision::text FROM public.smn_indicator_system_revision WHERE singleton_key='singleton'");
   assert.equal(system.rows[0].revision,"5");
   assert.equal(validateManualWrite({...input,changes:[{indicatorId:"m1",value:"1e2"}]}),false);
   assert.equal(validateManualWrite({...input,changes:[{indicatorId:"m1",value:"1"},{indicatorId:"m1",value:"2"}]}),false);
  }finally{await db.end()}
 }finally{
  try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)')}
  finally{await admin.end()}
 }
});
