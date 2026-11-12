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
  child=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(port)],{
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
  assert.equal(saved.revision,1,"La première modification incrémente la révision depuis 0");
  const unauthorized=await fetch(origin+"/api/admin/sprints/templates");
  assert.equal(unauthorized.status,403);
  const ceremonyPage=await page.goto(origin+"/app/admin/settings/ceremonies",{waitUntil:"domcontentloaded"});
  assert.equal(ceremonyPage?.status(),200,"Ceremony settings page must open after native v33 install");
  await page.waitForSelector("#template-name",{timeout:20000});
  const templatesBefore=await page.evaluate(async()=>{
   const response=await fetch("/api/admin/sprints/templates");
   return {status:response.status,data:await response.json()};
  });
  assert.equal(templatesBefore.status,200,JSON.stringify(templatesBefore.data));
  assert.deepEqual(templatesBefore.data.templates,[]);
  await page.type("#template-name","Daily navigateur");
  await page.select("#template-frequency","weekly");
  await page.waitForSelector("#template-day");
  await page.select("#template-day","3");
  await page.click("#template-name");
  await page.click("form button[type=submit]");
  await page.waitForSelector(".alert-success",{timeout:15000});
  const persisted=await db(target.toString(),async client=>(await client.query(
   "SELECT name,frequency,weekday,revision FROM public.smn_scrum_ceremony_template WHERE team_id='e2eteam'")).rows);
  assert.equal(persisted.length,1);
  assert.deepEqual({name:persisted[0].name,frequency:persisted[0].frequency,
   weekday:persisted[0].weekday,revision:persisted[0].revision},
   {name:"Daily navigateur",frequency:"weekly",weekday:3,revision:1});
  // La famille Calendriers exerce les vraies pages et le dialogue de création.
  const portal=await page.goto(origin+"/app/admin/settings",{waitUntil:"domcontentloaded"});
  assert.equal(portal?.status(),200,"Le portail des Paramètres doit lire le mode Scrum v33");
  const calendar=await page.goto(origin+"/app/admin/settings/holidays-closures",{waitUntil:"domcontentloaded"});
  assert.equal(calendar?.status(),200);
  await page.waitForSelector("#country-search",{timeout:20000});
  await page.click("#country-catalog-heading + p").catch(()=>undefined);
  await page.$eval("#country-search",el=>(el as HTMLInputElement).focus());
  await page.type("#country-search","Allemagne");
  await page.waitForFunction(()=>(document.querySelector("#country-search") as HTMLInputElement).value==="Allemagne");
  await page.$eval("#country-search",el=>{(el as HTMLInputElement).value="";el.dispatchEvent(new Event("input",{bubbles:true}));});
  await page.reload({waitUntil:"domcontentloaded"});
  await page.waitForSelector("#country-search",{timeout:20000});
  await page.click("#country-catalog-heading");
  const addCountry=await page.$eval("#country-catalog-heading",el=>el.parentElement?.parentElement?.querySelector("button.btn-primary")?.textContent);
  assert.ok(addCountry);
  await page.evaluate(()=>{const heading=document.getElementById("country-catalog-heading");(heading?.parentElement?.parentElement?.querySelector("button.btn-primary") as HTMLButtonElement)?.click();});
  await page.waitForSelector("#country-edit-code");
  await page.type("#country-edit-code","BE");
  await page.type("#country-edit-name","Belgique navigateur");
  await page.click("dialog form button[type=submit]");
  await page.waitForFunction(()=>document.querySelector("#country-edit-code")===null);
  const countryInDb=await db(target.toString(),async client=>(await client.query(
   "SELECT name FROM public.smn_country WHERE code='BE'")).rows[0]);
  assert.equal(countryInDb?.name,"Belgique navigateur");
  // Calendrier national : ajout manuel avec justification depuis le dialogue réel.
  await page.waitForFunction(()=>Array.from(document.querySelectorAll("table tbody tr"))
   .some(row=>row.textContent?.includes("Belgique navigateur")),{timeout:15000});
  const opened=await page.evaluate(()=>{
   const country=Array.from(document.querySelectorAll("table tbody tr"))
    .find(row=>row.textContent?.includes("Belgique navigateur"));
   const button=country?.querySelector<HTMLButtonElement>("td button");
   if(!button)return false;
   button.click();
   return true;
  });
  assert.equal(opened,true,"La ligne du pays doit être prête avant ouverture du calendrier");
  await page.waitForSelector("#smn-country-modal-year",{timeout:15000});
  await page.select("#smn-country-modal-year","2026");
  await page.waitForSelector('[data-country-year="BE:2026"]',{timeout:15000});
  await page.evaluate(()=>{
   const section=document.querySelector('[data-country-year="BE:2026"]');
   const button=Array.from(section?.querySelectorAll("button")??[])
    .find(x=>x.classList.contains("btn-primary")&&x.textContent?.trim());
   button?.click();
  });
  await page.waitForSelector("#smn-holiday-edit-date",{timeout:15000});
  await page.$eval("#smn-holiday-edit-date",element=>{
   const input=element as HTMLInputElement;
   Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!.call(input,"2026-05-12");
   input.dispatchEvent(new Event("input",{bubbles:true}));
  });
  await page.type("#smn-holiday-edit-name","Journée de recette");
  await page.type("#smn-holiday-edit-reason","Validation réelle du calendrier");
  await page.click(".smn-country-holiday-editor button[type=submit]");
  await page.waitForFunction(()=>!document.querySelector(".smn-country-holiday-editor"),{timeout:15000});
  const holidayInDb=await db(target.toString(),async client=>(await client.query(
   "SELECT name FROM public.smn_national_holiday WHERE country_code='BE' AND holiday_date='2026-05-12'")).rows[0]);
  assert.equal(holidayInDb?.name,"Journée de recette");


  // La famille Utilisateurs teste le véritable formulaire et le registre SQL.
  const users=await page.goto(origin+"/app/admin/users",{waitUntil:"domcontentloaded"});
  assert.equal(users?.status(),200);
  await page.waitForSelector('form input[type="email"]',{timeout:20000});
  await page.type('form input[autocomplete="off"]',"testmember");
  await page.type('form input[type="email"]',"member@example.test");
  await page.type('form input[type="password"]',"Temporary-Member-2026");
  await page.click("form button[type=submit]");
  await page.waitForFunction(()=>document.body.textContent?.includes("testmember")===true);
  const member=await db(target.toString(),async client=>(await client.query(
   "SELECT role,is_active FROM public.smn_account WHERE username='testmember'")).rows[0]);
  assert.equal(member?.role,"user");assert.equal(member?.is_active,true);

  // Les Registres exercent les contrôles réels, sans requête factice au serveur.
  const registries=await page.goto(origin+"/app/admin/settings/registries",{waitUntil:"domcontentloaded"});
  assert.equal(registries?.status(),200);
  await page.waitForSelector("#highlight-criticalRisk:not(:disabled)",{timeout:20000});
  const previousHighlight=await page.$eval("#highlight-criticalRisk",el=>(el as HTMLInputElement).checked);
  await page.click("#highlight-criticalRisk");
  await page.evaluate(()=>{const control=document.getElementById("highlight-criticalRisk");(control?.closest("section")?.querySelector("button") as HTMLButtonElement)?.click();});
  await page.waitForFunction(()=>!!document.querySelector("#panel-categories [role=status].text-success"),{timeout:15000});
  const highlight=await db(target.toString(),async client=>(await client.query(
   "SELECT enabled,revision FROM public.smn_automatic_highlight_settings WHERE category='criticalRisk' AND installation_id='singleton'")).rows[0]);
  assert.equal(highlight?.enabled,!previousHighlight);
  assert.equal(highlight?.revision,1);

  // Deux onglets tentent la même révision : un seul doit être accepté.
  const concurrency=await page.evaluate(async()=>{
   const headers={"Content-Type":"application/json"};
   const body={locale:"fr",theme:"light",palette:"red-purple",revision:1};
   const replies=await Promise.all([
    fetch("/api/admin/settings",{method:"PATCH",headers,body:JSON.stringify({...body,referenceCountry:"PT"})}),
    fetch("/api/admin/settings",{method:"PATCH",headers,body:JSON.stringify({...body,referenceCountry:"ES"})})
   ]);
   return [replies[0].status,replies[1].status];
  });
  assert.deepEqual([...concurrency].sort((a,b)=>a-b),[200,409]);
  const afterRace=await db(target.toString(),async client=>(await client.query(
   "SELECT reference_country,revision FROM public.smn_general_settings WHERE installation_id='singleton'")).rows[0]);
  assert.equal(afterRace.revision,2);
  assert.ok(["PT","ES"].includes(afterRace.reference_country));



  // Concurrence inter-utilisateurs : deux administrateurs, cookies et sessions distincts.
  const secondAdmin=await page.evaluate(async()=>{
   const response=await fetch("/api/admin/accounts",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({username:"secondadmin",email:"second@example.test",
     password:"Secondary-Initial-2026",role:"admin"})
   });
   return response.status;
  });
  assert.equal(secondAdmin,201);
  const independent=await browser.createBrowserContext();
  try{
   const second=await independent.newPage();
   await second.goto(origin+"/login",{waitUntil:"domcontentloaded"});
   assert.equal(await second.evaluate(async()=>{
    const r=await fetch("/api/auth/login",{method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({identity:"secondadmin",password:"Secondary-Initial-2026"})});
    return r.status;
   }),200);
   assert.equal(await second.evaluate(async()=>{
    const r=await fetch("/api/auth/change-password",{method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({currentPassword:"Secondary-Initial-2026",
      newPassword:"Secondary-Updated-2026"})});
    return r.status;
   }),200);
   const revisions=await second.evaluate(async()=>{
    const r=await fetch("/api/admin/settings",{cache:"no-store"});
    return {status:r.status,revision:(await r.json()).settings?.revision};
   });
   assert.deepEqual(revisions,{status:200,revision:2});
   const results=await Promise.all([
    page.evaluate(async()=>{
     const r=await fetch("/api/admin/settings",{method:"PATCH",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({locale:"fr",theme:"light",palette:"red-purple",
       referenceCountry:"FR",revision:2})});
     return r.status;
    }),
    second.evaluate(async()=>{
     const r=await fetch("/api/admin/settings",{method:"PATCH",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({locale:"fr",theme:"light",palette:"red-purple",
       referenceCountry:"IT",revision:2})});
     return r.status;
    })
   ]);
   assert.deepEqual([...results].sort((a,b)=>a-b),[200,409]);
  }finally{await independent.close();}
  const afterTwoAdmins=await db(target.toString(),async client=>(await client.query(
   "SELECT reference_country,revision FROM public.smn_general_settings WHERE installation_id='singleton'")).rows[0]);
  assert.equal(afterTwoAdmins.revision,3);
  assert.ok(["FR","IT"].includes(afterTwoAdmins.reference_country));

  // Coupure du réseau navigateur avant l'envoi : aucune persistance, puis retry.
  await page.goto(origin+"/app/admin/settings/general",{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#country",{timeout:20000});
  await page.select("#country","CA");
  const network=await page.createCDPSession();
  try{
   await network.send("Network.enable");
   await network.send("Network.emulateNetworkConditions",{
    offline:true,latency:0,downloadThroughput:0,uploadThroughput:0
   });
   await page.click("form button[type=submit]");
   await page.waitForSelector("#settings-feedback[role=alert]",{timeout:15000});
   assert.equal(await page.$eval("#country",el=>(el as HTMLSelectElement).value),"CA");
   const unchanged=await db(target.toString(),async client=>(await client.query(
    "SELECT reference_country,revision FROM public.smn_general_settings WHERE installation_id='singleton'")).rows[0]);
   assert.deepEqual(unchanged,afterTwoAdmins);
  }finally{
   await network.send("Network.emulateNetworkConditions",{
    offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1
   });
   await network.detach();
  }
  await page.click("form button[type=submit]");
  await page.waitForSelector(".alert-success",{timeout:15000});
  const afterRetry=await db(target.toString(),async client=>(await client.query(
   "SELECT reference_country,revision FROM public.smn_general_settings WHERE installation_id='singleton'")).rows[0]);
  assert.equal(afterRetry.reference_country,"CA");
  assert.equal(afterRetry.revision,4);

  // Simuler une panne brutale du vrai processus Next, pas seulement son lanceur.
  const previousCookies=await page.cookies();
  assert.ok(previousCookies.length>0);
  await browser.close();browser=undefined;
  if(child&&child.exitCode===null){
   child.kill("SIGKILL");
   for(let i=0;i<40&&child.exitCode===null&&child.signalCode===null;i++)await pause(250);
   assert.equal(child.signalCode,"SIGKILL","Le processus Next doit être arrêté avant reprise");
  }
  child=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(port)],{
   env:{...process.env,SMN_DATABASE_URL:target.toString(),SMN_PORT:String(port),NEXT_TELEMETRY_DISABLED:"1"},
   stdio:["ignore","pipe","pipe"],shell:false
  });
  child.stdout?.on("data",b=>{logs.push(String(b).slice(0,300));if(logs.length>100)logs.shift();});
  child.stderr?.on("data",b=>{logs.push(String(b).slice(0,300));if(logs.length>100)logs.shift();});
  await waitServer(child);
  browser=await puppeteer.launch({executablePath:chrome.path,headless:true,
   args:["--no-sandbox","--disable-dev-shm-usage","--no-first-run"]});
  const afterRestart=await db(target.toString(),async client=>(await client.query(
   "SELECT reference_country,revision FROM public.smn_general_settings WHERE installation_id='singleton'")).rows[0]);
  assert.deepEqual(afterRestart,afterRetry,"L'état validé doit survivre au redémarrage");
  assert.equal((await fetch(origin+"/api/admin/settings")).status,403);
  const resumed=await browser.newPage();
  await resumed.setCookie(...previousCookies);
  await resumed.goto(origin+"/login",{waitUntil:"domcontentloaded"});
  assert.equal(await resumed.evaluate(async()=>
   (await fetch("/api/admin/settings",{cache:"no-store"})).status),403,
   "An old session must be rejected after a new Next process starts");
  assert.equal(await resumed.evaluate(async()=>{
   const response=await fetch("/api/auth/login",{method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({identity:"e2eadmin",password:"Updated-Test-Admin-2026"})});
   return response.status;
  }),200,"Authentication must recover after restart");
  assert.equal(await resumed.evaluate(async()=>
   (await fetch("/api/admin/settings",{cache:"no-store"})).status),200);
  assert.deepEqual(errors,[]);
 }catch(error){
  throw new Error((error instanceof Error?error.stack:String(error))+"; server diagnostics: "+logs.slice(-12).join(" | ").slice(0,2000));
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
