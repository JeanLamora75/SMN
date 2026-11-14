import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {createRequire} from "node:module";
import {dirname,resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
import {readFile} from "node:fs/promises";
import puppeteer from "puppeteer-core";
import {detectChrome} from "../scripts/report-chrome.mjs";
import {browseTicketCsv} from "../src/lib/ticket-csv-browse";
import {compareTicketSnapshots,type TicketSnapshotRef} from "../src/lib/ticket-csv-compare";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const require=createRequire(import.meta.url);
const esbuild=require(createRequire(require.resolve("tsx/package.json")).resolve("esbuild"));
const csvHeader="id,type,resume,priority,status,sp";
const before=[csvHeader,
 "PRO-1,Story,Fonction,Haute,In Progress,2",
 "PRO-2,Bug,Erreur,Haute,Done,3",
 "PRO-3,Task,Vérifier,Moyenne,Doing,1"].join("\n");
const after=[csvHeader,
 "PRO-1,Story,Fonction,Haute,Terminé,3",
 "PRO-2,Bug,Erreur,Haute,Done,3",
 "PRO-4,Task,Améliorer,Basse,À faire,1"].join("\n");
const old={snapshotId:"11111111-1111-4111-8111-111111111111",
 businessDate:"2026-11-01",originalFilename:"before.csv",importedAt:"2026-11-01T12:00:00Z",rowCount:3};
const recent={snapshotId:"22222222-2222-4222-8222-222222222222",
 businessDate:"2026-11-10",originalFilename:"after.csv",importedAt:"2026-11-10T12:00:00Z",rowCount:3};
const ref=(file:typeof old):TicketSnapshotRef=>({
 teamId:"team1",cycleId:"sprint1",mode:"scrum",
 businessDate:file.businessDate,snapshotId:file.snapshotId,
});
const differences=compareTicketSnapshots({reference:ref(old),csv:before},{reference:ref(recent),csv:after});

async function bundle(){
 const entry=`
 import React,{useState} from "react";
 import {createRoot} from "react-dom/client";
 import {LocaleProvider} from "@/i18n/client";
 import TicketsConsultation from "@/app/app/tickets/tickets-consultation";
 import TicketsComparison from "@/app/app/tickets/tickets-comparison";
 const context={teamId:"team1",cycleId:"sprint1",mode:"scrum",role:"admin",cycleName:"Sprint QA",
  cycleStatus:"active",state:"ready"} as const;
 const recent={snapshotId:"22222222-2222-4222-8222-222222222222",
  businessDate:"2026-11-10",originalFilename:"after.csv",importedAt:"2026-11-10T12:00:00Z",rowCount:3};
 const old={snapshotId:"11111111-1111-4111-8111-111111111111",
  businessDate:"2026-11-01",originalFilename:"before.csv",importedAt:"2026-11-01T12:00:00Z",rowCount:3};
 function App(){
  const [tab,setTab]=useState<"browse"|"compare">("browse");
  const lang=new URLSearchParams(location.search).get("lang")==="en"?"en":"fr";
  return <LocaleProvider locale={lang}>
   <nav><button id="tab-browse" onClick={()=>setTab("browse")}>Browse</button>
    <button id="tab-compare" onClick={()=>setTab("compare")}>Compare</button></nav>
   {tab==="browse"?<TicketsConsultation context={context} snapshot={recent}
    onBack={()=>setTab("compare")}/>:
    <TicketsComparison context={context} snapshots={[recent,old]}
     onBack={()=>setTab("browse")}/>}
  </LocaleProvider>;
 }
 createRoot(document.getElementById("root")!).render(<App/>);
 `;
 const built=await esbuild.build({
  stdin:{contents:entry,resolveDir:root,sourcefile:"smn-tickets-consult-browser.tsx",loader:"tsx"},
  bundle:true,write:false,platform:"browser",format:"iife",jsx:"automatic",
  plugins:[{name:"alias",setup(build:{
   onResolve:(options:{filter:RegExp},callback:(args:{path:string;kind:string})=>Promise<unknown>)=>void;
   resolve:(path:string,options:{resolveDir:string;kind:string})=>Promise<unknown>;
  }){
   build.onResolve({filter:/^@\//},(args:{path:string;kind:string})=>
    build.resolve(join(root,"src",args.path.slice(2)),{resolveDir:root,kind:args.kind}));
  }}],
  define:{"process.env.NODE_ENV":'"production"'},logLevel:"silent",
 });
 return built.outputFiles[0].text;
}
test("SMN-457 — Chromium : filtres, onglets, comparaison avant/après, FR/EN et petit écran",
 {timeout:90000},async()=>{
 const chrome=await detectChrome();assert.equal(chrome.ok,true);
 const script=await bundle();
 const css=await readFile(join(root,"src/app/app/tickets/tickets-cockpit.css"),"utf8");
 const server=createServer((req,res)=>{
  const url=new URL(req.url??"/","http://localhost");
  const send=(value:unknown)=>{res.writeHead(200,{"Content-Type":"application/json"});
   res.end(JSON.stringify(value));};
  if(url.pathname==="/"){
   res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
   res.end(`<!doctype html><html><head><meta charset="utf-8">
    <style>:root{--smn-surface:#fff;--smn-border:#d8e3ef;--smn-foreground:#162d43;
    --smn-heading:#123457;--smn-muted:#516273;--smn-muted-soft:#eff4f8;--smn-brand:#1770bd}
    [data-bs-theme=dark]{--smn-surface:#172535;--smn-border:#526476;--smn-foreground:#f5f5f5;
    --smn-heading:#fff;--smn-muted:#bac9d5;--smn-muted-soft:#2b3845;--smn-brand:#79b8fa}</style>
    <style>${css}</style></head><body><div id="root"></div></body></html>`);
   return;
  }
  if(url.pathname==="/api/admin/tickets/browse"){
   const p=url.searchParams;
   const result=browseTicketCsv(after,{
    search:p.get("search")??"",issueType:p.get("issueType")??"",
    status:p.get("status")??"",priority:p.get("priority")??"",
    prefix:p.get("prefix")??"",sort:(p.get("sort")??"jiraId") as "jiraId",
    direction:(p.get("direction")??"asc") as "asc",
    page:Number(p.get("page")??"1"),pageSize:Number(p.get("pageSize")??"50"),
   });
   send({...result,jiraBaseUrl:"https://test.atlassian.net",snapshot:recent});
   return;
  }
  if(url.pathname==="/api/admin/tickets/compare"){
   const p=url.searchParams,kind=p.get("kind")??"all",search=(p.get("search")??"").toLowerCase();
   const changed=differences.changes.filter(item=>
    (kind==="all"||item.kinds.includes(kind as never))&&
    (!search||item.jiraId.toLowerCase().includes(search)||
     item.after?.title.toLowerCase().includes(search)||
     item.before?.title.toLowerCase().includes(search)));
   const pageSize=Number(p.get("pageSize")??"50"),page=Number(p.get("page")??"1");
   send({older:differences.older,newer:differences.newer,counts:differences.counts,
    changes:changed.slice((page-1)*pageSize,page*pageSize),
    total:changed.length,page,pageSize,pageCount:Math.max(1,Math.ceil(changed.length/pageSize)),
    jiraBaseUrl:"https://test.atlassian.net"});
   return;
  }
  res.writeHead(404);res.end("not-found");
 });
 await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
 const addr=server.address();assert.ok(addr&&typeof addr!=="string");
 let browser:Awaited<ReturnType<typeof puppeteer.launch>>|null=null;
 try{
  browser=await puppeteer.launch({executablePath:chrome.path,headless:true,
   args:["--no-sandbox","--disable-dev-shm-usage","--no-first-run"]});
  for(const locale of ["fr","en"] as const){
   const page=await browser.newPage();
   await page.setViewport(locale==="fr"?{width:1440,height:900}:{width:390,height:844});
   const jsErrors:string[]=[];
   page.on("pageerror",error=>jsErrors.push(error.message));
   await page.goto("http://127.0.0.1:"+addr.port+"/?lang="+locale);
   await page.addScriptTag({content:script});
   await page.waitForSelector(".smn-tickets-browse-table tbody tr");
   assert.equal(await page.$$(".smn-tickets-browse-table tbody tr").then(items=>items.length),3);
   const jira=await page.$eval(".smn-tickets-browse-table tbody tr a",el=>el.getAttribute("href"));
   assert.equal(jira,"https://test.atlassian.net/browse/PRO-1");
   await page.select(".smn-tickets-browse-field select","Bug");
   await page.waitForFunction(()=>document.querySelectorAll(".smn-tickets-browse-table tbody tr").length===1);
   assert.match(await page.$eval(".smn-tickets-browse-table tbody tr",el=>el.textContent??""),/PRO-2/);
   await page.click(".smn-tickets-browse-filter-reset button");
   await page.waitForFunction(()=>document.querySelectorAll(".smn-tickets-browse-table tbody tr").length===3);
   await page.click("#tab-compare");
   await page.waitForSelector(".smn-tickets-compare-table tbody tr");
   assert.equal(await page.$$(".smn-tickets-compare-table tbody tr").then(items=>items.length),3);
   assert.match(await page.$eval(".smn-tickets-compare-summary",el=>el.textContent??""),
    locale==="fr"?/Tickets distincts modifiés/:/Distinct changed tickets/);
   await page.select(".smn-tickets-compare-filter-grid select","completed");
   await page.waitForFunction(()=>document.querySelectorAll(".smn-tickets-compare-table tbody tr").length===1);
   assert.match(await page.$eval(".smn-tickets-compare-table tbody tr",el=>el.textContent??""),/PRO-1/);
   await page.click(".smn-tickets-compare-table details summary");
   const detail=await page.$eval(".smn-tickets-compare-table details",el=>el.textContent??"");
   assert.match(detail,locale==="fr"?/Statut/:/Status/);
   await page.evaluate(()=>document.documentElement.setAttribute("data-bs-theme","dark"));
   assert.notEqual(await page.$eval(".smn-tickets-panel",el=>getComputedStyle(el).backgroundColor),"rgba(0, 0, 0, 0)");
   assert.deepEqual(jsErrors,[],"Aucune erreur Javascript au changement des onglets et filtres");
   await page.close();
  }
 }finally{
  if(browser)await browser.close();
  await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
 }
});
