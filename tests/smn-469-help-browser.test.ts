import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from "node:http";
import {createRequire} from "node:module";
import {dirname,join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {readFile,mkdir} from "node:fs/promises";
import puppeteer from "puppeteer-core";
import {detectChrome} from "../scripts/report-chrome.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const require=createRequire(import.meta.url);
const esbuild=require(createRequire(require.resolve("tsx/package.json")).resolve("esbuild"));

async function browserBundle(){
 const entry=String.raw`
 import React,{useState} from "react";
 import {createRoot} from "react-dom/client";
 import {LocaleProvider} from "@/i18n/client";
 import {HelpContextButton} from "@/app/app/help/help-context-button";
 function Fixture(){
  const locale=new URLSearchParams(window.location.search).get("lang")==="en"?"en":"fr";
  const [draft,setDraft]=useState("");
  return <LocaleProvider locale={locale}><main>
   <header><HelpContextButton articleId="tickets" screenTitle="Tickets"/></header>
   <label>Draft<input id="draft" value={draft} onChange={e=>setDraft(e.target.value)}/></label>
  </main></LocaleProvider>;
 }
 createRoot(document.getElementById("root")!).render(<Fixture/>);
 `;
 const built=await esbuild.build({
  stdin:{contents:entry,resolveDir:root,sourcefile:"smn469-browser-fixture.tsx",loader:"tsx"},
  bundle:true,write:false,platform:"browser",format:"iife",jsx:"automatic",
  define:{"process.env.NODE_ENV":'"production"'},
  plugins:[{name:"smn469-alias",setup(build:any){
   build.onResolve({filter:/^@\//},(args:any)=>
    build.resolve(join(root,"src",args.path.slice(2)),{resolveDir:root,kind:args.kind}));
   build.onResolve({filter:/^next\/link$/},()=>({path:"link",namespace:"fixture"}));
   // Resolve React from the repository, not from the virtual fixture namespace.
   build.onResolve({filter:/^react$/,namespace:"fixture"},()=>
    ({path:require.resolve("react")}));
   // The production component imports CSS; browser fixture styles are served separately.
   build.onResolve({filter:/\\.css$/},()=>({path:"help-css",namespace:"fixture-style"}));
   build.onLoad({filter:/.*/,namespace:"fixture-style"},()=>
    ({contents:"",loader:"js"}));
   build.onLoad({filter:/.*/,namespace:"fixture"},()=>({
    contents:'import React from "react";export default function Link({href,children,...props}){return React.createElement("a",{href,...props},children)}',
    loader:"jsx"
   }));
  }}],logLevel:"silent"
 });
 return built.outputFiles.find((file:any)=>file.path.endsWith(".js"))?.text??built.outputFiles[0].text;
}

test("SMN-469 — real Chromium: FR/EN contextual help, read-only network, focus, mobile and dark mode",
 {timeout:90000},async()=>{
 const chrome=await detectChrome();
 assert.equal(chrome.ok,true,"Chromium/Chrome required; no simulated success");
 const js=await browserBundle();
 await mkdir(join(root,"audit-output","help-qa"),{recursive:true});
 const css=(await Promise.all([
  readFile(join(root,"src/app/app/help/help-dialog.css"),"utf8"),
  readFile(join(root,"src/app/modal-cockpit.css"),"utf8")
 ])).join("\n");
 const requests:{path:string;method:string}[]=[];
 const server=createServer((req,res)=>{
  const uri=new URL(req.url??"/","http://localhost");
  if(uri.pathname.startsWith("/api/help/articles/")){
   requests.push({path:uri.pathname,method:req.method??""});
   res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});
   res.end(JSON.stringify({articleId:"tickets",contentLocale:"fr",isFallback:false,
    markdown:"# Tickets\n\nGuide hors ligne.\n\n- Première étape\n- Deuxième étape"}));
   return;
  }
  res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"});
  res.end("<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'><style>"+css+"</style></head><body><div id='root'></div></body></html>");
 });
 await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
 const address=server.address();
 assert.ok(address&&typeof address!=="string");
 let browser:Awaited<ReturnType<typeof puppeteer.launch>>|null=null;
 try{
  browser=await puppeteer.launch({executablePath:chrome.path,headless:true,
   args:["--no-sandbox","--disable-dev-shm-usage","--no-first-run"]});
  for(const locale of ["fr","en"]){
   const page=await browser.newPage();
   const errors:string[]=[];
   page.on("pageerror",error=>errors.push(error.message));
   await page.setViewport({width:locale==="fr"?1280:375,height:800,deviceScaleFactor:2});
   await page.goto("http://127.0.0.1:"+address.port+"/?lang="+locale);
   await page.addScriptTag({content:js});
   await page.waitForSelector("header button");
   await page.type("#draft","Still editing");
   assert.equal(requests.length,locale==="fr"?0:1,"No eager article fetch");
   const opener=await page.$("header button");
   assert.ok(opener);
   await opener.click();
   await page.waitForSelector("dialog[open]");
   await page.waitForFunction(()=>
    document.querySelector("dialog .smn-cockpit-modal-body h1")?.textContent==="Tickets");
   assert.equal(requests.at(-1)?.method,"GET");
   assert.equal(requests.at(-1)?.path,"/api/help/articles/tickets");
   const aria=await page.$eval("dialog",node=>({modal:node.getAttribute("aria-modal"),label:node.getAttribute("aria-labelledby")}));
   assert.equal(aria.modal,"true");
   assert.ok(aria.label);
   assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute("data-initial-focus")),"true");
   await page.keyboard.press("Shift+Tab");
   assert.equal(await page.evaluate(()=>document.activeElement?.closest("dialog")!==null),true,"Focus remains in dialog");
   await page.keyboard.press("Tab");
   assert.equal(await page.evaluate(()=>document.activeElement?.closest("dialog")!==null),true,"Tab remains in dialog");
   await page.screenshot({path:join(root,"audit-output","help-qa",locale+"-dialog.png")});
   await page.keyboard.press("Escape");
   await page.waitForFunction(()=>!document.querySelector("dialog[open]"));
   assert.equal(await page.$eval("#draft",node=>(node as HTMLInputElement).value),"Still editing");
   assert.equal(await page.evaluate(()=>document.activeElement?.tagName),"BUTTON");
   assert.deepEqual(errors,[]);
   if(locale==="en"){
    await page.evaluate(()=>document.documentElement.setAttribute("data-bs-theme","dark"));
    await opener.click();
    await page.waitForSelector("dialog[open]");
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
    assert.equal(overflow,false,"No horizontal overflow on mobile");
    await page.screenshot({path:join(root,"audit-output","help-qa","en-mobile-dark.png")});
    await page.keyboard.press("Escape");
   }
   await page.close();
  }
  assert.ok(requests.length>=2);
  assert.ok(requests.every(item=>item.method==="GET"));
 }finally{
  if(browser)await browser.close();
  await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
 }
});
