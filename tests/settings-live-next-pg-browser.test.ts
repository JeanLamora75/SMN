import assert from "node:assert/strict";
import {randomUUID} from "node:crypto";
import {spawn,type ChildProcess} from "node:child_process";
import {createServer} from "node:net";
import test from "node:test";
import {Client} from "pg";
import puppeteer,{type Page} from "puppeteer-core";
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
async function callSettingsApi(page:Page,url:string,method:string,body?:unknown){
 return page.evaluate(async options=>{
  const response=await fetch(options.url,{
   method:options.method,headers:{"Content-Type":"application/json"},
   ...(options.body===undefined?{}:{body:JSON.stringify(options.body)})
  });
  let payload:unknown=null;
  try{payload=await response.json();}catch{}
  return {status:response.status,payload};
 },{url,method,body});
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
  // Interface réelle : brouillon, refus de le perdre, puis abandon confirmé.
  const initialCountry=await page.$eval("#country",e=>(e as HTMLSelectElement).value);
  assert.equal(await page.$eval("form button[type=submit]",e=>(e as HTMLButtonElement).disabled),true);
  await page.select("#country","GB");
  await page.waitForFunction(()=>!!document.querySelector('[role=status].alert-warning'));
  page.once("dialog",dialog=>void dialog.dismiss());
  await page.click("#settings-tab-language");
  assert.equal(await page.$eval("#settings-tab-general",e=>e.getAttribute("aria-selected")),"true",
   "Refuser l'abandon doit préserver l'onglet et le brouillon");
  assert.equal(await page.$eval("#country",e=>(e as HTMLSelectElement).value),"GB");
  page.once("dialog",dialog=>void dialog.accept());
  await page.click('form button[type=button]');
  await page.waitForFunction(expected=>(document.querySelector("#country") as HTMLSelectElement).value===expected,{},initialCountry);
  assert.equal(await page.$eval("form button[type=submit]",e=>(e as HTMLButtonElement).disabled),true,
   "Abandonner un brouillon ne doit laisser aucune modification à enregistrer");
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

  // Cérémonies : validation, désactivation logique, conflit et réactivation.
  const templateId=await db(target.toString(),async client=>(await client.query(
   "SELECT id FROM public.smn_scrum_ceremony_template WHERE team_id='e2eteam'")).rows[0].id as string);
  const invalidCeremony=await callSettingsApi(page,"/api/admin/sprints/templates","POST",{
   id:templateId,revision:1,active:false,
   template:{name:"Daily navigateur",frequency:"weekly",weekday:3,position:null,time:"09:00",duration:0}
  });
  assert.equal(invalidCeremony.status,400,"Une durée nulle doit être refusée");
  const ceremonyPayload={
   name:"Daily navigateur modifié",frequency:"weekly",weekday:3,position:null,time:"09:15",duration:25
  };
  const deactivatedCeremony=await callSettingsApi(page,"/api/admin/sprints/templates","POST",{
   id:templateId,revision:1,active:false,template:ceremonyPayload
  });
  assert.equal(deactivatedCeremony.status,200,JSON.stringify(deactivatedCeremony.payload));
  const staleCeremony=await callSettingsApi(page,"/api/admin/sprints/templates","POST",{
   id:templateId,revision:1,active:true,template:ceremonyPayload
  });
  assert.equal(staleCeremony.status,409,"La révision périmée ne doit pas réactiver la cérémonie");
  const reenabledCeremony=await callSettingsApi(page,"/api/admin/sprints/templates","POST",{
   id:templateId,revision:2,active:true,template:ceremonyPayload
  });
  assert.equal(reenabledCeremony.status,200,JSON.stringify(reenabledCeremony.payload));
  const templateAfter=await db(target.toString(),async client=>{
   const value=await client.query(
    "SELECT name,revision,active,duration_minutes FROM public.smn_scrum_ceremony_template WHERE id=$1",[templateId]);
   const history=await client.query(
    "SELECT count(*)::int AS count FROM public.smn_scrum_ceremony_template_history WHERE template_id=$1",[templateId]);
   return {...value.rows[0],historyCount:history.rows[0].count};
  });
  assert.equal(templateAfter.name,"Daily navigateur modifié");
  assert.equal(templateAfter.active,true);
  assert.equal(templateAfter.revision,3);
  assert.equal(templateAfter.duration_minutes,25);
  assert.equal(templateAfter.historyCount,3,"La désactivation et réactivation restent traçables");

  // Parcours de modification depuis le véritable formulaire de cérémonie, et non l'API seule.
  await page.reload({waitUntil:"domcontentloaded"});
  await page.waitForFunction(expected=>Array.from((document.querySelector("#template-existing") as HTMLSelectElement)?.options??[])
   .some(option=>option.value===expected),{},templateId);
  await page.select("#template-existing",templateId);
  assert.equal(await page.$eval("#template-active",el=>(el as HTMLInputElement).checked),true);
  await page.click("#template-active");
  await page.click("form button[type=submit]");
  await page.waitForSelector(".alert-success",{timeout:15000});
  const disabledViaUi=await db(target.toString(),async client=>(await client.query(
   "SELECT active,revision FROM public.smn_scrum_ceremony_template WHERE id=$1",[templateId])).rows[0]);
  assert.equal(disabledViaUi.active,false);
  assert.equal(disabledViaUi.revision,4);
  await page.waitForFunction(expected=>Array.from((document.querySelector("#template-existing") as HTMLSelectElement)?.options??[])
   .some(option=>option.value===expected),{},templateId);
  await page.select("#template-existing",templateId);
  await page.click("#template-active");
  await page.click("form button[type=submit]");
  await page.waitForSelector(".alert-success",{timeout:15000});
  const enabledViaUi=await db(target.toString(),async client=>(await client.query(
   "SELECT active,revision FROM public.smn_scrum_ceremony_template WHERE id=$1",[templateId])).rows[0]);
  assert.equal(enabledViaUi.active,true);
  assert.equal(enabledViaUi.revision,5);

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


  // Permissions réelles : l'utilisateur lit le collectif, mais ne modifie aucun Paramètre.
  const userId=await db(target.toString(),async client=>(await client.query(
   "SELECT id FROM public.smn_account WHERE username='testmember'")).rows[0].id as string);
  const selfId=await db(target.toString(),async client=>(await client.query(
   "SELECT id FROM public.smn_account WHERE username='e2eadmin'")).rows[0].id as string);
  const selfProtection=await callSettingsApi(page,"/api/admin/accounts/"+selfId,"PATCH",{
   role:"user",isActive:true
  });
  assert.equal(selfProtection.status,409,"Un administrateur ne peut se rétrograder lui-même");
  const userContext=await browser.createBrowserContext();
  try{
   const userPage=await userContext.newPage();
   await userPage.goto(origin+"/login",{waitUntil:"domcontentloaded"});
   const userLogin=await callSettingsApi(userPage,"/api/auth/login","POST",{
    identity:"testmember",password:"Temporary-Member-2026"
   });
   assert.equal(userLogin.status,200,JSON.stringify(userLogin.payload));
   const userChange=await callSettingsApi(userPage,"/api/auth/change-password","POST",{
    currentPassword:"Temporary-Member-2026",newPassword:"Updated-Member-2026"
   });
   assert.equal(userChange.status,200,JSON.stringify(userChange.payload));
   // La permission doit également être appliquée lors de la navigation Next.js.
   await userPage.goto(origin+"/app/admin/settings/general",{waitUntil:"domcontentloaded"});
   await userPage.waitForFunction(()=>location.pathname==="/app"||location.pathname==="/login",
    {timeout:15000});
   assert.notEqual(new URL(userPage.url()).pathname,"/app/admin/settings/general",
    "Un utilisateur non administrateur ne doit pas voir le formulaire");
   const collective=await callSettingsApi(userPage,
    "/api/admin/registries/automatic-highlights","GET");
   assert.equal(collective.status,200,"L'utilisateur doit pouvoir consulter le collectif");
   for(const [url,method,body] of [
    ["/api/admin/settings","GET",undefined],
    ["/api/admin/settings","PATCH",{locale:"fr",theme:"light",palette:"ocean",
     referenceCountry:"FR",revision:1}],
    ["/api/admin/accounts","GET",undefined],
    ["/api/admin/countries/BE/lifecycle","GET",undefined],
    ["/api/admin/accounts","POST",{username:"forbidden",email:"forbidden@example.test",
     password:"Blocked-2026",role:"admin"}],
    ["/api/admin/countries/BE","PATCH",{name:"Modification interdite",revision:0}],
    ["/api/admin/countries/BE/holidays","POST",{action:"delete",
     originalDate:"2026-05-12",reason:"Interdit",expectedYears:{"2026":"0".repeat(64)}}],
    ["/api/admin/sprints/templates","POST",{template:{name:"Interdit",frequency:"daily",
     weekday:null,position:null,time:"09:00",duration:15}}],
    ["/api/admin/registries/automatic-highlights","PATCH",{settings:[]}]
   ] as Array<[string,string,unknown]>){
    const denied=await callSettingsApi(userPage,url,method,body);
    assert.equal(denied.status,403,"Interdiction obligatoire: "+method+" "+url);
   }
   const disabled=await callSettingsApi(page,"/api/admin/accounts/"+userId,"PATCH",{
    role:"user",isActive:false
   });
   assert.equal(disabled.status,200,JSON.stringify(disabled.payload));
   const revoked=await callSettingsApi(userPage,
    "/api/admin/registries/automatic-highlights","GET");
   assert.equal(revoked.status,403,"La désactivation doit révoquer immédiatement la session");
   const blockedLogin=await callSettingsApi(userPage,"/api/auth/login","POST",{
    identity:"testmember",password:"Updated-Member-2026"
   });
   assert.notEqual(blockedLogin.status,200,"Un utilisateur désactivé ne doit pas se reconnecter");
  }finally{await userContext.close();}
  const userAfter=await db(target.toString(),async client=>(await client.query(
   "SELECT role,is_active FROM public.smn_account WHERE id=$1",[userId])).rows[0]);
  assert.equal(userAfter.role,"user");
  assert.equal(userAfter.is_active,false);

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

  // Modifications, validation administrative et suppression d'un jour férié réel.
  const countryRoute="/api/admin/countries/BE";
  const nationalValidation=countryRoute+"/calendar/validate?year=2026";
  const originalYear=await callSettingsApi(page,nationalValidation,"GET");
  assert.equal(originalYear.status,200);
  const fingerprint=(originalYear.payload as {diagnostic:{fingerprint:string}}).diagnostic.fingerprint;
  const updateHoliday=await callSettingsApi(page,countryRoute+"/holidays","POST",{
   action:"update",originalDate:"2026-05-12",date:"2026-05-12",
   name:"Journée de recette modifiée",reason:"Correction de libellé vérifiée",
   expectedYears:{"2026":fingerprint}
  });
  assert.equal(updateHoliday.status,200,JSON.stringify(updateHoliday.payload));
  const staleHoliday=await callSettingsApi(page,countryRoute+"/holidays","POST",{
   action:"delete",originalDate:"2026-05-12",
   reason:"Tentative avec ancienne empreinte",expectedYears:{"2026":fingerprint}
  });
  assert.equal(staleHoliday.status,409,"Une empreinte périmée ne doit rien supprimer");
  const changedYear=await callSettingsApi(page,nationalValidation,"GET");
  assert.equal(changedYear.status,200);
  const latest=(changedYear.payload as {diagnostic:{fingerprint:string}}).diagnostic.fingerprint;
  const invalidCertification=await callSettingsApi(page,countryRoute+"/calendar/validate","POST",{
   year:2026,source:"manual-review",confirmComplete:false,fingerprint:latest
  });
  assert.equal(invalidCertification.status,400,"La validation exige une confirmation explicite");
  const certified=await callSettingsApi(page,countryRoute+"/calendar/validate","POST",{
   year:2026,source:"manual-review",confirmComplete:true,fingerprint:latest
  });
  assert.equal(certified.status,200,JSON.stringify(certified.payload));
  const validationDb=await db(target.toString(),async client=>(await client.query(
   "SELECT administrative_validated_at FROM public.smn_national_calendar_coverage WHERE country_code='BE' AND calendar_year=2026")).rows[0]);
  assert.ok(validationDb.administrative_validated_at,"La validation est persistée");
  const validatedYear=await callSettingsApi(page,nationalValidation,"GET");
  assert.equal(validatedYear.status,200);
  const deleteHoliday=await callSettingsApi(page,countryRoute+"/holidays","POST",{
   action:"delete",originalDate:"2026-05-12",
   reason:"Suppression confirmée du jour férié de test",
   expectedYears:{"2026":(validatedYear.payload as {diagnostic:{fingerprint:string}}).diagnostic.fingerprint}
  });
  assert.equal(deleteHoliday.status,200,JSON.stringify(deleteHoliday.payload));
  const removed=await db(target.toString(),async client=>{
   const row=await client.query("SELECT count(*)::int AS count FROM public.smn_national_holiday WHERE country_code='BE'");
   const year=await client.query("SELECT administrative_validated_at FROM public.smn_national_calendar_coverage WHERE country_code='BE' AND calendar_year=2026");
   return {count:row.rows[0].count,validated:year.rows[0].administrative_validated_at};
  });
  assert.equal(removed.count,0);
  assert.equal(removed.validated,null,"La suppression invalide la certification annuelle");
  const emptyYear=await callSettingsApi(page,nationalValidation,"GET");
  assert.equal(emptyYear.status,200);
  const blockedYear=await callSettingsApi(page,countryRoute+"/calendar/validate","POST",{
   year:2026,source:"manual-review",confirmComplete:true,
   fingerprint:(emptyYear.payload as {diagnostic:{fingerprint:string}}).diagnostic.fingerprint
  });
  assert.equal(blockedYear.status,422,"Un calendrier national vide ne peut être certifié");

  // Éditer puis archiver / réactiver un pays sans détruire son historique.
  const renamed=await callSettingsApi(page,countryRoute,"PATCH",{
   name:"Belgique modifiée",revision:0
  });
  assert.equal(renamed.status,200,JSON.stringify(renamed.payload));
  const renameConflict=await callSettingsApi(page,countryRoute,"PATCH",{
   name:"Révision périmée",revision:0
  });
  assert.equal(renameConflict.status,409);
  let referenceImpact=await callSettingsApi(page,"/api/admin/countries/DE/lifecycle","GET");
  if(referenceImpact.status===404){
   const countryFixture=await callSettingsApi(page,"/api/admin/countries","POST",{
    code:"DE",name:"Allemagne"
   });
   assert.equal(countryFixture.status,201,"Le pays de référence doit être matérialisé pour le scénario");
   referenceImpact=await callSettingsApi(page,"/api/admin/countries/DE/lifecycle","GET");
  }
  assert.equal(referenceImpact.status,200,JSON.stringify(referenceImpact.payload));
  const referenceRevision=(referenceImpact.payload as {impact:{country:{revision:number}}}).impact.country.revision;
  const cannotArchiveReference=await callSettingsApi(page,"/api/admin/countries/DE/lifecycle","POST",{
   action:"archive",confirmed:true,revision:referenceRevision
  });
  assert.equal(cannotArchiveReference.status,409,"Le pays de référence ne doit pas être archivé");
  const missingConfirmation=await callSettingsApi(page,countryRoute+"/lifecycle","POST",{
   action:"archive",confirmed:false,revision:1
  });
  assert.equal(missingConfirmation.status,400);
  const archived=await callSettingsApi(page,countryRoute+"/lifecycle","POST",{
   action:"archive",confirmed:true,revision:1
  });
  assert.equal(archived.status,200,JSON.stringify(archived.payload));
  const noEditArchived=await callSettingsApi(page,countryRoute,"PATCH",{
   name:"Interdit pendant archivage",revision:2
  });
  assert.equal(noEditArchived.status,409);
  const reactivated=await callSettingsApi(page,countryRoute+"/lifecycle","POST",{
   action:"reactivate",confirmed:true,revision:2
  });
  assert.equal(reactivated.status,200,JSON.stringify(reactivated.payload));
  const countryAfter=await db(target.toString(),async client=>(await client.query(
   "SELECT name,revision,archived_at FROM public.smn_country WHERE code='BE'")).rows[0]);
  assert.equal(countryAfter.name,"Belgique modifiée");
  assert.equal(countryAfter.revision,3);
  assert.equal(countryAfter.archived_at,null);



  // Catégories d'absence : créer, modifier, valider les entrées et désactiver.
  const invalidAbsence=await callSettingsApi(page,"/api/admin/absence-categories","POST",{
   action:"create",name:"Recette",color:"invalide"
  });
  assert.equal(invalidAbsence.status,400);
  const newAbsence=await callSettingsApi(page,"/api/admin/absence-categories","POST",{
   action:"create",name:"Absence navigateur",color:"#A1B2C3"
  });
  assert.equal(newAbsence.status,201,JSON.stringify(newAbsence.payload));
  const absence=(newAbsence.payload as {category:{id:string;updatedAt:string}}).category;
  const duplicateAbsence=await callSettingsApi(page,"/api/admin/absence-categories","POST",{
   action:"create",name:"absence navigateur",color:"#112233"
  });
  assert.equal(duplicateAbsence.status,409,"Deux catégories ne peuvent avoir le même nom");
  const updatedAbsence=await callSettingsApi(page,"/api/admin/absence-categories","POST",{
   action:"update",id:absence.id,updatedAt:absence.updatedAt,
   name:"Absence navigateur modifiée",color:"#334455",isActive:false
  });
  assert.equal(updatedAbsence.status,200,JSON.stringify(updatedAbsence.payload));
  const staleAbsence=await callSettingsApi(page,"/api/admin/absence-categories","POST",{
   action:"update",id:absence.id,updatedAt:absence.updatedAt,
   name:"Écrasement interdit",color:"#445566",isActive:true
  });
  assert.equal(staleAbsence.status,409,"Une modification avec ancienne date ne doit pas réactiver la catégorie");
  const persistedAbsence=await db(target.toString(),async client=>(await client.query(
   "SELECT name,color,is_active FROM public.smn_absence_category WHERE id=$1",[absence.id])).rows[0]);
  assert.deepEqual(persistedAbsence,{name:"Absence navigateur modifiée",
   color:"#334455",is_active:false});

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


  // La réponse disparaît APRES le COMMIT : le client doit rester conservateur.
  await page.select("#country","DE");
  const responseInterceptor=await page.createCDPSession();
  let responsesDropped=0;
  try{
   await responseInterceptor.send("Fetch.enable",{patterns:[
    {urlPattern:"*api/admin/settings",requestStage:"Response"}
   ]});
   responseInterceptor.on("Fetch.requestPaused",(event:{requestId:string;responseStatusCode?:number})=>{
    if(event.responseStatusCode!==undefined){
     responsesDropped++;
     void responseInterceptor.send("Fetch.failRequest",{
      requestId:event.requestId,errorReason:"ConnectionClosed"
     }).catch(()=>undefined);
    }
   });
   await page.click("form button[type=submit]");
   await page.waitForSelector("#settings-feedback[role=alert]",{timeout:15000});
   assert.equal(responsesDropped,1,"Une seule réponse doit avoir été perdue");
  }finally{
   await responseInterceptor.send("Fetch.disable");
   await responseInterceptor.detach();
  }
  const afterLostResponse=await db(target.toString(),async client=>(await client.query(
   "SELECT reference_country,revision FROM public.smn_general_settings WHERE installation_id='singleton'")).rows[0]);
  assert.equal(afterLostResponse.reference_country,"DE");
  assert.equal(afterLostResponse.revision,5,
   "Le COMMIT serveur peut réussir même quand le navigateur perd sa réponse");
  await Promise.all([
   page.waitForResponse(response=>response.url().endsWith("/api/admin/settings")&&
    response.request().method()==="PATCH"&&response.status()===409,{timeout:15000}),
   page.click("form button[type=submit]")
  ]);
  const afterStaleRetry=await db(target.toString(),async client=>(await client.query(
   "SELECT reference_country,revision FROM public.smn_general_settings WHERE installation_id='singleton'")).rows[0]);
  assert.deepEqual(afterStaleRetry,afterLostResponse,
   "Une nouvelle tentative sur la même révision ne doit jamais réécrire la modification");

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
  assert.deepEqual(afterRestart,afterStaleRetry,"L'état validé doit survivre au redémarrage");
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
