import assert from "node:assert/strict";
import test from "node:test";
import {createRequire} from "node:module";
import {createServer} from "node:http";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import puppeteer from "puppeteer-core";
import {detectChrome} from "../scripts/report-chrome.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const require=createRequire(import.meta.url);
const tsxRoot=dirname(require.resolve("tsx/package.json"));
const esbuild=require(createRequire(resolve(tsxRoot,"package.json")).resolve("esbuild"));

async function bundle(){
 const entry=`
 import React,{useState} from "react";
 import {createRoot} from "react-dom/client";
 import SettingsTabs from "./src/app/app/admin/settings/settings-tabs";
 import IanaTimeZoneSelect from "./src/app/app/admin/settings/iana-time-zone-select";
 function Fixture(){
   const [zone,setZone]=useState("Europe/Paris");
   return <main>
    <SettingsTabs label="Paramètres de test" actionsTabId="general"
     actions={<button id="action-general" type="button">Action</button>}
     sections={[
      {id:"general",label:"Général",content:<p id="general-text">Section générale</p>},
      {id:"calendar",label:"Calendrier",content:<p id="calendar-text">Section calendrier</p>},
      {id:"members",label:"Membres",content:<p id="members-text">Section membres</p>}
     ]}/>
    <IanaTimeZoneSelect id="iana" label="Fuseau IANA" value={zone} onChange={setZone}/>
    <output id="selected-zone">{zone}</output>
    <IanaTimeZoneSelect id="iana-disabled" label="Fuseau verrouillé"
      value="UTC" disabled onChange={()=>{throw Error("A disabled control emitted a change");}}/>
    <IanaTimeZoneSelect id="iana-legacy" label="Ancien fuseau"
      value="Etc/SMN-Legacy" onChange={()=>{}}/>
   </main>;
 }
 createRoot(document.getElementById("root")!).render(<Fixture/>);
 `;
 const result=await esbuild.build({stdin:{contents:entry,resolveDir:root,sourcefile:"smn-settings-fixture.tsx",loader:"tsx"},
  bundle:true,platform:"browser",format:"iife",write:false,jsx:"automatic",
  define:{"process.env.NODE_ENV":'"production"'},logLevel:"silent"});
 return result.outputFiles[0].text;
}

test("Paramètres : interactions Chromium réelles (clics, clavier, hash, fuseau IANA)",{timeout:45000},async()=>{
 const detected=await detectChrome();
 assert.equal(detected.ok,true,"Chrome/Chromium doit être disponible sur le runner de test");
 const script=await bundle();
 const server=createServer((_request,response)=>{
  response.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
  response.end("<!doctype html><html lang='fr'><head><meta charset='utf-8'></head><body><div id='root'></div></body></html>");
 });
 await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
 const address=server.address();
 assert.ok(address&&typeof address!=="string");
 let browser:Awaited<ReturnType<typeof puppeteer.launch>>|null=null;
 try{
 browser=await puppeteer.launch({executablePath:detected.path,headless:true,
  args:["--no-sandbox","--disable-dev-shm-usage","--no-first-run","--no-default-browser-check"]});
  const page=await browser.newPage();
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("http://127.0.0.1:"+address.port+"/");
  await page.addScriptTag({content:script});
  await page.waitForSelector("#tab-general[aria-selected=true]");
  assert.equal(await page.$eval("#panel-calendar",el=>(el as HTMLElement).hidden),true);
  assert.equal(await page.$("#action-general")!==null,true);
  await page.click("#tab-calendar");
  assert.equal(await page.$eval("#tab-calendar",el=>el.getAttribute("aria-selected")),"true");
  assert.equal(await page.$eval("#panel-calendar",el=>(el as HTMLElement).hidden),false);
  assert.equal(await page.$eval("#panel-general",el=>(el as HTMLElement).hidden),true);
  assert.equal(await page.evaluate(()=>location.hash),"#calendar");
  assert.equal(await page.$("#action-general"),null);
  await page.focus("#tab-calendar");
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.$eval("#tab-members",el=>el.getAttribute("aria-selected")),"true");
  assert.equal(await page.evaluate(()=>document.activeElement?.id),"tab-members");
  await page.keyboard.press("Home");
  assert.equal(await page.$eval("#tab-general",el=>el.getAttribute("aria-selected")),"true");
  await page.keyboard.press("End");
  assert.equal(await page.$eval("#tab-members",el=>el.getAttribute("aria-selected")),"true");
  await page.evaluate(()=>{location.hash="calendar";});
  await page.waitForFunction(()=>document.getElementById("tab-calendar")?.getAttribute("aria-selected")==="true");
  await page.waitForFunction(()=>document.querySelectorAll("#iana option").length>10);
  assert.equal(await page.$eval("#iana",el=>(el as HTMLSelectElement).value),"Europe/Paris");
  await page.select("#iana","Asia/Tokyo");
  assert.equal(await page.$eval("#selected-zone",el=>el.textContent),"Asia/Tokyo");
  assert.equal(await page.$eval("#iana-disabled",el=>(el as HTMLSelectElement).disabled),true);
  assert.equal(await page.$eval("#iana-legacy",el=>(el as HTMLSelectElement).value),"Etc/SMN-Legacy");
  assert.deepEqual(errors,[],"Aucune erreur JavaScript dans le navigateur");
 }finally{
  if(browser)await browser.close();
  await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
 }
});
