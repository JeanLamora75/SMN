import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {createRequire} from "node:module";
import {dirname,resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
import puppeteer from "puppeteer-core";
import {detectChrome} from "../scripts/report-chrome.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const require=createRequire(import.meta.url);
const esbuild=require(createRequire(require.resolve("tsx/package.json")).resolve("esbuild"));
const original={id:"team-one",name:"Équipe Alpha",agileMode:"scrum",isArchived:false,
 canChangeMode:true,productName:"Produit initial",vision:null,productGoal:null,revision:3};

async function bundle(){
 const entry=`
 import React from "react";
 import {createRoot} from "react-dom/client";
 import {LocaleProvider} from "@/i18n/client";
 import TeamsSettings from "@/app/app/admin/settings/teams/teams-settings";
 createRoot(document.getElementById("root")!).render(
  <LocaleProvider locale="fr"><TeamsSettings/></LocaleProvider>);
 `;
 const result=await esbuild.build({
  stdin:{contents:entry,resolveDir:root,sourcefile:"teams-settings-browser-fixture.tsx",loader:"tsx"},
  bundle:true,format:"iife",platform:"browser",jsx:"automatic",write:false,
  plugins:[{name:"smn-src-alias",setup(build){
   build.onResolve({filter:/^@\//},args=>build.resolve(join(root,"src",args.path.slice(2)),{resolveDir:root,kind:args.kind}));
  }}],
  define:{"process.env.NODE_ENV":'"production"'},logLevel:"silent"
 });
 return result.outputFiles[0].text;
}

test("Paramètres Équipes : sélection, édition, refus de conflit et sauvegarde via HTTP",{timeout:60000},async()=>{
 const detected=await detectChrome();
 assert.equal(detected.ok,true,"Chromium obligatoire pour le test interactif");
 const js=await bundle();
 const state={items:[{...original}] as Array<typeof original>,writes:[] as Array<{method:string;body:Record<string,unknown>}>,
  failNext:false,reads:0};
 const server=createServer(async(req,res)=>{
  const send=(code:number,value:unknown)=>{res.writeHead(code,{"Content-Type":"application/json"});res.end(JSON.stringify(value));};
  if(req.url==="/api/admin/teams"){
   if(req.method==="GET"){state.reads++;send(200,{items:state.items,canWrite:true});return;}
   if(req.method==="PATCH"||req.method==="POST"){
    let body="";
    for await(const chunk of req)body+=String(chunk);
    const parsed=JSON.parse(body) as Record<string,unknown>;
    state.writes.push({method:req.method,body:parsed});
    if(state.failNext){state.failNext=false;send(409,{ok:false,error:"conflict"});return;}
    if(req.method==="PATCH"){
     if(parsed.revision!==state.items[0].revision){send(409,{ok:false,error:"conflict"});return;}
     state.items[0]={...state.items[0],name:String(parsed.name),
      productName:typeof parsed.productName==="string"?parsed.productName:null,
      vision:typeof parsed.vision==="string"?parsed.vision:null,
      productGoal:typeof parsed.productGoal==="string"?parsed.productGoal:null,
      revision:state.items[0].revision+1};
     send(200,{ok:true,changed:true,revision:state.items[0].revision});return;
    }
    send(400,{ok:false,error:"invalid-input"});return;
   }
  }
  if(req.url==="/"){res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
   res.end("<!doctype html><html lang='fr'><head><meta charset='utf-8'></head><body><div id='root'></div></body></html>");return;}
  res.writeHead(404);res.end();
 });
 await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
 const address=server.address();
 assert.ok(address&&typeof address!=="string");
 let browser:Awaited<ReturnType<typeof puppeteer.launch>>|undefined;
 try{
  browser=await puppeteer.launch({executablePath:detected.path,headless:true,
   args:["--no-sandbox","--disable-dev-shm-usage","--no-first-run","--no-default-browser-check"]});
  const page=await browser.newPage();
  const pageErrors:string[]=[];
  page.on("pageerror",e=>pageErrors.push(e.message));
  await page.goto("http://127.0.0.1:"+address.port+"/");
  await page.addScriptTag({content:js});
  await page.waitForFunction(()=>document.querySelectorAll(".list-group-item button").length===1);
  await page.click(".list-group-item button");
  assert.equal(await page.$eval("#smn-team-settings-name",el=>(el as HTMLInputElement).value),"Équipe Alpha");
  assert.equal(await page.$eval("form button[type=submit]",el=>(el as HTMLButtonElement).disabled),true);
  await page.$eval("#smn-team-settings-name",el=>{
   const input=el as HTMLInputElement;
   const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!;
   setter.call(input,"Équipe Alpha revue");
   input.dispatchEvent(new Event("input",{bubbles:true}));
  });
  await page.waitForFunction(()=>document.querySelector("form")?.getAttribute("data-smn-unsaved-changes")==="true");
  assert.equal(await page.$eval("form button[type=submit]",el=>(el as HTMLButtonElement).disabled),false);
  state.failNext=true;
  await page.click("form button[type=submit]");
  await page.waitForSelector("[role=alert]");
  assert.equal(state.items[0].name,"Équipe Alpha","Conflit : aucune écriture persistée");
  assert.equal(state.writes[0].method,"PATCH");
  assert.equal(state.writes[0].body.revision,3);
  assert.equal(state.writes[0].body.name,"Équipe Alpha revue");
  assert.equal(await page.$eval("form",el=>el.getAttribute("data-smn-unsaved-changes")),"true");
  await page.click("form button[type=submit]");
  await page.waitForFunction(()=>document.querySelector("form")?.getAttribute("data-smn-unsaved-changes")==="false");
  assert.equal(state.items[0].name,"Équipe Alpha revue");
  assert.equal(state.items[0].revision,4);
  assert.equal(state.writes[1].body.revision,3);
  assert.equal(state.reads>=2,true,"La liste doit être rechargée après sauvegarde");
  assert.deepEqual(pageErrors,[]);
 }finally{
  if(browser)await browser.close();
  await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));
 }
});
