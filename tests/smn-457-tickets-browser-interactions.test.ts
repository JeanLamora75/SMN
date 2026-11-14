import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {createRequire} from "node:module";
import {dirname,resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
import {mkdtemp,writeFile,rm,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import puppeteer,{type ElementHandle} from "puppeteer-core";
import {detectChrome} from "../scripts/report-chrome.mjs";
import {validateTicketCsv} from "../src/lib/ticket-csv-contract";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const require=createRequire(import.meta.url);
const esbuild=require(createRequire(require.resolve("tsx/package.json")).resolve("esbuild"));
type Saved={teamId:string;cycleId:string;mode:string;businessDate:string;filename:string;csv:string;expectedSnapshotId?:string};
const csv=["id,type,resume,priority,status,sp",
 "QA-1,Story,Premier ticket,Haute,Terminé,3"].join("\n");

async function bundle(){
 const entry=`
 import React,{useState} from "react";
 import {createRoot} from "react-dom/client";
 import {LocaleProvider} from "@/i18n/client";
 import TicketsImportDialog from "@/app/app/tickets/tickets-import-dialog";
 function TestApp(){
  const [open,setOpen]=useState(true);
  const lang=new URLSearchParams(location.search).get("lang")==="en"?"en":"fr";
  return <LocaleProvider locale={lang}>
   <main><button id="reopen" type="button" onClick={()=>setOpen(true)}>Open</button></main>
   {open&&<TicketsImportDialog scope={{teamId:"team1",cycleId:"sprint1",mode:"scrum"}}
    cycleName="Sprint QA" onClose={()=>setOpen(false)}
    onSaved={id=>{(window as any).__saved=id;setOpen(false);}}/>}
  </LocaleProvider>;
 }
 createRoot(document.getElementById("root")!).render(<TestApp/>);
 `;
 const result=await esbuild.build({
  stdin:{contents:entry,resolveDir:root,sourcefile:"tickets-import-browser-fixture.tsx",loader:"tsx"},
  bundle:true,format:"iife",platform:"browser",jsx:"automatic",write:false,
  plugins:[{name:"smn-alias",setup(build:{
   onResolve:(options:{filter:RegExp},callback:(args:{path:string;kind:string})=>Promise<unknown>)=>void;
   resolve:(path:string,options:{resolveDir:string;kind:string})=>Promise<unknown>;
  }){
   build.onResolve({filter:/^@\//},(args:{path:string;kind:string})=>
    build.resolve(join(root,"src",args.path.slice(2)),{resolveDir:root,kind:args.kind}));
  }}],
  define:{"process.env.NODE_ENV":'"production"'},logLevel:"silent"
 });
 return result.outputFiles[0].text;
}

test("SMN-457 — Chromium : import invalide, conflit de date, modale de remplacement et clavier FR/EN",
 {timeout:90000},async t=>{
 const chrome=await detectChrome();
 assert.equal(chrome.ok,true,"Chromium est obligatoire : pas de faux succès en cas d'absence du navigateur");
 const script=await bundle();
 const temp=await mkdtemp(join(tmpdir(),"smn-457-browser-"));
 t.after(()=>rm(temp,{recursive:true,force:true}));
 const good=join(temp,"valid.csv"),bad=join(temp,"invalid.csv");
 await writeFile(good,csv);
 await writeFile(bad,"Id jira,Statut\nQA-1,Done");
 const css=(await Promise.all([
  readFile(join(root,"src/app/modal-cockpit.css"),"utf8"),
  readFile(join(root,"src/app/app/tickets/tickets-cockpit.css"),"utf8"),
 ])).join("\n");
 const originalId="11111111-1111-4111-8111-111111111111";
 const stored={snapshotId:originalId,businessDate:"2026-11-01",originalFilename:"previous.csv"};
 const writes:Saved[]=[];
 const server=createServer(async(request,response)=>{
  const send=(status:number,body:unknown)=>{
   response.writeHead(status,{"Content-Type":"application/json","Cache-Control":"no-store"});
   response.end(JSON.stringify(body));
  };
  const url=new URL(request.url??"/","http://localhost");
  if(url.pathname==="/"){
   response.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
   response.end(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
    <style>:root{--smn-surface:#fff;--smn-border:#d8e3ef;--smn-foreground:#172b4d;--smn-heading:#15375e;--smn-muted:#5b6672;--smn-brand:#176bb0}
    [data-bs-theme=dark]{--smn-surface:#192633;--smn-border:#546475;--smn-foreground:#fff;--smn-heading:#fff;--smn-muted:#ccd5de}</style>
    <style>${css}</style></head><body><div id="root"></div></body></html>`);
   return;
  }
  if(url.pathname==="/api/admin/tickets/snapshots"&&request.method==="GET"){
   send(200,{snapshots:[stored]});return;
  }
  if(url.pathname==="/api/admin/tickets/validate"&&request.method==="POST"){
   let body="";
   for await(const part of request)body+=String(part);
   const input=JSON.parse(body) as {csv:string};
   const result=validateTicketCsv(input.csv);
   send(result.valid?200:422,{...result,rowCount:result.valid?result.rows.length:0});
   return;
  }
  if(url.pathname==="/api/admin/tickets/snapshots"&&request.method==="POST"){
   let body="";
   for await(const part of request)body+=String(part);
   const input=JSON.parse(body) as Saved;
   writes.push(input);
   if(!input.expectedSnapshotId){send(409,{error:"confirmation-required"});return;}
   if(input.expectedSnapshotId!==stored.snapshotId){
    send(409,{error:"stale-confirmation"});return;
   }
   send(201,{snapshot:{snapshotId:"22222222-2222-4222-8222-222222222222"}});
   return;
  }
  send(404,{error:"not-found"});
 });
 await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
 const addr=server.address();assert.ok(addr&&typeof addr!=="string");
 let browser:Awaited<ReturnType<typeof puppeteer.launch>>|null=null;
 try{
  browser=await puppeteer.launch({executablePath:chrome.path,headless:true,
   args:["--no-sandbox","--disable-dev-shm-usage","--no-first-run"]});
  for(const lang of ["fr","en"] as const){
   const baselineWrites=writes.length;
   const page=await browser.newPage();
   const errors:string[]=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.goto("http://127.0.0.1:"+addr.port+"/?lang="+lang);
   await page.addScriptTag({content:script});
   await page.waitForSelector("dialog.smn-tickets-import-dialog[open]");
   const heading=await page.$eval("#smn-tickets-import-title",element=>element.textContent);
   assert.match(heading??"",lang==="fr"?/Importer une photographie CSV/:/Import a CSV snapshot/);
   await page.evaluate(()=>document.documentElement.setAttribute("data-bs-theme","dark"));
   assert.equal(await page.$eval("dialog",element=>getComputedStyle(element).position),"fixed");
   const initialFocus=await page.evaluate(()=>document.activeElement?.closest("dialog")!==null);
   assert.equal(initialFocus,true,"Focus initial contenu dans la modale native");
   const detailsSelector="details.smn-tickets-import-columns";
   assert.equal(await page.$eval(detailsSelector,node=>(node as HTMLDetailsElement).open),false,
    "Les colonnes CSV sont repliées par défaut");
   await page.click(detailsSelector+" summary");
   assert.equal(await page.$eval(detailsSelector,node=>(node as HTMLDetailsElement).open),true);
   const expectedHeaders=["id","type","resume","priority","status","sp"];
   assert.deepEqual(await page.$eval(detailsSelector+" li code",nodes=>
    nodes.map(node=>node.textContent)),expectedHeaders);
   await page.keyboard.press("Tab");
   await page.click(detailsSelector+" summary");
   assert.equal(await page.$eval(detailsSelector,node=>(node as HTMLDetailsElement).open),false);
   const fileInput=await page.$("#smn-tickets-import-file") as ElementHandle<HTMLInputElement>|null;
   assert.ok(fileInput);
   await fileInput.uploadFile(bad);
   await page.$eval("#smn-tickets-import-date",element=>{
    const input=element as HTMLInputElement;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!.call(input,"2026-11-01");
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
   });
   await page.click("button[type=submit]");
   await page.waitForSelector("dialog [role=alert]");
   assert.equal(writes.length,baselineWrites,"CSV invalide refusé sans publication");
   await fileInput.uploadFile(good);
   await page.click("button[type=submit]");
   await page.waitForSelector("dialog .alert-warning");
   assert.equal(writes.length,baselineWrites,"Une date existante nécessite une confirmation préalable");
   assert.ok(await page.$("dialog.smn-tickets-import-dialog[open]"),"Confirmation dans une modale native");
   await page.keyboard.press("Escape");
   // Cancel either returns to the form or closes the modal, never publishes.
   assert.equal(writes.length,baselineWrites);
   const current=await page.$("dialog.smn-tickets-import-dialog[open]");
   if(!current)await page.click("#reopen");
   await page.waitForSelector("#smn-tickets-import-file");
   await (await page.$("#smn-tickets-import-file") as ElementHandle<HTMLInputElement>)!.uploadFile(good);
   await page.$eval("#smn-tickets-import-date",element=>{
    const input=element as HTMLInputElement;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!.call(input,"2026-11-01");
    input.dispatchEvent(new Event("input",{bubbles:true}));
    input.dispatchEvent(new Event("change",{bubbles:true}));
   });
   await page.click("button[type=submit]");
   await page.waitForSelector("button.btn-danger:not([disabled])");
   await page.click("button.btn-danger");
   await page.waitForFunction(()=>(window as any).__saved==="22222222-2222-4222-8222-222222222222");
   assert.equal(writes.at(-1)?.expectedSnapshotId,originalId);
   assert.deepEqual(errors,[],"Aucune erreur JavaScript dans Chromium");
   await page.close();
  }
 }finally{
  if(browser)await browser.close();
  await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
 }
});
