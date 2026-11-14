import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {createRequire} from "node:module";
import {dirname,join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import puppeteer from "puppeteer-core";
import {detectChrome} from "../scripts/report-chrome.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const require=createRequire(import.meta.url);
const esbuild=require(createRequire(require.resolve("tsx/package.json")).resolve("esbuild"));

async function browserFixture(){
 const entry=String.raw`
 import React,{useState} from "react";
 import {createRoot} from "react-dom/client";
 import {LocaleProvider} from "@/i18n/client";
 import HelpHeaderAction from "@/app/app/help/help-header-action";
 function Fixture(){
  const [filter,setFilter]=useState("active");
  const [draft,setDraft]=useState("");
  return <LocaleProvider locale="fr"><main>
   <header><h1 id="screen-title">Écran métier</h1>
    <HelpHeaderAction screenTitle="Écran métier"/></header>
   <label>Filtre <select id="filter" value={filter}
    onChange={event=>setFilter(event.target.value)}>
    <option value="active">Actifs</option><option value="all">Tous</option>
   </select></label>
   <label>Brouillon <input id="draft" value={draft}
    onChange={event=>setDraft(event.target.value)}/></label>
   <output id="draft-status">{draft}</output>
  </main></LocaleProvider>;
 }
 createRoot(document.getElementById("root")!).render(<Fixture/>);
 `;
 const result=await esbuild.build({
  stdin:{contents:entry,resolveDir:root,sourcefile:"help-headers-browser-fixture.tsx",loader:"tsx"},
  bundle:true,platform:"browser",format:"iife",write:false,jsx:"automatic",
  define:{"process.env.NODE_ENV":'"production"'},
  plugins:[{name:"fixture-resolve",setup(build:any){
   build.onResolve({filter:/^@\//},(args:any)=>
    build.resolve(join(root,"src",args.path.slice(2)),{resolveDir:root,kind:args.kind}));
   build.onResolve({filter:/^next\/navigation$/},()=>
    ({path:"navigation",namespace:"fixture"}));
   build.onResolve({filter:/^next\/link$/},()=>
    ({path:"link",namespace:"fixture"}));
   build.onLoad({filter:/.*/,namespace:"fixture"},(args:any)=>({
    contents:args.path==="navigation"?
     "export const usePathname=()=>window.location.pathname;":
     'import React from "react"; export default function Link({href,children,...props}){return React.createElement("a",{href,...props},children);}',
    loader:"jsx"
   }));
  }}],logLevel:"silent"
 });
 const js=result.outputFiles.find((file:any)=>file.path.endsWith(".js"))??result.outputFiles[0];
 assert.ok(js,"fixture JavaScript generated");
 return js.text as string;
}

test("SMN-464 — Chromium FR: aide Paramètres et Tickets sans perte de filtre/brouillon",
 {timeout:90000},async()=>{
 const detected=await detectChrome();
 assert.equal(detected.ok,true,"Chromium requis : aucun test simulé");
 const script=await browserFixture();
 const requests:string[]=[];
 const server=createServer((request,response)=>{
  const path=new URL(request.url??"/","http://localhost").pathname;
  if(path.startsWith("/api/help/articles/")){
   requests.push(path);
   const id=path.split("/").at(-1);
   if(id==="tickets"){
    response.writeHead(200,{"Content-Type":"application/json"});
    response.end(JSON.stringify({articleId:id,contentLocale:"fr",isFallback:false,
     markdown:"# Tickets\n\nConsultez les tickets de votre sprint."}));
   }else{
    response.writeHead(404,{"Content-Type":"application/json"});
    response.end(JSON.stringify({error:"unavailable"}));
   }
   return;
  }
  response.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
  response.end("<!doctype html><html lang='fr'><body><div id='root'></div></body></html>");
 });
 await new Promise<void>(done=>server.listen(0,"127.0.0.1",done));
 const address=server.address();
 assert.ok(address&&typeof address!=="string");
 let browser:Awaited<ReturnType<typeof puppeteer.launch>>|null=null;
 try{
  browser=await puppeteer.launch({executablePath:detected.path,headless:true,
   args:["--no-sandbox","--disable-dev-shm-usage","--no-first-run"]});
  for(const [route,article] of [
   ["/app/admin/settings","general-settings"],
   ["/app/tickets","tickets"]
  ]){
   const page=await browser.newPage();
   const errors:string[]=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.goto("http://127.0.0.1:"+address.port+route);
   await page.addScriptTag({content:script});
   await page.waitForSelector("header button");
   await page.select("#filter","all");
   await page.type("#draft","En cours de saisie");
   await page.click("header button");
   await page.waitForSelector("dialog[open]");
   await page.waitForFunction(()=>document.querySelector("dialog [role=alert]")||
    document.querySelector("dialog .smn-help-article")||
    document.querySelector("dialog h1"));
   assert.ok(requests.includes("/api/help/articles/"+article));
   if(article==="general-settings"){
    assert.match(await page.$eval("dialog",node=>node.textContent??""),/indisponible|disponible|Centre d'aide/i);
   }
   await page.keyboard.press("Escape");
   await page.waitForFunction(()=>!document.querySelector("dialog[open]"));
   assert.equal(await page.$eval("#filter",node=>(node as HTMLSelectElement).value),"all");
   assert.equal(await page.$eval("#draft",node=>(node as HTMLInputElement).value),"En cours de saisie");
   assert.deepEqual(errors,[]);
   await page.close();
  }
 }finally{
  if(browser)await browser.close();
  await new Promise<void>((done,fail)=>server.close(error=>error?fail(error):done()));
 }
});
