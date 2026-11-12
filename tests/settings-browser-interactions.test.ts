import assert from "node:assert/strict";
import test from "node:test";
import {createRequire} from "node:module";
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
 const browser=await puppeteer.launch({executablePath:detected.path,headless:true,
  args:["--no-sandbox","--disable-dev-shm-usage","--no-first-run","--no-default-browser-check"]});
 try{
  const page=await browser.newPage();
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  const script=await bundle();
  await page.goto("about:blank");
  await page.setContent("<!doctype html><html lang='fr'><head><meta charset='utf-8'></head><body><div id='root'></div></body></html>");
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
 }finally{await browser.close();}
});
