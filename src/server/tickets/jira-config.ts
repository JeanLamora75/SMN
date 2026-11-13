import "server-only";
import {randomUUID} from "node:crypto";
import {mkdir,lstat,open,readFile,realpath,rename,rm} from "node:fs/promises";
import path from "node:path";
import {normalizeJiraBaseUrl} from "@/lib/tickets/jira-links";

export type JiraConfig={baseUrl:string|null;revision:number;updatedAt:string|null};
export class JiraConfigError extends Error{
 constructor(public readonly code:"invalid-input"|"conflict"|"unsafe-path"|"invalid-config"|"unavailable"){
  super(code);this.name="JiraConfigError";
 }
}
function root():string{
 const override=process.env.SMN_TICKETS_DIR?.trim();
 const value=override||path.join(process.cwd(),"data","tickets");
 if(!path.isAbsolute(value))throw new JiraConfigError("unsafe-path");
 return path.resolve(value);
}
async function safeDir(directory:string):Promise<void>{
 const absolute=path.resolve(directory);
 const parsed=path.parse(absolute);
 let current=parsed.root;
 for(const component of absolute.slice(parsed.root.length).split(path.sep)){
  if(!component)continue;
  current=path.join(current,component);
  try{
   const state=await lstat(current);
   if(!state.isDirectory()||state.isSymbolicLink())throw new JiraConfigError("unsafe-path");
  }catch(e){
   if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e;
   await mkdir(current).catch(async err=>{
    if((err as NodeJS.ErrnoException).code!=="EEXIST")throw err;
    const state=await lstat(current);
    if(!state.isDirectory()||state.isSymbolicLink())throw new JiraConfigError("unsafe-path");
   });
  }
 }
 if(await realpath(absolute)!==absolute)throw new JiraConfigError("unsafe-path");
}
const initial:JiraConfig={baseUrl:null,revision:0,updatedAt:null};
async function readUnder(rootPath:string):Promise<JiraConfig>{
 try{
  const file=path.join(rootPath,"jira-config.json");
  const stat=await lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||stat.size>16384)
   throw new JiraConfigError("invalid-config");
  const raw=JSON.parse(await readFile(file,"utf8")) as JiraConfig;
  if(!raw||typeof raw!=="object"||!Number.isSafeInteger(raw.revision)||
   raw.revision<0||!(raw.baseUrl===null||
    typeof raw.baseUrl==="string"&&normalizeJiraBaseUrl(raw.baseUrl)===raw.baseUrl)||
   !(raw.updatedAt===null||typeof raw.updatedAt==="string"))
   throw new JiraConfigError("invalid-config");
  return {baseUrl:raw.baseUrl,revision:raw.revision,updatedAt:raw.updatedAt};
 }catch(e){
  if((e as NodeJS.ErrnoException).code==="ENOENT")return initial;
  throw e;
 }
}
export async function readJiraConfig():Promise<JiraConfig>{
 const dir=root();await safeDir(dir);return readUnder(dir);
}
export async function writeJiraConfig(input:unknown):Promise<{settings:JiraConfig;changed:boolean}>{
 if(!input||typeof input!=="object"||Array.isArray(input))throw new JiraConfigError("invalid-input");
 const data=input as Record<string,unknown>;
 if(Object.keys(data).some(x=>!["baseUrl","revision"].includes(x))||
  !Number.isSafeInteger(data.revision)||(data.revision as number)<0||
  !(data.baseUrl===null||typeof data.baseUrl==="string"))
  throw new JiraConfigError("invalid-input");
 const url=data.baseUrl===null||data.baseUrl===""?null:normalizeJiraBaseUrl(data.baseUrl as string);
 if(data.baseUrl!==null&&data.baseUrl!==""&&!url)throw new JiraConfigError("invalid-input");
 const dir=root();await safeDir(dir);
 const lockPath=path.join(dir,".jira-config.lock");
 let lock:Awaited<ReturnType<typeof open>>;
 try{lock=await open(lockPath,"wx",0o600);}
 catch(e){
  if((e as NodeJS.ErrnoException).code==="EEXIST")throw new JiraConfigError("conflict");
  throw e;
 }
 try{
  const previous=await readUnder(dir);
  if(previous.revision!==data.revision)throw new JiraConfigError("conflict");
  if(previous.baseUrl===url)return {settings:previous,changed:false};
  const next:JiraConfig={baseUrl:url,revision:previous.revision+1,updatedAt:new Date().toISOString()};
  const staging=path.join(dir,".jira-config-"+randomUUID()+".tmp");
  try{
   const file=await open(staging,"wx",0o600);
   try{await file.writeFile(JSON.stringify(next,null,2));await file.sync();}
   finally{await file.close();}
   await rename(staging,path.join(dir,"jira-config.json"));
  }finally{await rm(staging,{force:true}).catch(()=>{});}
  return {settings:next,changed:true};
 }finally{
  await lock.close().catch(()=>{});
  await rm(lockPath,{force:true}).catch(()=>{});
 }
}
