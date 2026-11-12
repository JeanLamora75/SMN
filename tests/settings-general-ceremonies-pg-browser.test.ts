import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {createRequire} from "node:module";
import {createServer} from "node:http";
import {dirname,join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";
import {Client} from "pg";
import puppeteer from "puppeteer-core";
import {detectChrome} from "../scripts/report-chrome.mjs";
import {installExpress} from "../src/server/installation/install";

const source=process.env.SMN_TEST_DATABASE_URL;
const allowed=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true"&&
 /^postgresql:\/\/smn_ci:[^@]+@127\.0\.0\.1:5432\/smn_ci$/.test(source??"");
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const require=createRequire(import.meta.url);
const esbuild=require(createRequire(require.resolve("tsx/package.json")).resolve("esbuild"));
const database="smn_ci_browser_"+randomUUID().replace(/-/g,"").slice(0,12);
const baseSettings={locale:"fr",theme:"light",palette:"ocean",referenceCountry:"FR",
 revision:3,updatedAt:"2026-11-12T10:00:00.000Z",mode:"scrum",product:"Produit de test"};
const baseCeremony={id:"ceremony-one",name:"Daily",frequency:"daily",weekday:null,
 position:null,time:"09:00",duration:30,icon:null,iconColor:null,active:true,revision:4};

async function bundle(){
 const entry=[
 'import React from "react";',
 'import {createRoot} from "react-dom/client";',
 'import {LocaleProvider} from "@/i18n/client";',
 'import SettingsForm from "@/app/app/admin/settings/settings-form";',
 'import TemplateForm from "@/app/app/admin/sprints/template-form";',
 'createRoot(document.getElementById("root")!).render(',
 '<LocaleProvider locale="fr">',
 '<div id="general-fixture"><SettingsForm/></div>',
 '<div id="ceremony-fixture"><TemplateForm/></div>',
 '</LocaleProvider>);'
 ].join("\n");
 const output=await esbuild.build({
  stdin:{contents:entry,resolveDir:root,sourcefile:"settings-pg-fixture.tsx",loader:"tsx"},
  bundle:true,format:"iife",platform:"browser",jsx:"automatic",write:false,
  plugins:[{name:"smn-test-next-router",setup(build:{
   onResolve:(options:{filter:RegExp},handler:(args:{path:string;kind:string})=>Promise<unknown>|{path:string;namespace:string})=>void;
   onLoad:(options:{filter:RegExp;namespace:string},handler:()=>{contents:string;loader:"ts"})=>void;
   resolve:(path:string,options:{resolveDir:string;kind:string})=>Promise<unknown>;
  }){
   build.onResolve({filter:/^next\/navigation$/},()=>({path:"router",namespace:"fixture"}));
   build.onLoad({filter:/.*/,namespace:"fixture"},()=>({contents:"export const useRouter=()=>({refresh(){}});",loader:"ts"}));
   build.onResolve({filter:/^@\//},args=>build.resolve(join(root,"src",args.path.slice(2)),{resolveDir:root,kind:args.kind}));
  }}],
  define:{"process.env.NODE_ENV":'"production"'},logLevel:"silent"
 });
 return output.outputFiles[0].text;
}
async function dbTask<T>(url:string,fn:(client:Client)=>Promise<T>):Promise<T>{
 const client=new Client({connectionString:url});
 try{await client.connect();return await fn(client);}finally{await client.end().catch(()=>undefined);}
}
test("Paramètres généraux et cérémonies : vrais formulaires Chromium, HTTP et base PostgreSQL isolée",
 {skip:!allowed,timeout:90000},async()=>{
 assert.ok(source);
 const uri=new URL(source);uri.pathname="/"+database;
 const maintenance=new URL(source);maintenance.pathname="/postgres";
 const databaseUri=uri.toString();
 let created=false;
 let browser:Awaited<ReturnType<typeof puppeteer.launch>>|undefined;
 let server:ReturnType<typeof createServer>|undefined;
 try{
  await dbTask(maintenance.toString(),async client=>{await client.query('CREATE DATABASE "'+database+'"');});
  created=true;
  assert.deepEqual(await installExpress({
   password:"MotDePasseDeRecette2026",adminUsername:"admin",
   adminEmail:"admin@example.test"
  },databaseUri),{ok:true},"Le schéma natif SMN v33 doit être installé avant les tests");
  await dbTask(databaseUri,async client=>{
   const schema=await client.query("SELECT schema_version FROM public.smn_installation WHERE id='singleton'");
   assert.equal(schema.rows[0]?.schema_version,33,"La base jetable contient un SMN v33 réel");

   await client.query("CREATE TABLE fixture_settings (id integer primary key, data jsonb not null, revision integer not null)");
   await client.query("CREATE TABLE fixture_ceremonies (id text primary key, data jsonb not null, revision integer not null)");
   await client.query("INSERT INTO fixture_settings VALUES (1,$1::jsonb,3)",[JSON.stringify(baseSettings)]);
   await client.query("INSERT INTO fixture_ceremonies VALUES ('ceremony-one',$1::jsonb,4)",[JSON.stringify(baseCeremony)]);
  });
  const javascript=await bundle();
  const writes:Array<{route:string;revision:unknown;status:number}>=[];
  let conflictSettings=true,conflictCeremony=true;
  server=createServer(async(request,response)=>{
   const send=(status:number,body:unknown)=>{
    response.writeHead(status,{"Content-Type":"application/json"});response.end(JSON.stringify(body));
   };
   try{
    if(request.url==="/"){
     response.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
     response.end("<!doctype html><html lang='fr'><body><div id='root'></div></body></html>");return;
    }
    if(request.url==="/api/admin/settings"){
     if(request.method==="GET"){
      const data=await dbTask(databaseUri,async client=>(await client.query("SELECT data FROM fixture_settings")).rows[0].data);
      send(200,{settings:data});return;
     }
     if(request.method==="PATCH"){
      let text="";for await(const part of request)text+=String(part);
      const input=JSON.parse(text) as Record<string,unknown>;
      if(conflictSettings){conflictSettings=false;writes.push({route:"settings",revision:input.revision,status:409});send(409,{error:"conflict"});return;}
      const updated={...baseSettings,...input,revision:Number(input.revision)+1,updatedAt:"2026-11-12T11:00:00.000Z"};
      const result=await dbTask(databaseUri,client=>client.query(
       "UPDATE fixture_settings SET data=$1::jsonb,revision=$2 WHERE id=1 AND revision=$3 RETURNING revision",
       [JSON.stringify(updated),updated.revision,input.revision]));
      writes.push({route:"settings",revision:input.revision,status:result.rowCount?200:409});
      send(result.rowCount?200:409,result.rowCount?{settings:updated,changed:true}:{error:"conflict"});return;
     }
    }
    if(request.url==="/api/admin/sprints/templates"){
     if(request.method==="GET"){
      const rows=await dbTask(databaseUri,async client=>(await client.query("SELECT data FROM fixture_ceremonies ORDER BY id")).rows);
      send(200,{teamId:null,templates:rows.map(row=>row.data)});return;
     }
     if(request.method==="POST"){
      let text="";for await(const part of request)text+=String(part);
      const input=JSON.parse(text) as {id?:string;revision?:number;template?:Record<string,unknown>;active?:boolean};
      if(conflictCeremony){conflictCeremony=false;writes.push({route:"ceremony",revision:input.revision,status:409});send(409,{error:"conflict"});return;}
      const updated={...baseCeremony,...input.template,active:input.active,revision:Number(input.revision)+1};
      const result=await dbTask(databaseUri,client=>client.query(
       "UPDATE fixture_ceremonies SET data=$1::jsonb,revision=$2 WHERE id=$3 AND revision=$4 RETURNING revision",
       [JSON.stringify(updated),updated.revision,input.id,input.revision]));
      writes.push({route:"ceremony",revision:input.revision,status:result.rowCount?200:409});
      send(result.rowCount?200:409,result.rowCount?{ok:true}:{error:"conflict"});return;
     }
    }
    send(404,{error:"not-found"});
   }catch{send(500,{error:"test-http-error"});}
  });
  await new Promise<void>(done=>server!.listen(0,"127.0.0.1",done));
  const address=server.address();assert.ok(address&&typeof address!=="string");
  const chrome=await detectChrome();assert.equal(chrome.ok,true,"Chromium obligatoire");
  browser=await puppeteer.launch({executablePath:chrome.path,headless:true,
   args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page=await browser.newPage();
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto("http://127.0.0.1:"+address.port+"/");
  await page.addScriptTag({content:javascript});
  await page.waitForSelector("#country");
  await page.waitForFunction(()=>document.querySelectorAll("#template-existing option").length===2);
  await page.select("#country","DE");
  await page.click("#general-fixture form button[type=submit]");
  await page.waitForSelector("#general-fixture [role=alert]");
  assert.deepEqual(writes[0],{route:"settings",revision:3,status:409});
  assert.equal(await page.$eval("#country",el=>(el as HTMLSelectElement).value),"DE");
  await page.click("#general-fixture form button[type=submit]");
  await page.waitForSelector("#general-fixture .alert-success");
  const updatedSettings=await dbTask(databaseUri,async client=>(await client.query("SELECT data FROM fixture_settings")).rows[0].data);
  assert.equal(updatedSettings.referenceCountry,"DE");assert.equal(updatedSettings.revision,4);
  assert.deepEqual(writes[1],{route:"settings",revision:3,status:200});

  await page.select("#template-existing","ceremony-one");
  await page.waitForFunction(()=>(document.querySelector("#template-name") as HTMLInputElement)?.value==="Daily");
  await page.select("#template-frequency","weekly");
  await page.waitForSelector("#template-day");
  await page.select("#template-day","3");
  await page.$eval("#template-name",el=>{
   const input=el as HTMLInputElement;
   Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!.call(input,"Daily revue");
   input.dispatchEvent(new Event("input",{bubbles:true}));
  });
  await page.waitForFunction(()=>!(document.querySelector("#ceremony-fixture button[type=submit]") as HTMLButtonElement).disabled);
  await page.click("#ceremony-fixture button[type=submit]");
  await page.waitForSelector("#ceremony-fixture [role=alert]");
  assert.deepEqual(writes[2],{route:"ceremony",revision:4,status:409});
  assert.equal(await page.$eval("#template-name",el=>(el as HTMLInputElement).value),"Daily revue");
  await page.click("#ceremony-fixture button[type=submit]");
  await page.waitForSelector("#ceremony-fixture .alert-success");
  const updatedCeremony=await dbTask(databaseUri,async client=>(await client.query("SELECT data FROM fixture_ceremonies")).rows[0].data);
  assert.equal(updatedCeremony.name,"Daily revue");assert.equal(updatedCeremony.frequency,"weekly");
  assert.equal(updatedCeremony.weekday,3);assert.equal(updatedCeremony.revision,5);
  assert.deepEqual(writes[3],{route:"ceremony",revision:4,status:200});
  assert.deepEqual(errors,[]);
 }finally{
  await browser?.close().catch(()=>undefined);
  if(server)await new Promise<void>(done=>server!.close(()=>done()));
  if(created)await dbTask(maintenance.toString(),async client=>{
   await client.query('DROP DATABASE IF EXISTS "'+database+'" WITH (FORCE)');
  });
 }
});
