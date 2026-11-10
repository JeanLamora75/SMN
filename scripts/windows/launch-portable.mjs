// Lanceur Windows propriétaire du processus web : aucun service système.
// Le remplacement applicatif est exécuté hors du serveur arrêté.
import {spawn} from "node:child_process";
import {existsSync,lstatSync,mkdirSync} from "node:fs";
import {readFile,writeFile,rename,rm} from "node:fs/promises";
import {randomUUID} from "node:crypto";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {ensureOfficeDirectories} from "./scripts/office-dirs.mjs";
import {recoverCutover} from "./scripts/windows/update-transaction.mjs";
if(process.platform!=="win32")throw Error("Windows x64 requis");
const root=path.dirname(fileURLToPath(import.meta.url));
const server=path.join(root,"app","server.js");
const updates=path.join(root,"updates");
// Never launch an uncertain application after an interrupted file exchange.
// An unresolved or malformed journal raises and blocks startup.
const recovery=await recoverCutover(root);
if(recovery==="recovered")console.log("Mise à jour interrompue : ancienne application restaurée.");
ensureOfficeDirectories(root);
if(existsSync(updates)){
 const info=lstatSync(updates);
 if(!info.isDirectory()||info.isSymbolicLink())throw Error("Dossier de mises à jour invalide");
}else mkdirSync(updates);
const url="http://127.0.0.1:3003", pending=path.join(updates,"pending.json");
if(!existsSync(server))throw Error("SMN incomplet : app/server.js absent");
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function listening(){
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(1500)});
  const html=await response.text();
  return response.status===200&&html.includes("Scrum Master Notebook");
 }catch{return false;}
}
function browser(){
 if(process.env.GITHUB_ACTIONS==="true"&&process.env.SMN_HEADLESS_LAUNCH_TEST==="1"){
  console.log("PASS : ouverture du navigateur simulée par la recette Windows : "+url);
  return;
 }
 const p=spawn("cmd.exe",["/c","start",'""',url],{
  windowsHide:true,detached:true,stdio:"ignore",shell:false});
 p.on("error",()=>console.error("Ouvrez "+url+" dans votre navigateur."));
 p.unref();
}
async function heartbeat(){
 const file=path.join(updates,"launcher.json");
 const tmp=path.join(updates,"launcher-"+randomUUID()+".tmp");
 await writeFile(tmp,JSON.stringify({pid:process.pid,at:new Date().toISOString()})+"\n",{flag:"wx"});
 await rename(tmp,file);
}
async function executeUpdate(){
 const child=spawn(process.execPath,[path.join(root,"scripts","windows","update-apply.mjs")],{
  cwd:root,stdio:"inherit",windowsHide:false,shell:false});
 return new Promise(resolve=>{
  child.on("error",()=>resolve(1));
  child.on("exit",code=>resolve(code??1));
 });
}
let shuttingDown=false,webChild=null;
process.on("SIGINT",()=>{shuttingDown=true;webChild?.kill("SIGTERM");});
process.on("SIGTERM",()=>{shuttingDown=true;webChild?.kill("SIGTERM");});
const alreadyRunning=await listening();
if(alreadyRunning){
 // This launch did not start the other server, so it cannot own or stop it.
 browser();
 console.log("SMN déjà actif. Les mises à jour exigent le lanceur propriétaire du serveur.");
}else{
 let opened=false;
 while(!shuttingDown){
  const child=spawn(process.execPath,[server],{
   cwd:root,env:{...process.env,PORT:"3003",HOSTNAME:"127.0.0.1",NODE_ENV:"production"},
   stdio:"inherit",windowsHide:false,shell:false});
  webChild=child;
  let crashed=false;
  child.on("error",()=>{crashed=true;console.error("Impossible de démarrer SMN.");});
  let ready=false;
  for(let attempt=0;attempt<120&&!shuttingDown;attempt++){
   if(child.exitCode!==null||crashed)break;
   if(await listening()){ready=true;break;}
   await sleep(500);
  }
  if(!ready){
   console.error("SMN indisponible sur le port 3003.");
   child.kill();
   process.exitCode=1;
   break;
  }
  if(!opened){browser();opened=true;}
  console.log("SMN prêt sur "+url+" — données PostgreSQL préservées.");
  let applying=false,polling=false;
  await heartbeat().catch(()=>{});
  const interval=setInterval(async()=>{
   if(polling||shuttingDown||applying)return;
   polling=true;
   try{
    await heartbeat();
    if(existsSync(pending)){
     const record=JSON.parse(await readFile(pending,"utf8"));
     if(typeof record.id==="string" &&
       /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(record.id)){
      applying=true;
      console.log("Mise à jour confirmée : arrêt du serveur web uniquement.");
      child.kill("SIGTERM");
     }
    }
   }catch{console.error("Contrôle de mise à jour indisponible.");}
   finally{polling=false;}
  },1500);
  if(child.exitCode===null)await new Promise(resolve=>child.once("exit",resolve));
  clearInterval(interval);webChild=null;
  if(shuttingDown)break;
  if(!applying){
   console.error("Le serveur SMN s'est arrêté de manière inattendue.");
   process.exitCode=1;
   break;
  }
  const code=await executeUpdate();
  if(code!==0)console.error("La mise à jour a échoué. Démarrage de l'application précédente.");
  else console.log("Mise à jour vérifiée et activée. Redémarrage de SMN.");
  // No automatic database migration or PostgreSQL termination occurs here.
 }
}
if(!alreadyRunning)await rm(path.join(updates,"launcher.json"),{force:true}).catch(()=>{});
