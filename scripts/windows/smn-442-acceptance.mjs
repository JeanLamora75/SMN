/**
 * CI-only live Windows SMN-442 acceptance: two installed database identities,
 * GUI HTTP ZIP transfer, intentional post-cutover failure + rollback, then
 * successful cutover and mandatory new login. Uses a disposable COPY of the
 * Windows distribution. Never touches the CI package that is uploaded.
 */
import assert from "node:assert/strict";
import {spawn,spawnSync} from "node:child_process";
import {randomBytes,randomUUID,createHash,createHmac,createCipheriv} from "node:crypto";
import {existsSync} from "node:fs";
import {cp,mkdtemp,mkdir,readFile,readdir,rename,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {createRequire} from "node:module";
import {pathToFileURL} from "node:url";
import pg from "pg";
import {captureCheck} from "./collect-smn478-evidence.mjs";

const {Client}=pg;
if(process.platform!=="win32"||process.env.GITHUB_ACTIONS!=="true"||
 process.env.SMN442_E2E_DISPOSABLE!=="YES")
 throw Error("SMN-442 acceptance requires isolated Windows CI approval");
const sourcePackage=resolve(process.env.SMN_PACKAGE_DIR??"_package/SMN-Windows");
const sandbox=await mkdtemp(join(tmpdir(),"smn442-gui-e2e-"));
const root=join(sandbox,"SMN"),home=join(sandbox,"local"),roam=join(sandbox,"roam");
const base="http://127.0.0.1:3003";
const sourceSetupPass="SourceInitialCI2026!";
const sourcePass="SourceOnlyCI2026!";
const targetSetupPass="DestinationInitialCI2026!";
const targetPass="DestinationOnlyCI2026!";
const phrase="SyntheticRecoveryPhraseForSMN4422026!";
let launcher=null,admin=null,ownerUri=null;
let launcherDiagnostics=[];
const log=[];
const emit=(s)=>{log.push(s);process.stdout.write("SMN442 acceptance: "+s+"\n");};
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const commonEnv=()=>({
 ...process.env,GITHUB_ACTIONS:"true",SMN442_E2E_DISPOSABLE:"YES",
 NODE_ENV:"production",SMN_DATABASE_URL:"",SMN_HEADLESS_LAUNCH_TEST:"1",
 LOCALAPPDATA:home,APPDATA:roam,HOSTNAME:"127.0.0.1",PORT:"3003"
});
async function waitFor(fn,label,maxMs=180000){
 const until=Date.now()+maxMs;let last=null;
 while(Date.now()<until){
  try{const v=await fn();if(v)return v;}catch(e){last=e;}
  await sleep(750);
 }
 throw Error("Timed out: "+label+" "+String(last??""));
}
async function http(path,options={}){
 return fetch(base+path,{signal:AbortSignal.timeout(120000),...options});
}
async function json(path,options={}){
 const r=await http(path,options);
 const body=await r.json().catch(()=>({}));
 return {r,body};
}
async function api(path,method,body,cookie){
 const opts={method,headers:{Origin:base,Cookie:cookie,
  "Content-Type":"application/json"},body:JSON.stringify(body)};
 return json(path,opts);
}
function runExe(file,args,env=commonEnv(),timeout=30000){
 const r=spawnSync(file,args,{cwd:root,env,encoding:"utf8",timeout,windowsHide:true,
  maxBuffer:20000});
 if(r.error||r.status!==0)
  throw Error("CI subprocess failed: "+file.split(/[\\/]/).at(-1)+" "+
   String(r.error?.message??r.stderr??"").slice(-1400));
 return r.stdout;
}
async function start(env){
 launcher=spawn("cmd.exe",["/d","/c",join(root,"Demarrer SMN.bat")],{
  cwd:root,env,windowsHide:true,stdio:["ignore","pipe","pipe"]});
 let tail="";
 for(const stream of [launcher.stdout,launcher.stderr])
  stream?.on("data",bytes=>{
   tail=(tail+bytes.toString()).slice(-2800);
   for(const code of bytes.toString().match(
    /(?:gui|migration|portable|backup|privacy|restore|cutover|rollback|smn442)-[a-z0-9-]+/g)??[])
    launcherDiagnostics.push(code);
   launcherDiagnostics=launcherDiagnostics.slice(-25);
  });
 await waitFor(async()=>{
  if(launcher.exitCode!==null)
   throw Error("Launcher exited: "+launcher.exitCode+" "+tail);
  const r=await http("/").catch(()=>null);
  if(r?.status===200&&(await r.text()).includes("Scrum Master Notebook"))return true;
  return false;
 },"SMN web launcher "+tail,120000);
}
async function stop(){
 if(!launcher)return;
 const pid=launcher.pid;
 if(pid)spawnSync("taskkill",["/PID",String(pid),"/T","/F"],{
  encoding:"utf8",windowsHide:true,timeout:20000});
 launcher.kill();
 launcher=null;
 await waitFor(async()=>{
  try{await fetch(base,{signal:AbortSignal.timeout(350)});return false;}
  catch{return true;}
 },"web server shutdown",25000);
}
async function login(identity,password){
 const {r,body}=await api("/api/auth/login","POST",{identity,password},"");
 const cookie=(r.headers.get("set-cookie")??"").split(";")[0];
 return {status:r.status,body,cookie};
}
async function finishOnboarding(identity,initialPassword,newPassword){
 const loginResult=await login(identity,initialPassword);
 assert.equal(loginResult.status,200,
  "Initial administrator cannot sign in "+JSON.stringify(loginResult.body));
 assert.equal(loginResult.body.mustChangePassword,true,
  "Newly installed admin must require password rotation");
 const changed=await api("/api/auth/change-password","POST",{
  currentPassword:initialPassword,newPassword
 },loginResult.cookie);
 assert.equal(changed.r.status,200,
  "Administrator password onboarding failed "+JSON.stringify(changed.body));
 emit("Completed mandatory password onboarding for "+identity);
}
async function setup(){
 const {r,body}=await json("/api/bootstrap");
 assert.equal(r.status,200);
 assert.equal(body.status,"idle");
 const cookie=(r.headers.get("set-cookie")??"").split(";")[0];
 assert.match(cookie,/smn-local-setup=[a-f0-9]{64}/);
 const res=await api("/api/bootstrap","POST",{
  dbMode:"portable",mode:"scrum",product:"SMN-442 CI",
  team:"Equipe source SMN442",password:sourceSetupPass,confirmed:true
 },cookie);
 assert.equal(res.r.status,202,"Cannot bootstrap disposable source "+JSON.stringify(res.body));
 await waitFor(async()=>{
  const poll=await json("/api/bootstrap");
  if(poll.body.status==="failed")
   throw Error("Source install refused "+poll.body.error);
  return poll.body.status==="complete";
 },"source installation",540000);
}
async function installPrivacy(){
 const config=join(root,"config");
 const key=await readFile(join(config,".settings-key"));
 assert.equal(key.length,32);
 const ledgerKey=randomBytes(32);
 const coverageStart=new Date(Date.now()-120000).toISOString();
 const headMac="0".repeat(64),statement={
  version:1,coverageStart,count:0,headMac
 };
 const seal=createHmac("sha256",ledgerKey).update([
  "smn-erasure-anchor-v1",1,coverageStart,0,headMac].join("|")).digest("hex");
 await mkdir(join(config,"privacy-ledger"));
 await mkdir(join(config,"privacy-anchor"));
 await writeFile(join(config,"privacy-ledger","erasure-ledger.jsonl"),"");
 await writeFile(join(config,"privacy-anchor","erasure-anchor.json"),
  JSON.stringify({...statement,seal}));
 const nonce=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key,nonce);
 const ciphertext=Buffer.concat([cipher.update(ledgerKey.toString("hex"),"utf8"),cipher.final()]);
 const encrypted=[nonce.toString("hex"),cipher.getAuthTag().toString("hex"),
  ciphertext.toString("hex")].join(":");
 await writeFile(join(config,"privacy-ledger.key.enc"),encrypted);
 ledgerKey.fill(0);key.fill(0);
}
async function collectDisposableBrowserProof(){
 if(process.env.SMN478_CAPTURE_BROWSER!=="YES")return;
 const chrome=[
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
 ].find(existsSync);
 if(!chrome)throw Error("smn478-disposable-browser-executable-unavailable");
 const portable=await ensurePg();
 let cycleId;
 try{
  const uri=new URL(portable.uri);uri.pathname="/smn";
  const db=new Client({connectionString:uri.toString(),connectionTimeoutMillis:5000});
  try{
   await db.connect();
   const team=await db.query("SELECT id FROM public.smn_team ORDER BY id LIMIT 1");
   assert.ok(team.rows[0]?.id,"SMN-478 requires a real disposable Scrum team");
   cycleId=randomUUID();
   await db.query(`INSERT INTO public.smn_sprint(id,team_id,number,name,start_at,end_at,time_zone,status)
    VALUES($1,$2,478,'SMN-478 Browser Acceptance',now()-interval '1 day',
     now()+interval '1 day','Europe/Paris','active')`,[cycleId,team.rows[0].id]);
  }finally{await db.end().catch(()=>{});}
 }finally{await portable.client.end().catch(()=>{});}
 const authenticated=await login("admin",sourcePass);
 assert.equal(authenticated.status,200,"SMN-478 browser login failed");
 assert.match(authenticated.cookie,/^[^=;]+=[^;]+$/);
 await captureCheck("browser","cmd.exe",
  ["/d","/c","npx","tsx","--test","tests/smn-478-brief-browser.e2e.ts"],
  {...process.env,SMN478_BROWSER_URL:base,SMN478_BROWSER_CHROME:chrome,
   SMN478_TEST_COOKIE:authenticated.cookie,SMN478_TEST_CYCLE_ID:cycleId,
   SMN478_TEST_MODE:"scrum"});
}
async function collectDisposablePgProofs(){
 if(process.env.SMN478_CAPTURE_PG!=="YES")return;
 const pg=await ensurePg();
 try{
  const uri=new URL(pg.uri);uri.pathname="/smn";
  const env={...process.env,SMN_DATABASE_URL:uri.toString()};
  const migration=["/d","/c","npx","tsx","--test","tests/smn-478-brief-migrations-pg.test.ts"];
  await captureCheck("postgresEmpty","cmd.exe",
   ["/d","/c","npx","tsx","--test","tests/smn-478-native-fresh-install-pg.test.ts"],env);
  await captureCheck("postgresHistory","cmd.exe",migration,env);
  // A separate repetition makes the historical rollback scenario independently auditable.
  await captureCheck("postgresRollback","cmd.exe",migration,env);
 }finally{await pg.client.end().catch(()=>{});}
}
async function seedSyntheticTeamMembers(){
 const portable=await ensurePg();
 const databaseUrl=new URL(portable.uri);
 databaseUrl.pathname="/smn";
 const client=new Client({connectionString:databaseUrl.toString(),connectionTimeoutMillis:5000});
 try{
  await client.connect();
  const teams=await client.query("SELECT id FROM public.smn_team ORDER BY id LIMIT 1");
  let teamId=teams.rows[0]?.id;
  if(!teamId){
   const productId="smn442-ci-product";
   teamId="smn442-ci-team";
   await client.query("INSERT INTO public.smn_product(id,installation_id,name) VALUES($1,'singleton',$2)",
    [productId,"Produit transfert SMN-442"]);
   await client.query("INSERT INTO public.smn_team(id,installation_id,product_id,name,agile_mode) VALUES($1,'singleton',$2,$3,'scrum')",
    [teamId,productId,"Équipe transfert SMN-442"]);
  }
  await client.query("INSERT INTO public.smn_member_batch(id,installation_id,team_id,requested_count) VALUES($1,'singleton',$2,3)",
   ["smn442-source-batch",teamId]);
  for(const [number,name] of ["Camille Recette","Alex Morgan","Sophie Martin"].entries()){
   await client.query("INSERT INTO public.smn_member(id,installation_id,batch_id,member_number,display_name,is_provisional) VALUES($1,'singleton',$2,$3,$4,false)",
    ["smn442-member-"+(number+1),"smn442-source-batch",number+1,name]);
  }
  const members=await client.query("SELECT display_name FROM public.smn_member ORDER BY member_number");
  assert.deepEqual(members.rows.map(row=>row.display_name),
   ["Camille Recette","Alex Morgan","Sophie Martin"]);
 }finally{
  await client.end().catch(()=>{});
  await portable.client.end().catch(()=>{});
 }
 emit("Synthetic team identities seeded in source before ZIP export");
}

async function seedAiBriefArchive(){
 const portable=await ensurePg();
 const uri=new URL(portable.uri);uri.pathname="/smn";
 const db=new Client({connectionString:uri.toString(),connectionTimeoutMillis:5000});
 try{
  await db.connect();
  const team=await db.query("SELECT id FROM public.smn_team ORDER BY id LIMIT 1");
  const actor=await db.query("SELECT id FROM public.smn_account WHERE role='admin' LIMIT 1");
  assert.ok(team.rows[0]?.id&&actor.rows[0]?.id);
  const templateId=randomUUID(),archiveId=randomUUID(),cycleId=randomUUID();
  const promptText="Résume {{SPRINT_NAME}} et {{TEAM_NAME}} sans inventer de données.";
  const text="BRIEF IA — HISTORIQUE\nModèle conservé : "+templateId+"\nÉquipe : recette\n";
  const sha256=createHash("sha256").update(text,"utf8").digest("hex");
  await db.query(`INSERT INTO public.smn_ai_brief_template
   (id,title,description,prompt_text,revision,created_by)
   VALUES($1,'SMN-478 modèle exporté','Préservation du prompt libre',$2,5,$3)`,
   [templateId,promptText,actor.rows[0].id]);
  await db.query(`INSERT INTO public.smn_ai_brief_archive(
   id,mode,cycle_id,team_id,template_id,template_revision,author_id,
   sha256,byte_length,content,reviewed)
   VALUES($1,'scrum',$2,$3,$4,5,$5,$6,$7,$8,true)`,
   [archiveId,cycleId,team.rows[0].id,templateId,actor.rows[0].id,
    sha256,Buffer.byteLength(text,"utf8"),Buffer.from(text,"utf8")]);
  emit("SMN-478 seeded prompt and immutable archive before ZIP export");
  return {templateId,archiveId,promptText,text,sha256};
 }finally{
  await db.end().catch(()=>{});
  await portable.client.end().catch(()=>{});
 }
}
async function saveSourceBackup(){
 const user=await login("admin",sourcePass);
 assert.equal(user.status,200,"Source login failed "+JSON.stringify(user.body));
 const {r,body}=await api("/api/admin/backups","POST",{recoveryPhrase:phrase},user.cookie);
 assert.equal(r.status,201,"Backup export creation failed "+JSON.stringify(body));
 assert.match(body.id,/^[0-9a-f-]{36}$/);
 const downloaded=await http("/api/admin/backups/migration/export?id="+body.id,{
  headers:{Cookie:user.cookie},signal:AbortSignal.timeout(120000)});
 if(downloaded.status!==200){
  const failure=await downloaded.text().catch(()=>"");
  throw Error("Source export failed "+downloaded.status+" "+failure.slice(0,1000));
 }
 const zip=Buffer.from(await downloaded.arrayBuffer());
 assert.equal(zip.readUInt32LE(0),0x04034b50);
 assert.ok(zip.length>300);
 await writeFile(join(sandbox,"transfer.zip"),zip);
 emit("Source ZIP with signed receipt exported: "+zip.length+" bytes");
 return {zip,id:body.id};
}
async function ensurePg(){
 const cfg=JSON.parse(await readFile(join(root,"config","runtime.json"),"utf8"));
 const key=await readFile(join(root,"config",".settings-key"));
 const [a,b,c]=cfg.encryptedPassword.split(":");
 const {createDecipheriv}=await import("node:crypto");
 const decipher=createDecipheriv("aes-256-gcm",key,Buffer.from(a,"hex"));
 decipher.setAuthTag(Buffer.from(b,"hex"));
 const password=Buffer.concat([decipher.update(Buffer.from(c,"hex")),decipher.final()]).toString("utf8");
 key.fill(0);
 const uri="postgresql://smn_owner:"+encodeURIComponent(password)+"@127.0.0.1:"+cfg.port+"/postgres";
 const ctl=join(root,"data","postgres","pgsql","bin","pg_ctl.exe");
 const args=["-D",join(root,"data","postgres","data")];
 const state=spawnSync(ctl,[...args,"status"],{cwd:root,windowsHide:true,timeout:10000});
 if(state.status!==0)
  runExe(ctl,[...args,"-l",join(root,"data","postgres","postgres.log"),
   "-o","-h 127.0.0.1 -p "+cfg.port,"-w","start"]);
 const client=new Client({connectionString:uri,connectionTimeoutMillis:5000});
 await client.connect();
 const data=await client.query("SELECT current_setting('data_directory') AS d");
 assert.equal(resolve(data.rows[0].d).toLowerCase(),
  resolve(join(root,"data","postgres","data")).toLowerCase());
 return {uri,client,ctl,args};
}
async function switchToDestination(){
 const pgInfo=await ensurePg();
 admin=pgInfo.client;ownerUri=pgInfo.uri;
 const name="smn_ci_source_"+randomBytes(5).toString("hex");
 const n=await admin.query("SELECT count(*)::int n FROM pg_stat_activity WHERE datname='smn'");
 assert.equal(n.rows[0].n,0,"Source connections still active");
 await admin.query('ALTER DATABASE "smn" RENAME TO "'+name+'"');
 await admin.query('CREATE DATABASE "smn" OWNER "smn_owner"');
 const target=new URL(ownerUri);target.pathname="/smn";
 const {pathToFileURL}=await import("node:url");
 const {createRequire}=await import("node:module");
 const fixture=resolve("scripts/windows/smn-442-install-destination.ts");
 const loader=pathToFileURL(createRequire(import.meta.url).resolve("tsx")).href;
 runExe(process.execPath,["--import",loader,fixture],{
  ...commonEnv(),SMN_GUI_E2E_FIXTURE:"YES",
  SMN_GUI_E2E_TEST_URI:target.toString()
 },120000);
 const folders=["privacy-ledger","privacy-anchor","privacy-ledger.key.enc"];
 for(const name of folders)
  await rename(join(root,"config",name),join(root,"config",name+".source-fixture"));
 emit("Second initialized SMN installed, source DB preserved under "+name);
 return {sourceDb:name,pgInfo};
}
async function verifyRejectedInputsLeaveDestinationIntact(zip){
 const user=await login("destination-ci",targetPass);
 assert.equal(user.status,200,"Preflight: destination administrator unavailable");
 const pending=join(root,"updates","migration-pending.json");
 assert.equal(existsSync(pending),false,"Unexpected migration already scheduled");
 const corrupted=Buffer.from(zip);
 corrupted[0]^=0xff;
 const invalid=await json("/api/admin/backups/migration/upload",{
  method:"POST",headers:{Cookie:user.cookie,Origin:base,
   "Content-Type":"application/zip","Content-Length":String(corrupted.length)},
  body:corrupted,signal:AbortSignal.timeout(120000)});
 assert.equal(invalid.r.status,422,"Corrupted ZIP must be refused");
 assert.equal(invalid.body.error,"migration-upload-refused");
 assert.equal(existsSync(pending),false,"Corrupted ZIP scheduled a migration");
 const uploaded=await json("/api/admin/backups/migration/upload",{
  method:"POST",headers:{Cookie:user.cookie,Origin:base,
   "Content-Type":"application/zip","Content-Length":String(zip.length)},
  body:zip,signal:AbortSignal.timeout(120000)});
 assert.equal(uploaded.r.status,201,"Cannot upload disposable valid archive for rejection tests");
 const token=uploaded.body.token;
 const wrong=await api("/api/admin/backups/migration/upload/verify","POST",
  {token,phrase:"IncorrectSyntheticRecoveryPhrase2026!"},user.cookie);
 assert.equal(wrong.r.status,422,"Wrong recovery phrase must be rejected");
 assert.equal(wrong.body.restorationAuthorized,false);
 const notVerified=await api("/api/admin/backups/migration/restore","POST",
  {token,confirm:"REPLACE_CURRENT_SMN_WITH_VERIFIED_BACKUP"},user.cookie);
 assert.equal(notVerified.r.status,409,"Unverified archive must never schedule cutover");
 assert.equal(existsSync(pending),false,"Rejected verification scheduled a migration");
 const verified=await api("/api/admin/backups/migration/upload/verify","POST",
  {token,phrase},user.cookie);
 assert.equal(verified.r.status,200,"Correct phrase must remain usable after rejection");
 const missingConsent=await api("/api/admin/backups/migration/restore","POST",
  {token,confirm:"NOT_AUTHORIZED"},user.cookie);
 assert.equal(missingConsent.r.status,400,"Missing exact operator consent must be rejected");
 assert.equal(existsSync(pending),false,"Missing consent scheduled a migration");
 const survivor=await login("destination-ci",targetPass);
 assert.equal(survivor.status,200,"Rejected operations damaged destination identity");
 emit("Verified malformed ZIP, wrong phrase, unverified restore and consent refusal with intact destination");
}

async function importToDestination(zip){
 const user=await login("destination-ci",targetPass);
 assert.equal(user.status,200,"Destination login failed "+JSON.stringify(user.body));
 const up=await json("/api/admin/backups/migration/upload",{
  method:"POST",headers:{Cookie:user.cookie,Origin:base,
   "Content-Type":"application/zip","Content-Length":String(zip.length)},
  body:zip,signal:AbortSignal.timeout(120000)});
 assert.equal(up.r.status,201,"ZIP upload refused "+JSON.stringify(up.body));
 const token=up.body.token;
 const verify=await api("/api/admin/backups/migration/upload/verify","POST",
  {token,phrase},user.cookie);
 assert.equal(verify.r.status,200,"ZIP verification failed "+JSON.stringify(verify.body));
 assert.equal(verify.body.sourceEvidenceVerified,true,"Signed evidence rejected");
 const readiness=await api("/api/admin/backups/migration/upload/readiness","POST",
  {token},user.cookie);
 assert.equal(readiness.r.status,200,"Destination preflight failed "+JSON.stringify(readiness.body));
 assert.equal(readiness.body.mayStartOfflineRestore,true,
  "Destination blocks restoration "+JSON.stringify(readiness.body.blockers));
 const restore=await api("/api/admin/backups/migration/restore","POST",
  {token,confirm:"REPLACE_CURRENT_SMN_WITH_VERIFIED_BACKUP"},user.cookie);
 assert.equal(restore.r.status,202,"User-confirmed restoration rejected "+JSON.stringify(restore.body));
 emit("GUI queued restoration token "+token);
 return token;
}
async function waitOutcome(token,expected,limit=360000){
 return waitFor(async()=>{
  const file=join(root,"updates","migration-status.json");
  if(!existsSync(file))return false;
  const status=JSON.parse(await readFile(file,"utf8"));
  if(status.token!==token)return false;
  if(status.stage==="incident")throw Error("Migration left unsafe incident fence "+
   launcherDiagnostics.slice(-10).join(","));
  if(expected==="complete"&&["failed","rolled-back"].includes(status.stage))
   throw Error("Successful restore rejected safely at stage "+status.stage+
    " codes "+launcherDiagnostics.slice(-12).join(","));
  if(expected==="failed"&&["failed","rolled-back"].includes(status.stage)){
   const result=await readdir(join(root,"updates"));
   return result.some(n=>n.startsWith("migration-pending.failed-"+token));
  }
  if(expected==="complete"&&status.stage==="complete"){
   const result=await readdir(join(root,"updates"));
   return result.some(n=>n.startsWith("migration-pending.complete-"+token));
  }
  return false;
 },"migrated state "+expected,limit);
}
async function verifyDestinationIdentity(expect){
 // The worker records the durable outcome before the Windows launcher has
 // necessarily restarted its web child. An HTTP connection refused here is
 // expected during this transition, not evidence of a failed rollback.
 await waitFor(async()=>{
  if(launcher?.exitCode!==null&&launcher?.exitCode!==undefined)
   throw Error("Owner launcher exited during restoration");
  const res=await http("/").catch(()=>null);
  return res?.status===200;
 },"SMN web restart after offline migration",120000);
 const src=await login("admin",sourcePass);
 const target=await login("destination-ci",targetPass);
 if(expect==="source"){
  assert.equal(src.status,200,"Restored source cannot reauthenticate");
  assert.notEqual(target.status,200,"Old destination session/identity accepted");
 }else{
  assert.equal(target.status,200,"Destination administrator missing after rollback");
  assert.notEqual(src.status,200,"Source account wrongly active after rollback");
 }
}
try{
 assert.ok(existsSync(join(sourcePackage,"Demarrer SMN.bat")));
 await cp(sourcePackage,root,{recursive:true});
 await mkdir(home,{recursive:true});await mkdir(roam,{recursive:true});
 emit("Clean isolated package copied; all writes confined to "+sandbox);
 await start({...commonEnv(),SMN_BACKUP_DIR:join(sandbox,"source-backups")});
 await setup();
  await finishOnboarding("admin",sourceSetupPass,sourcePass);
 await installPrivacy();
 await collectDisposablePgProofs();
 await seedSyntheticTeamMembers();
 await collectDisposableBrowserProof();
 const briefProof=await seedAiBriefArchive();
 const {zip}=await saveSourceBackup();
 await stop();
 const {pgInfo,sourceDb}=await switchToDestination();
 await admin.end();admin=null;
 await start({...commonEnv(),SMN_GUI_E2E_FAIL_AFTER_PROMOTION:"1"});
  await finishOnboarding("destination-ci",targetSetupPass,targetPass);
 await verifyRejectedInputsLeaveDestinationIntact(zip);
 const first=await importToDestination(zip);
 await waitOutcome(first,"failed");
 await verifyDestinationIdentity("destination");
 emit("Verified injected failure restored old destination data and login");
 await stop();
 await start(commonEnv());
 const next=await importToDestination(zip);
 await waitOutcome(next,"complete");
 await verifyDestinationIdentity("source");
 emit("Verified GUI restore, source account reauthentication and rollback retained");
 await stop();
 const maintenance=await ensurePg();
 const restoredUri=new URL(maintenance.uri);restoredUri.pathname="/smn";
 const restored=new Client({connectionString:restoredUri.toString(),connectionTimeoutMillis:5000});
 try{
  await restored.connect();
  const names=await restored.query("SELECT display_name FROM public.smn_member ORDER BY member_number");
  assert.deepEqual(names.rows.map(row=>row.display_name),
   ["Camille Recette","Alex Morgan","Sophie Martin"],
   "SMN-442 must preserve individual team member identities after cross-PC restoration");
   const models=await restored.query(`
    SELECT id::text,prompt_text,revision FROM public.smn_ai_brief_template WHERE id=$1`,
    [briefProof.templateId]);
   assert.equal(models.rowCount,1,"SMN-478 model missing after ZIP restore");
   assert.equal(models.rows[0].id,briefProof.templateId);
   assert.equal(models.rows[0].prompt_text,briefProof.promptText);
   assert.equal(models.rows[0].revision,5);
   const records=await restored.query(`
    SELECT id::text,template_id,template_revision,sha256,content,byte_length
    FROM public.smn_ai_brief_archive WHERE id=$1`,[briefProof.archiveId]);
   assert.equal(records.rowCount,1,"SMN-478 archive missing after ZIP restore");
   assert.equal(records.rows[0].template_id,briefProof.templateId);
   assert.equal(records.rows[0].template_revision,5);
   assert.equal(records.rows[0].sha256,briefProof.sha256);
   assert.equal(records.rows[0].byte_length,Buffer.byteLength(briefProof.text,"utf8"));
   assert.equal(Buffer.from(records.rows[0].content).toString("utf8"),briefProof.text);
   emit("SMN-478 verified prompt, model revision and archive SHA-256 after real GUI ZIP transfer");

 }finally{await restored.end().catch(()=>{});}
 const back=await maintenance.client.query(
  "SELECT datname FROM pg_database WHERE datname LIKE 'smn_restore_test_back_%'");
 assert.equal(back.rows.length,1,"Old destination database not retained");
 const old=await maintenance.client.query(
  "SELECT datname FROM pg_database WHERE datname=$1",[sourceDb]);
 assert.equal(old.rows.length,1,"Source baseline not preserved");
 await maintenance.client.end();
 emit("PASS: actual ZIP GUI migration plus fault rollback of populated Windows destination");
}finally{
 await stop().catch(()=>{});
 await admin?.end().catch(()=>{});
 const ctl=join(root,"data","postgres","pgsql","bin","pg_ctl.exe");
 if(existsSync(ctl))spawnSync(ctl,["-D",join(root,"data","postgres","data"),
  "-m","fast","-w","stop"],{cwd:root,timeout:15000,windowsHide:true,stdio:"ignore"});
 await rm(sandbox,{recursive:true,force:true,maxRetries:7,retryDelay:500}).catch(()=>{});
}
