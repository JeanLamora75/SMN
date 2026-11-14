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

async function bundle(){
 const entry=String.raw`
 import React from "react";
 import {createRoot} from "react-dom/client";
 import {LocaleProvider} from "@/i18n/client";
 import HelpSetupChecklist from "@/app/app/help/help-setup-checklist";
 const steps=[
  {id:"general",articleId:"general-settings",route:"/app/admin/settings/general"},
  {id:"team",articleId:"teams",route:"/app/admin/settings/teams"},
  {id:"tickets",articleId:"tickets",route:"/app/tickets"}
 ];
 createRoot(document.getElementById("root")!).render(
  <LocaleProvider locale="fr"><HelpSetupChecklist steps={steps}/></LocaleProvider>
 );
 `;
 const result=await esbuild.build({
  stdin:{contents:entry,resolveDir:root,sourcefile:"smn-help-checklist-fixture.tsx",loader:"tsx"},
  bundle:true,write:false,format:"iife",platform:"browser",jsx:"automatic",
  define:{"process.env.NODE_ENV":'"production"'},
  plugins:[{name:"help-test-alias",setup(build:any){
   build.onResolve({filter:/^@\//},(args:any)=>
    build.resolve(join(root,"src",args.path.slice(2)),{resolveDir:root,kind:args.kind}));
   build.onResolve({filter:/^next\/link$/},()=>({path:"link",namespace:"fixture"}));
   build.onLoad({filter:/.*/,namespace:"fixture"},()=>({
    contents:'import React from "react";export default function Link({href,children,...props}){return React.createElement("a",{href,...props},children)}',
    loader:"jsx"
   }));
  }}],logLevel:"silent"
 });
 return result.outputFiles.find((item:any)=>item.path.endsWith(".js"))?.text??result.outputFiles[0].text;
}

test("SMN-465 — Chromium: progression locale, recharge, réversibilité et erreur de stockage",
 {timeout:90000},async()=>{
 const chrome=await detectChrome();
 assert.equal(chrome.ok,true,"Chromium est obligatoire : pas de faux succès");
 const javascript=await bundle();
 const server=createServer((_request,response)=>{
  response.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
  response.end("<!doctype html><html lang='fr'><body><div id='root'></div></body></html>");
 });
 await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
 const address=server.address();
 assert.ok(address&&typeof address!=="string");
 let browser:Awaited<ReturnType<typeof puppeteer.launch>>|null=null;
 try{
  browser=await puppeteer.launch({executablePath:chrome.path,headless:true,
   args:["--no-sandbox","--disable-dev-shm-usage","--no-first-run"]});
  const url="http://127.0.0.1:"+address.port+"/";
  const page=await browser.newPage();
  await page.goto(url);
  await page.addScriptTag({content:javascript});
  await page.waitForSelector(".smn-help-setup-step");
  assert.match(await page.$eval(".smn-help-onboarding",node=>node.textContent??""),/0 étapes déclarées terminées sur 3 applicables/);
  await page.evaluate(()=>{
   const button=[...document.querySelectorAll(".smn-help-setup-step:first-child button")].find(node=>node.textContent?.includes("Marquer terminé"));
   (button as HTMLButtonElement)?.click();
  });
  await page.waitForFunction(()=>document.querySelector(".smn-help-onboarding")?.textContent?.includes("1 étapes déclarées terminées"));
  const saved=await page.evaluate(()=>localStorage.getItem("smn.help.setup.v1"));
  assert.equal(JSON.parse(saved??"{}").steps.general,"done");
  await page.reload();
  await page.addScriptTag({content:javascript});
  await page.waitForFunction(()=>document.querySelector(".smn-help-onboarding")?.textContent?.includes("1 étapes déclarées terminées"));
  await page.evaluate(()=>{
   const button=[...document.querySelectorAll(".smn-help-setup-step:first-child button")].find(node=>node.textContent?.includes("Reprendre"));
   (button as HTMLButtonElement)?.click();
  });
  await page.waitForFunction(()=>document.querySelector(".smn-help-onboarding")?.textContent?.includes("0 étapes déclarées terminées"));
  const persisted=await page.evaluate(()=>localStorage.getItem("smn.help.setup.v1"));
  assert.equal(JSON.parse(persisted??"{}").steps.general,"in_progress");
  await page.evaluate(()=>{
   Object.defineProperty(Storage.prototype,"setItem",{configurable:true,value:()=>{throw new DOMException("Quota exceeded","QuotaExceededError");}});
   const button=[...document.querySelectorAll(".smn-help-setup-step:first-child button")].find(node=>node.textContent?.includes("Marquer terminé"));
   (button as HTMLButtonElement)?.click();
  });
  await page.waitForSelector(".smn-help-onboarding [role=alert]");
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("smn.help.setup.v1")??"{}").steps.general),"in_progress");
  assert.match(await page.$eval(".smn-help-onboarding",node=>node.textContent??""),/0 étapes déclarées terminées/);
  const isolated=await browser.createBrowserContext();
  const other=await isolated.newPage();
  await other.goto(url);
  await other.addScriptTag({content:javascript});
  await other.waitForSelector(".smn-help-setup-step");
  assert.equal(await other.evaluate(()=>localStorage.getItem("smn.help.setup.v1")),null);
  await isolated.close();
 }finally{
  if(browser)await browser.close();
  await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
 }
});
