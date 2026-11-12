import assert from "node:assert/strict";
import {test} from "node:test";
import {fork,spawnSync,type ChildProcess} from "node:child_process";
import {once} from "node:events";
import {mkdtemp,mkdir,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {createRequire} from "node:module";

const sourceRoot=fileURLToPath(new URL("../",import.meta.url));
const tsxLoader=pathToFileURL(createRequire(join(sourceRoot,"package.json")).resolve("tsx")).href;
const fixture=fileURLToPath(new URL("./fixtures/smn-34-session-worker.ts",import.meta.url));
const supervisor=fileURLToPath(new URL("../scripts/smn-34-sandbox-maintenance.ts",import.meta.url));

function launch(marker:string,workingDir:string):Promise<{worker:ChildProcess;url:string}>{
 return new Promise((resolve,reject)=>{
  const worker=fork(fixture,[],{
   cwd:workingDir,execArgv:["--import",tsxLoader],
   stdio:["ignore","ignore","pipe","ipc"],
   env:{...process.env,SMN_RESTORE_MAINTENANCE_MARKER:marker}
  });
  let childError="";
  worker.stderr?.on("data",bytes=>{childError=(childError+String(bytes)).slice(-1600);});
  const timeout=setTimeout(()=>{
   worker.kill();
   reject(new Error("sandbox-worker-start-timeout"));
  },15000);
  worker.once("error",error=>{clearTimeout(timeout);reject(error);});
  worker.once("exit",code=>{
   clearTimeout(timeout);
   reject(new Error("sandbox-worker-exited-before-ready:"+code+" "+childError));
  });
  worker.once("message",(message:unknown)=>{
   const ready=message as {ready?:boolean;port?:number};
   if(!ready.ready||!Number.isInteger(ready.port)||!ready.port||
    ready.port<1024||ready.port>65535){
    worker.kill();clearTimeout(timeout);reject(new Error("sandbox-worker-invalid-port"));return;
   }
   clearTimeout(timeout);
   resolve({worker,url:"http://127.0.0.1:"+ready.port});
  });
 });
}
async function stop(worker:ChildProcess){
 if(worker.exitCode!==null||worker.signalCode!==null)return;
 const exited=once(worker,"exit");
 worker.send("shutdown");
 const timeout=setTimeout(()=>worker.kill(),6000);
 try{await exited;}finally{clearTimeout(timeout);}
}
async function probe(url:string,token?:string):Promise<number>{
 const res=await fetch(url+"/session",{
  method:token?"GET":"POST",
  headers:token?{Authorization:"Bearer "+token}:{},
  signal:AbortSignal.timeout(4000)
 });
 return res.status;
}
test("SMN-34: session live -> verrou persisté -> restart -> ancienne session rejetée",
 {timeout:50000},async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn34-worker-"));
 const sandbox=join(root,"smn_restore_test_session_worker");
 await mkdir(sandbox);
 const marker=join(sandbox,"maintenance.lock");
 const workingDir=join(root,"app");
 await mkdir(workingDir);
 const children:ChildProcess[]=[];
 try{
  const first=await launch(marker,workingDir);children.push(first.worker);
  const initial=await fetch(first.url+"/session",{method:"POST",
   signal:AbortSignal.timeout(4000)});
  assert.equal(initial.status,200,"initial synthetic session must be issued before any maintenance marker");
  const {token}=await initial.json() as {token:string};
  assert.match(token,/^[a-f0-9]{64}$/);
  assert.equal(await probe(first.url,token),200,"newly issued token must work before maintenance");
  const begin=spawnSync(process.execPath,["--import",tsxLoader,supervisor,
   "--begin",marker],{cwd:workingDir,encoding:"utf8",timeout:15000});
  assert.equal(begin.status,0,begin.stderr);
  assert.equal(JSON.parse(begin.stdout).serverStoppedProven,false);
  assert.equal(await probe(first.url,token),503,
   "The existing process must deny sessions while maintenance is active");
  await stop(first.worker);
  const second=await launch(marker,workingDir);children.push(second.worker);
  assert.equal(await probe(second.url,token),503,
   "The new process must continue denying access while marker exists");
  await stop(second.worker);
  // Only the test harness removes its own disposable marker, never the CLI.
  await rm(marker);
  await rm(join(workingDir,"updates","restore-maintenance.lock"));
  const recovered=await launch(marker,workingDir);children.push(recovered.worker);
  assert.equal(await probe(recovered.url,token),401,
   "A new process must never accept pre-maintenance memory sessions");
  assert.equal(await probe(recovered.url),200,
   "A new synthetic session may be issued only after the marker is removed");
 }finally{
  for(const worker of children)await stop(worker).catch(()=>worker.kill());
  await rm(root,{recursive:true,force:true});
 }
});
