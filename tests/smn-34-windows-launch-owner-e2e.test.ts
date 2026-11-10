import assert from "node:assert/strict";
import {test} from "node:test";
import {spawn,type ChildProcess} from "node:child_process";
import {randomUUID} from "node:crypto";
import {mkdtemp,mkdir,copyFile,readFile,writeFile,rm,access} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const cwd=fileURLToPath(new URL("../",import.meta.url));
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(check:()=>Promise<boolean>,ms:number){
 const start=Date.now();
 while(Date.now()-start<ms){if(await check())return true;await sleep(200);}
 return false;
}
async function online(){
 try{
  const r=await fetch("http://127.0.0.1:3003",{
   signal:AbortSignal.timeout(1200)});
  return r.status===200&&(await r.text()).includes("Scrum Master Notebook");
 }catch{return false;}
}
async function exitOf(child:ChildProcess,timeoutMs:number):Promise<number|null>{
 if(child.exitCode!==null)return child.exitCode;
 return Promise.race([
  new Promise<number|null>(resolve=>child.once("exit",code=>resolve(code))),
  sleep(timeoutMs).then(()=>null)
 ]);
}
test("SMN-34 Windows: vrai lanceur portable arrête son serveur propriétaire après verrou",
 {skip:process.platform!=="win32",timeout:80000},async()=>{
 assert.equal(await online(),false,"The CI port 3003 must not be occupied");
 const base=await mkdtemp(join(tmpdir(),"smn34-owner-"));
 const root=join(base,"smn_restore_test_launcher");
 const external=join(base,"smn_restore_test_fence");
 await mkdir(join(root,"runtime","maintenance"),{recursive:true});
 await mkdir(join(root,"app"),{recursive:true});
 await mkdir(join(root,"updates"),{recursive:true});
 await mkdir(external);
 const marker=join(external,"maintenance.lock");
 let launcher:ChildProcess|null=null;
 try{
  await writeFile(join(root,"runtime","maintenance","office-dirs.mjs"),
   "export function ensureOfficeDirectories(){}\n");
  await writeFile(join(root,"runtime","maintenance","update-transaction.mjs"),
   'export async function recoverCutover(){return "clean"}\n');
  await copyFile(join(cwd,"scripts","windows","restore-launch-gate.mjs"),
   join(root,"runtime","maintenance","restore-launch-gate.mjs"));
  const source=await readFile(join(cwd,"scripts","windows","launch-portable.mjs"),"utf8");
  const packaged=source
   .replace('from "./scripts/office-dirs.mjs"','from "./maintenance/office-dirs.mjs"')
   .replace('from "./scripts/windows/update-transaction.mjs"','from "./maintenance/update-transaction.mjs"')
   .replace('from "./scripts/windows/restore-launch-gate.mjs"','from "./maintenance/restore-launch-gate.mjs"')
   .replace('const root=path.dirname(fileURLToPath(import.meta.url));',
    'const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");');
  assert.notEqual(packaged,source);
  assert.doesNotMatch(packaged,/from "\.\/scripts\//);
  await writeFile(join(root,"runtime","launcher.mjs"),packaged);
  await writeFile(join(root,"app","server.js"),`
const http=require("node:http");
const server=http.createServer((_req,res)=>{
 res.writeHead(200,{"Content-Type":"text/html"});
 res.end("<title>Scrum Master Notebook</title>");
});
process.on("SIGTERM",()=>server.close(()=>process.exit(0)));
server.listen(3003,"127.0.0.1");
`);
  launcher=spawn(process.execPath,[join(root,"runtime","launcher.mjs")],{
   cwd:root,windowsHide:true,stdio:"ignore",
   env:{...process.env,
    GITHUB_ACTIONS:"true",SMN_HEADLESS_LAUNCH_TEST:"1",
    SMN_RESTORE_MAINTENANCE_MARKER:marker}
  });
  assert.equal(await waitFor(online,20000),true,"The owner must start the synthetic server");
  await writeFile(marker,JSON.stringify({purpose:"offline-restore",id:randomUUID()}));
  assert.equal(await waitFor(async()=>!(await online()),15000),true,
   "The owner must stop its own web child during maintenance");
  const code=await exitOf(launcher,10000);
  assert.notEqual(code,null,"The launcher must exit without automatically restarting");
  await sleep(1700);
  assert.equal(await online(),false,"The web child must not restart while fenced");
  assert.equal((await readFile(marker,"utf8")).includes("offline-restore"),true,
   "The owner must never remove the external fence");
 }finally{
  if(launcher&&launcher.exitCode===null)launcher.kill();
  await rm(base,{recursive:true,force:true});
 }
});
