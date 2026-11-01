import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {Client} from "pg";
import {installedDatabaseUri} from "../src/server/auth/database";
import {installExpress} from "../src/server/installation/install";
import {updateIndicatorGrant,indicatorTeams} from "../src/server/indicators/team-access";
import {applyCatalogCommand,listIndicatorCatalog,IndicatorCatalogError} from "../src/server/indicators/catalog";

test("SMN-347 : catalogue, sélection isolée, préférences, archivage et rollback",{timeout:180000},async()=>{
 const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
 const origin=new URL(ci&&process.env.SMN_TEST_DATABASE_URL?process.env.SMN_TEST_DATABASE_URL:await installedDatabaseUri());
 if(!(origin.pathname==="/smn"||ci&&origin.pathname==="/smn_ci")||!["127.0.0.1","localhost","[::1]"].includes(origin.hostname))
  throw Error("Base locale isolée obligatoire");
 const name="smn_347_"+randomBytes(6).toString("hex"),adminUrl=new URL(origin),url=new URL(origin);
 adminUrl.pathname="/postgres";url.pathname="/"+name;
 const admin=new Client({connectionString:adminUrl.toString(),connectionTimeoutMillis:3500});
 await admin.connect();let created=false;
 try{
  await admin.query('CREATE DATABASE "'+name+'"');created=true;
  assert.deepEqual(await installExpress({adminUsername:"admin347",adminEmail:"admin347@example.test",password:"test-only-password347"},url.toString()),{ok:true});
  const db=new Client({connectionString:url.toString(),connectionTimeoutMillis:3500});await db.connect();
  try{
   const account=(await db.query<{id:string}>("SELECT id FROM public.smn_account WHERE role='admin' LIMIT 1")).rows[0].id;
   await db.query("UPDATE public.smn_account SET must_change_password=false WHERE id=$1",[account]);
   const actor={accountId:account,role:"admin" as const};
   await db.query("INSERT INTO public.smn_team(id,installation_id,name,agile_mode) VALUES('team347a','singleton','Team A','scrum'),('team347b','singleton','Team B','kanban')");
   await db.query("INSERT INTO public.smn_account(id,installation_id,username,email,role,password_hash,must_change_password,is_active) SELECT 'scrum347','singleton','scrum347','scrum347@example.test','user',password_hash,false,true FROM public.smn_account WHERE id=$1",[account]);
   const sm={accountId:"scrum347",role:"user" as const};
   assert.deepEqual(await indicatorTeams(db,sm),[]);
   await assert.rejects(()=>listIndicatorCatalog(db,sm,"team347a"),(e:unknown)=>e instanceof IndicatorCatalogError&&e.code==="forbidden");
   await updateIndicatorGrant(db,actor,sm.accountId,"team347a",true);
   assert.deepEqual((await indicatorTeams(db,sm)).map(x=>x.id),["team347a"]);
   await assert.rejects(()=>listIndicatorCatalog(db,sm,"team347b"),(e:unknown)=>e instanceof IndicatorCatalogError&&e.code==="forbidden");
   const one=await applyCatalogCommand(db,actor,{action:"create",tag:"MET_347",name:"Metric",indicatorType:"manual",unitShort:"sp"});
   assert.ok("id" in one);
   const two=await applyCatalogCommand(db,actor,{action:"create",tag:"FORM_347",name:"Formula",indicatorType:"computed",formula:"MET_347+1"});
   assert.ok("id" in two);
   const defs=await listIndicatorCatalog(db,actor);
   assert.equal(defs.definitions.length,2);
   const manual=defs.definitions.find(x=>x.tag==="MET_347")!;
   const computed=defs.definitions.find(x=>x.tag==="FORM_347")!;
   const deps=await db.query("SELECT source_indicator_id FROM public.smn_indicator_dependency WHERE indicator_id=$1",[computed.id]);
   assert.deepEqual(deps.rows,[{source_indicator_id:manual.id}]);
   await assert.rejects(()=>applyCatalogCommand(db,actor,{action:"create",tag:"BAD_TAG",name:"Cycle",indicatorType:"computed",formula:"FORM_347+BAD_TAG"}),e=>e instanceof IndicatorCatalogError&&e.code==="invalid-input");
   await assert.rejects(()=>applyCatalogCommand(db,actor,{action:"create",tag:"MET_347",name:"Duplicate",indicatorType:"manual"}),e=>e instanceof IndicatorCatalogError&&e.code==="conflict");
   await assert.rejects(()=>applyCatalogCommand(db,sm,{action:"archive",indicatorId:manual.id}),(e:unknown)=>e instanceof IndicatorCatalogError&&e.code==="forbidden");
   await assert.rejects(()=>applyCatalogCommand(db,sm,{action:"selection",teamId:"team347b",indicatorId:manual.id,active:true}),(e:unknown)=>e instanceof IndicatorCatalogError&&e.code==="forbidden");
   await applyCatalogCommand(db,sm,{action:"selection",teamId:"team347a",indicatorId:manual.id,active:true});
   await updateIndicatorGrant(db,actor,sm.accountId,"team347a",false);
   await assert.rejects(()=>applyCatalogCommand(db,sm,{action:"selection",teamId:"team347a",indicatorId:manual.id,active:true}),(e:unknown)=>e instanceof IndicatorCatalogError&&e.code==="forbidden");
   await applyCatalogCommand(db,actor,{action:"selection",teamId:"team347a",indicatorId:manual.id,active:true});
   await applyCatalogCommand(db,actor,{action:"selection",teamId:"team347b",indicatorId:manual.id,active:true});
   await applyCatalogCommand(db,actor,{action:"preference",teamId:"team347a",indicatorId:manual.id,screenKey:"dashboard",visible:false,order:4,style:"gauge"});
   await applyCatalogCommand(db,actor,{action:"preference",teamId:"team347b",indicatorId:manual.id,screenKey:"dashboard",visible:true,order:0,style:"number"});
   const a=await listIndicatorCatalog(db,actor,"team347a");
   const b=await listIndicatorCatalog(db,actor,"team347b");
   assert.equal(a.preferences[0].is_visible,false);
   assert.equal(a.preferences[0].display_style,"gauge");
   assert.equal(b.preferences[0].is_visible,true);
   assert.deepEqual(b.preferences.map(x=>x.team_id),["team347b"]);
   await assert.rejects(()=>applyCatalogCommand(db,actor,{action:"preference",teamId:"team347b",indicatorId:computed.id,screenKey:"reports",visible:true,order:1,style:"bar"}),e=>e instanceof IndicatorCatalogError&&e.code==="conflict");
   await assert.rejects(()=>applyCatalogCommand(db,actor,{action:"selection",teamId:"unknown-team",indicatorId:manual.id,active:true}));
   await assert.rejects(()=>applyCatalogCommand(db,{accountId:"user",role:"user"}, {action:"archive",indicatorId:manual.id}),e=>e instanceof IndicatorCatalogError&&e.code==="forbidden");
   await applyCatalogCommand(db,actor,{action:"archive",indicatorId:manual.id});
   await assert.rejects(()=>applyCatalogCommand(db,actor,{action:"selection",teamId:"team347a",indicatorId:manual.id,active:true}),e=>e instanceof IndicatorCatalogError&&e.code==="archived");
   assert.equal((await listIndicatorCatalog(db,actor,"team347a")).preferences.length,1);
   assert.equal((await db.query("SELECT count(*)::int AS n FROM public.smn_indicator_dependency WHERE indicator_id=$1",[computed.id])).rows[0].n,1);
   assert.equal((await db.query<{revision:string}>("SELECT revision::text FROM public.smn_indicator_system_revision WHERE singleton_key='singleton'")).rows[0].revision,"8");
  }finally{await db.end();}
 }finally{try{if(created)await admin.query('DROP DATABASE "'+name+'" WITH (FORCE)');}finally{await admin.end();}}
});
