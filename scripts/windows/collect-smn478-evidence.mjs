/** Collects actual CI command output; never manufactures a passing proof. */
import {createHash} from "node:crypto";
import {createWriteStream} from "node:fs";
import {lstat,mkdir,readFile,writeFile} from "node:fs/promises";
import {spawn} from "node:child_process";
import {resolve,join,relative,isAbsolute} from "node:path";
import {pathToFileURL} from "node:url";
import {smn478RequiredChecks,verifySmn478Qualification} from "./smn-478-qualification-gate.mjs";

const SHA=/^[a-f0-9]{40}$/;
const RUN=/^[1-9][0-9]*$/;
const EXECUTABLE=/^[^\r\n]+$/;
export function qualificationContext(env=process.env){
 const commit=env.GITHUB_SHA,run=env.GITHUB_RUN_ID;
 if(!SHA.test(commit??"")||!RUN.test(run??"")||env.SMN478_DISPOSABLE!=="YES"||
   env.GITHUB_ACTIONS!=="true")throw Error("smn478-collector-requires-disposable-ci");
 return {commit,run};
}
function folder(env=process.env){
 const dir=env.SMN478_EVIDENCE_DIR;
 if(typeof dir!=="string"||!dir.trim())throw Error("smn478-collector-dir-required");
 return resolve(dir);
}
async function safeFile(file,root){
 if(relative(root,file).startsWith("..")||isAbsolute(relative(root,file)))
  throw Error("smn478-collector-path-outside-root");
 const info=await lstat(file);
 if(!info.isFile()||info.isSymbolicLink()||info.size<=0||info.size>5*1024*1024)
  throw Error("smn478-collector-file-invalid");
 return info;
}
const hash=bytes=>createHash("sha256").update(bytes).digest("hex");

/** Runs a real command, persisting the exit status and its own stdout/stderr. */
export async function captureCheck(name,command,args=[],env=process.env){
 const {commit,run}=qualificationContext(env);
 if(!smn478RequiredChecks.includes(name)||typeof command!=="string"||
    !EXECUTABLE.test(command)||!Array.isArray(args)||args.some(a=>typeof a!=="string"||a.includes("\n")))
  throw Error("smn478-collector-command-invalid");
 const root=folder(env);
 await mkdir(root,{recursive:true});
 const output=join(root,name+".log"),status=join(root,name+".json");
 // No stale or duplicate success record may survive a retry.
 let stream;
 try{await lstat(status);throw Error("smn478-collector-duplicate");}
 catch(e){if(e?.code!=="ENOENT")throw e;}
 stream=createWriteStream(output,{flags:"wx",mode:0o600});
 const argv=[command,...args].join(" ");
 stream.write("SMN478 check="+name+" commit="+commit+" run="+run+"\n");
 stream.write("CI disposable=true command="+argv+"\n");
 let code=1,reason="";
 try{
  const child=spawn(command,args,{env,stdio:["ignore","pipe","pipe"],shell:false,windowsHide:true});
  child.stdout?.on("data",chunk=>{stream.write(chunk);process.stdout.write(chunk);});
  child.stderr?.on("data",chunk=>{stream.write(chunk);process.stderr.write(chunk);});
  code=await new Promise((ok,reject)=>{
   child.on("error",reject);
   child.on("close",(exit,signal)=>ok(signal?1:exit??1));
  });
 }catch(error){reason=String(error?.message??error).slice(0,240);code=1;}
 stream.write("\nSMN478 exit="+code+(reason?" error="+reason:"")+"\n");
 await new Promise((ok,reject)=>stream.end(err=>err?reject(err):ok()));
 const bytes=await readFile(output);
 const evidence={name,gitCommit:commit,runId:run,environment:"disposable",
  result:code===0?"passed":"failed",exitCode:code,logPath:output,
  sha256:hash(bytes),runCommand:argv,recordedAt:new Date().toISOString()};
 await writeFile(status,JSON.stringify(evidence)+"\n",{flag:"wx",mode:0o600});
 if(code!==0)throw Error("smn478-collector-check-failed:"+name);
 return evidence;
}

/** The release receipt is produced only if every independently run check passed. */
export async function finalizeReceipt(env=process.env){
 const {commit,run}=qualificationContext(env),root=folder(env),checks=[];
 for(const name of smn478RequiredChecks){
  const status=join(root,name+".json");
  await safeFile(status,root);
  const data=JSON.parse(await readFile(status,"utf8"));
  if(data.name!==name||data.gitCommit!==commit||data.runId!==run||
    data.environment!=="disposable"||data.result!=="passed"||data.exitCode!==0||
    typeof data.runCommand!=="string"||!data.runCommand.trim()||
    typeof data.recordedAt!=="string"||!Number.isFinite(Date.parse(data.recordedAt))||
    data.logPath!==join(root,name+".log"))
    throw Error("smn478-collector-check-rejected:"+name);
  await safeFile(data.logPath,root);
  if(hash(await readFile(data.logPath))!==data.sha256)
   throw Error("smn478-collector-log-mismatch:"+name);
  checks.push({name,result:"passed",logPath:name+".log",sha256:data.sha256,
   disposable:true,runCommand:data.runCommand});
 }
 const receipt={version:1,gitCommit:commit,environment:"disposable",
  recordedAt:new Date().toISOString(),checks};
 const receiptPath=join(root,"smn478-qualification-receipt.json");
 await writeFile(receiptPath,JSON.stringify(receipt,null,2)+"\n",{flag:"wx",mode:0o600});
 await verifySmn478Qualification(receiptPath,commit);
 return receiptPath;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [operation,name,separator,...argv]=process.argv.slice(2);
 try{
  if(operation==="run"&&separator==="--"&&argv.length)
   await captureCheck(name,argv[0],argv.slice(1));
  else if(operation==="finalize"&&!name){
   const receiptPath=await finalizeReceipt();
   console.log("SMN478_QUALIFICATION_RECEIPT="+receiptPath);
  }else throw Error("smn478-collector-usage");
 }catch(error){console.error(String(error?.message??error));process.exitCode=1;}
}
