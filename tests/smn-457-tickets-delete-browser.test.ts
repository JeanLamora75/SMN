import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {createRequire} from "node:module";
import {dirname,join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {readFile} from "node:fs/promises";
import puppeteer from "puppeteer-core";
import {detectChrome} from "../scripts/report-chrome.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const require=createRequire(import.meta.url);
const esbuild=require(createRequire(require.resolve("tsx/package.json")).resolve("esbuild"));
const first={snapshotId:"11111111-1111-4111-8111-111111111111",businessDate:"2026-11-01",
 originalFilename:"snapshot-1.csv",importedAt:"2026-11-01T12:00:00Z",rowCount:1,csvBytes:120};

async function bundle(){
 const entry=`
 import React from "react";
 import {createRoot} from "react-dom/client";
 import {LocaleProvider} from "@/i18n/client";
 import {TicketsCycleProvider} from "@/app/app/tickets-cycle-context";
 import TicketsFiles from "@/app/app/tickets/tickets-files";
 function App(){
  return <LocaleProvider locale="fr">
   <TicketsCycleProvider value={{teamId:"team1",cycleId:"sprint1",mode:"scrum",
    role:"admin",cycleName:"Sprint QA",cycleStatus:"active",state:"ready",
    canManageIndicators:false}}>
    <TicketsFiles/>
   </TicketsCycleProvider>
  </LocaleProvider>;
 }
 createRoot(document.getElementById("root")!).render(<App/>);
 `;
 const built=await esbuild.build({
  stdin:{contents:entry,resolveDir:root,sourcefile:"smn-457-delete-fixture.tsx",loader:"tsx"},
  bundle:true,write:false,format:"iife",platform:"browser",jsx:"automatic",
  plugins:[
   {name:"qa-indicators-stub",setup(build:{
    onResolve:(o:{filter:RegExp},f:(a:{path:string})=>unknown)=>void;
    onLoad:(o:{filter:RegExp;namespace?:string},f:()=>unknown)=>void;
   }){
    build.onResolve({filter:/admin\/indicators\/universal-input$/},()=>({
     path:"input-stub",namespace:"qa-stub",
    }));
    build.onLoad({filter:/.*/,namespace:"qa-stub"},()=>({
     contents:'export default function Stub(){return null}',loader:"js",
    }));
   }},
   {name:"qa-alias",setup(build:{
    onResolve:(o:{filter:RegExp},f:(a:{path:string;kind:string})=>Promise<unknown>)=>void;
    resolve:(path:string,o:{resolveDir:string;kind:string})=>Promise<unknown>;
   }){
    build.onResolve({filter:/^@\//},args=>
     build.resolve(join(root,"src",args.path.slice(2)),{resolveDir:root,kind:args.kind}));
   }},
  ],
  define:{"process.env.NODE_ENV":'"production"'},logLevel:"silent",
 });
 return built.outputFiles[0].text;
}

test("SMN-457 — Chromium : annulation, clôture tardive et suppression confirmée en modale Cockpit Agile",
 {timeout:75000},async()=>{
 const chrome=await detectChrome();assert.equal(chrome.ok,true);
 const script=await bundle();
 const css=await readFile(join(root,"src/app/app/tickets/tickets-cockpit.css"),"utf8");
 const state={items:[first],closed:false,denyNext:true,deletes:0};
 const server=createServer(async(req,res)=>{
  const url=new URL(req.url??"/","http://localhost");
  const send=(code:number,data:unknown)=>{
   res.writeHead(code,{"Content-Type":"application/json","Cache-Control":"no-store"});
   res.end(JSON.stringify(data));
  };
  if(url.pathname==="/"){
   res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
   res.end(`<!doctype html><html lang="fr"><head><meta charset="utf-8">
    <style>:root{--smn-context-start:#253f6a;--smn-context-end:#355b90;
     --smn-surface:white;--smn-border:#cbd8e4;--smn-foreground:#172b4d;
     --smn-heading:#102f52;--smn-muted:#475569;--smn-muted-soft:#eff3f8;--smn-brand:#176bb0}
    </style><style>${css}</style></head><body><div id="root"></div></body></html>`);
   return;
  }
  if(url.pathname==="/api/admin/tickets/snapshots"&&req.method==="GET"){
   send(200,{snapshots:state.items,closed:state.closed});return;
  }
  if(url.pathname==="/api/admin/tickets/snapshots"&&req.method==="DELETE"){
   state.deletes++;
   let body="";for await(const part of req)body+=String(part);
   const payload=JSON.parse(body) as {expectedSnapshotId:string;businessDate:string};
   assert.equal(payload.expectedSnapshotId,first.snapshotId);
   assert.equal(payload.businessDate,first.businessDate);
   if(state.closed||state.denyNext){
    state.denyNext=false;send(409,{error:"closed-sprint"});return;
   }
   state.items=[];send(200,{removed:true});return;
  }
  send(404,{error:"not-found"});
 });
 await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
 const addr=server.address();assert.ok(addr&&typeof addr!=="string");
 let browser:Awaited<ReturnType<typeof puppeteer.launch>>|null=null;
 try{
  browser=await puppeteer.launch({executablePath:chrome.path,headless:true,
   args:["--no-sandbox","--disable-dev-shm-usage","--no-first-run"]});
  const page=await browser.newPage();
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:"+addr.port+"/");
  await page.addScriptTag({content:script});
  await page.waitForSelector(".smn-tickets-table tbody tr");
  const remove='button[aria-label^="Supprimer :"]';
  await page.click(remove);
  await page.waitForSelector("dialog.smn-tickets-dialog[open]");
  await page.keyboard.press("Escape");
  await page.waitForFunction(()=>!document.querySelector("dialog.smn-tickets-dialog[open]"));
  assert.equal(state.deletes,0,"Annuler n'émet aucune requête DELETE");
  await page.click(remove);
  await page.waitForSelector("dialog.smn-tickets-dialog[open]");
  await page.click("dialog.smn-tickets-dialog .btn-danger");
  await page.waitForSelector("dialog.smn-tickets-dialog [role=alert]");
  assert.equal(state.deletes,1,"Le refus tardif serveur empêche de masquer le CSV");
  assert.equal(state.items.length,1);
  await page.click('dialog.smn-tickets-dialog .btn-close');
  await page.click(remove);
  await page.waitForSelector("dialog.smn-tickets-dialog[open]");
  await page.click("dialog.smn-tickets-dialog .btn-danger");
  await page.waitForFunction(()=>document.querySelector(".smn-tickets-files tbody tr")===null);
  assert.equal(state.deletes,2);
  assert.equal(state.items.length,0);
  assert.deepEqual(errors,[]);
  await page.close();
 }finally{
  if(browser)await browser.close();
  await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
 }
});
