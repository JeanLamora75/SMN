import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {spawn,type ChildProcess} from "node:child_process";
import {createServer} from "node:net";
import test from "node:test";
import {Client} from "pg";
import puppeteer from "puppeteer-core";
import {installExpress} from "../src/server/installation/install";
import {detectChrome} from "../scripts/report-chrome.mjs";

const source=process.env.SMN_TEST_DATABASE_URL;
const authorized=process.env.CI==="true"&&process.env.GITHUB_ACTIONS==="true"&&
 /^postgresql:\/\/smn_ci:[^@]+@127\.0\.0\.1:5432\/smn_ci$/.test(source??"");
const database="smn_ci_e2e_"+randomUUID().replace(/-/g,"").slice(0,12);
const port=3117;
const origin="http://127.0.0.1:"+port;
const firstPassword="Temporary-Test-Admin-2026";
const password="Updated-Test-Admin-2026";
const pause=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
async function db<T>(uri:string,fn:(client:Client)=>Promise<T>):Promise<T>{
 const client=new Client({connectionString:uri,connectionTimeoutMillis:3500});
 try{await client.connect();return await fn(client);}finally{await client.end().catch(()=>undefined);}
}
async function waitServer(child:ChildProcess){
 for(let n=0;n<120;n++){
  if(child.exitCode!==null)throw Error("SMN stopped before readiness: "+child.exitCode);
  try{const response=await fetch(origin+"/api/diagnostic",{signal:AbortSignal.timeout(1300)});
   if(response.status===200)return;
  }catch{}
  await pause(500);
 }
 throw Error("SMN did not become ready");
}
async function portFree(){
 return new Promise<boolean>(resolve=>{
  const server=createServer();
  server.once("error",()=>resolve(false));
  server.listen(port,"127.0.0.1",()=>server.close(()=>resolve(true)));
 });
}

test("SMN v33 réel : Chromium → connexion admin → API Next.js → PostgreSQL → Paramètres",
 {skip:!authorized,timeout:180000},async()=>{
 assert.ok(source);
 assert.equal(await portFree(),true,"Port de recette déjà occupé");
 const target=new URL(source);target.pathname="/"+database;
 const maintenance=new URL(source);maintenance.pathname="/postgres";
 let created=false,child:ChildProcess|undefined,browser:Awaited<ReturnType<typeof puppeteer.launch>>|undefined;
 const logs:string[]=[];
 try{
  await db(maintenance.toString(),async client=>{await client.query('CREATE DATABASE "'+database+'"');});
  created=true;
  assert.deepEqual(await installExpress({adminUsername:"e2eadmin",adminEmail:"e2e@example.test",
   password:firstPassword},target.toString()),{ok:true});
  await db(target.toString(),async client=>{
   await client.query("INSERT INTO public.smn_product(id,installation_id,name) VALUES('e2eproduct','singleton','Produit navigateur')");
   await client.query("INSERT INTO public.smn_team(id,installation_id,product_id,name,agile_mode) VALUES('e2eteam','singleton','e2eproduct','Équipe navigateur','scrum')");
  });
  child=spawn(process.execPath,["scripts/serve.mjs","start"],{
   env:{...process.env,SMN_DATABASE_URL:target.toString(),SMN_PORT:String(port),NEXT_TELEMETRY_DISABLED:"1"},
   stdio:["ignore","pipe","pipe"],shell:false
  });
  child.stdout?.on("data",b=>{logs.push(String(b).slice(0,300));if(logs.length>100)logs.shift();});
  child.stderr?.on("data",b=>{logs.push(String(b).slice(0,300));if(logs.length>100)logs.shift();});
  await waitServer(child);
  assert.equal((await fetch(origin+"/api/admin/settings")).status,403,"Anonymous settings access denied");
  const chrome=await detectChrome();assert.equal(chrome.ok,true,"Chromium required");
  browser=await puppeteer.launch({executablePath:chrome.path,headless:true,
   args:["--no-sandbox","--disable-dev-shm-usage","--no-first-run"]});
  const page=await browser.newPage();
  const errors:string[]=[];
  page.on("pageerror",err=>errors.push(err.message));
  await page.goto(origin+"/login");
  const login=await page.evaluate(async({identity,password})=>{
   const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({identity,password})});
   return {status:r.status,body:await r.json()};
  },{identity:"e2eadmin",password:firstPassword});
  assert.equal(login.status,200,JSON.stringify(login.body));
  assert.equal(login.body.mustChangePassword,true);
  const changed=await page.evaluate(async({currentPassword,newPassword})=>{
   const r=await fetch("/api/auth/change-password",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({currentPassword,newPassword})});
   return {status:r.status,body:await r.json()};
  },{currentPassword:firstPassword,newPassword:password});
  assert.equal(changed.status,200,JSON.stringify(changed.body));
  await page.goto(origin+"/app/admin/settings/general",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#country",{timeout:20000});
  assert.equal(await page.$eval("#fixed-product",e=>(e as HTMLInputElement).value),"Produit navigateur");
  await page.select("#country","DE");
  await page.click("form button[type=submit]");
  await page.waitForSelector(".alert-success",{timeout:15000});
  const saved=await db(target.toString(),async client=>(await client.query(
   "SELECT reference_country,revision FROM public.smn_general_settings WHERE installation_id='singleton'")).rows[0]);
  assert.equal(saved.reference_country,"DE");
  assert.equal(saved.revision,2);
  const unauthorized=await fetch(origin+"/api/admin/sprints/templates");
  assert.equal(unauthorized.status,403);
  const ceremonyPage=await page.goto(origin+"/app/admin/settings/ceremonies",{waitUntil:"domcontentloaded"});
  assert.equal(ceremonyPage?.status(),200,"Ceremony settings page must open after native v33 install");
  await page.waitForSelector("#template-name",{timeout:20000});
  assert.deepEqual(errors,[]);
 }catch(error){
  throw new Error(String(error)+"; server diagnostics: "+logs.slice(-12).join(" | ").slice(0,2000));
 }finally{
  await browser?.close().catch(()=>undefined);
  if(child&&child.exitCode===null){
   child.kill("SIGTERM");
   for(let i=0;i<40&&child.exitCode===null;i++)await pause(250);
   if(child.exitCode===null)child.kill("SIGKILL");
  }
  if(created)await db(maintenance.toString(),client=>client.query('DROP DATABASE IF EXISTS "'+database+'" WITH (FORCE)').then(()=>undefined));
 }
});
