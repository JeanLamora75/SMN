import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {Client} from "pg";
import {installExpress} from "../src/server/installation/install";
import {readChartStyles,applyChartStyleCommand} from "../src/server/reports/chart-style-store";
import {ChartStyleError,PREDEFINED_CHART_STYLES} from "../src/server/reports/chart-style-contract";

const source=process.env.SMN_TEST_DATABASE_URL;
const ci=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true";
const sql=readFileSync(new URL("../prisma/migrations/20261108_smn416_chart_styles/migration.sql",import.meta.url),"utf8");

test("migration is additive, idempotent and checks all global defaults",()=>{
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.smn_chart_style\s*\(/);
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.smn_chart_style_default\s*\(/);
 assert.match(sql,/config jsonb NOT NULL/);
 assert.match(sql,/ON CONFLICT \(installation_id,chart_type\) DO NOTHING/);
 assert.doesNotMatch(sql,/DROP TABLE|DELETE FROM|TRUNCATE|ALTER TABLE public\.smn_indicator/i);
});
test("PostgreSQL isolated: create, defaults, optimistic revisions, permissions and rollback",
 {skip:!source||!ci,timeout:180000},async()=>{
 const origin=new URL(source!);
 if(!["localhost","127.0.0.1","[::1]"].includes(origin.hostname))throw Error("Local isolated PostgreSQL only");
 const database="smn_416_"+randomUUID().replaceAll("-","");
 const adminUri=new URL(origin);adminUri.pathname="/postgres";
 const testUri=new URL(origin);testUri.pathname="/"+database;
 const server=new Client({connectionString:adminUri.toString(),connectionTimeoutMillis:3500});
 await server.connect();
 let created=false;
 try{
  await server.query('CREATE DATABASE "'+database+'"');created=true;
  assert.deepEqual(await installExpress({
   adminUsername:"admin416",adminEmail:"admin416@example.test",password:"test-only-password416"
  },testUri.toString()),{ok:true});
  const db=new Client({connectionString:testUri.toString(),connectionTimeoutMillis:3500});
  await db.connect();
  try{
   const account=await db.query<{id:string}>("SELECT id FROM public.smn_account WHERE role='admin' LIMIT 1");
   const actor={id:account.rows[0].id,role:"admin"};
   const normal={...actor,role:"user"};
   const indicatorBefore=await db.query<{c:string}>("SELECT COUNT(*)::text AS c FROM public.smn_indicator_definition");
   await db.query(sql);
   await db.query(sql);
   const defaults=await db.query<{c:string}>("SELECT COUNT(*)::text AS c FROM public.smn_chart_style_default");
   assert.equal(defaults.rows[0].c,"6");
   const original=await readChartStyles(db,actor);
   assert.equal(original.styles.length,3);
   assert.deepEqual(original.styles.filter(x=>x.source==="builtin").map(x=>x.id),
    ["cockpit-agile","corporate","minimal"]);
   assert.equal(original.defaults.line.styleId,"cockpit-agile");
   await assert.rejects(applyChartStyleCommand(db,normal,{action:"delete",id:"corporate",revision:1}),
    (e:unknown)=>e instanceof ChartStyleError&&e.code==="forbidden");
   const config=structuredClone(PREDEFINED_CHART_STYLES[0].config);
   await applyChartStyleCommand(db,actor,{action:"create",id:"my-custom-style",name:"Mon style",description:"test",config});
   assert.equal((await readChartStyles(db,normal)).styles.length,4);
   await assert.rejects(applyChartStyleCommand(db,actor,{action:"create",id:"my-custom-style",name:"Collision",description:"",config}),
    (e:unknown)=>e instanceof ChartStyleError&&e.code==="conflict");
   await applyChartStyleCommand(db,actor,{action:"set-default",type:"line",styleId:"my-custom-style",revision:1});
   assert.equal((await readChartStyles(db,actor)).defaults.line.styleId,"my-custom-style");
   await assert.rejects(applyChartStyleCommand(db,actor,{action:"delete",id:"my-custom-style",revision:1}),
    (e:unknown)=>e instanceof ChartStyleError&&e.code==="default-style");
   await assert.rejects(applyChartStyleCommand(db,actor,{action:"update",id:"my-custom-style",name:"B",description:"",config,revision:0}),
    (e:unknown)=>e instanceof ChartStyleError&&e.code==="invalid-input");
   await applyChartStyleCommand(db,actor,{action:"update",id:"my-custom-style",name:"Modifié",description:"",config,revision:1});
   await assert.rejects(applyChartStyleCommand(db,actor,{action:"update",id:"my-custom-style",name:"Obsolète",description:"",config,revision:1}),
    (e:unknown)=>e instanceof ChartStyleError&&e.code==="conflict");
   await assert.rejects(applyChartStyleCommand(db,actor,{action:"delete",id:"minimal",revision:1}),
    (e:unknown)=>e instanceof ChartStyleError&&e.code==="protected-style");
   await applyChartStyleCommand(db,actor,{action:"set-default",type:"line",styleId:"corporate",revision:2});
   await applyChartStyleCommand(db,actor,{action:"delete",id:"my-custom-style",revision:2});
   const after=await readChartStyles(db,actor);
   assert.equal(after.styles.length,3);
   assert.equal(after.defaults.line.styleId,"corporate");
   const indicator=await db.query<{c:string}>("SELECT COUNT(*)::text AS c FROM public.smn_indicator_definition");
   assert.equal(indicator.rows[0].c,indicatorBefore.rows[0].c);
  }finally{await db.end().catch(()=>undefined);}
 }finally{
  if(created)await server.query('DROP DATABASE "'+database+'" WITH (FORCE)').catch(()=>undefined);
  await server.end().catch(()=>undefined);
 }
});
