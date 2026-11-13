import {createHash} from "node:crypto";
import {lstat,readdir,readFile,mkdir,writeFile} from "node:fs/promises";
import {join,resolve,isAbsolute,relative,sep} from "node:path";
import {validateTicketCsv} from "@/lib/ticket-csv-contract";
import {normalizeJiraBaseUrl} from "@/lib/tickets/jira-links";
import type {TicketSnapshotMetadata} from "@/server/tickets/snapshot-storage";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ID=/^[a-zA-Z0-9_-]{1,100}$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const SHA=/^[0-9a-f]{64}$/;
const MAX_FILES=5000,MAX_BYTES=100*1024*1024,MAX_FILE=8*1024*1024;
type Entry={path:string;sha256:string;size:number;data:string};
export type TicketTransfer={version:1;entries:Entry[];totalBytes:number};
export type TicketTransferReport={files:number;snapshots:number;bytes:number;sha256:string};
export class TicketTransferError extends Error {
 constructor(public readonly code:string){super(code);this.name="TicketTransferError";}
}
function fail(code:string):never{throw new TicketTransferError(code);}
function hash(bytes:Buffer):string{return createHash("sha256").update(bytes).digest("hex");}
function validPath(name:string):boolean{
 if(name==="jira-config.json")return true;
 const v=name.split("/");
 if(v.length!==7)return false;
 const [team,mode,cycle,date,part,version,file]=v;
 return ID.test(team)&&["scrum","kanban"].includes(mode)&&ID.test(cycle)&&
  DATE.test(date)&&new Date(date+"T00:00:00Z").toISOString().slice(0,10)===date&&
  part==="versions"&&UUID.test(version)&&["metadata.json","snapshot.csv"].includes(file);
}
function pointerPath(name:string):boolean{
 const v=name.split("/");
 return v.length===5&&ID.test(v[0])&&["scrum","kanban"].includes(v[1])&&
  ID.test(v[2])&&DATE.test(v[3])&&v[4]==="current.json";
}
function validateContents(entries:readonly Entry[]):TicketTransferReport{
 if(entries.length>MAX_FILES)fail("tickets-file-limit");
 const seen=new Set<string>();let bytes=0,snapshots=0;
 const map=new Map<string,Buffer>();
 for(const item of entries){
  if(!item||typeof item.path!=="string"||
   !(validPath(item.path)||pointerPath(item.path))||seen.has(item.path)||
   !Number.isSafeInteger(item.size)||item.size<1||item.size>MAX_FILE||
   typeof item.sha256!=="string"||!SHA.test(item.sha256)||
   typeof item.data!=="string"||!/^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(item.data))
   fail("tickets-entry-invalid");
  seen.add(item.path);bytes+=item.size;
  if(bytes>MAX_BYTES)fail("tickets-size-limit");
  const raw=Buffer.from(item.data,"base64");
  if(raw.length!==item.size||hash(raw)!==item.sha256||raw.toString("base64")!==item.data)
   fail("tickets-entry-integrity");
  map.set(item.path,raw);
 }
 if(map.has("jira-config.json")){
  let cfg:unknown;
  try{cfg=JSON.parse(map.get("jira-config.json")!.toString("utf8"));}
  catch{fail("tickets-jira-invalid");}
  const c=cfg as {baseUrl?:unknown;revision?:unknown;updatedAt?:unknown};
  if(!c||typeof c!=="object"||!Number.isSafeInteger(c.revision)||
   (c.revision as number)<0||
   !(c.baseUrl===null||typeof c.baseUrl==="string"&&
    normalizeJiraBaseUrl(c.baseUrl)===c.baseUrl)||
   !(c.updatedAt===null||typeof c.updatedAt==="string"))
   fail("tickets-jira-invalid");
 }
 for(const [name,bytesContent] of map){
  if(!name.endsWith("/current.json"))continue;
  const base=name.slice(0,-"/current.json".length);
  let pointer:unknown;
  try{pointer=JSON.parse(bytesContent.toString("utf8"));}
  catch{fail("tickets-pointer-invalid");}
  const id=(pointer as {snapshotId?:unknown})?.snapshotId;
  if(typeof id!=="string"||!UUID.test(id))fail("tickets-pointer-invalid");
  const csv=map.get(base+"/versions/"+id+"/snapshot.csv");
  const metadata=map.get(base+"/versions/"+id+"/metadata.json");
  if(!csv||!metadata)fail("tickets-incomplete-snapshot");
  let m:TicketSnapshotMetadata;
  try{m=JSON.parse(metadata.toString("utf8")) as TicketSnapshotMetadata;}
  catch{fail("tickets-metadata-invalid");}
  const [team,mode,cycle,date]=base.split("/");
  const parsed=validateTicketCsv(csv.toString("utf8"));
  if(!m||m.snapshotId!==id||m.teamId!==team||m.mode!==mode||
   m.cycleId!==cycle||m.businessDate!==date||!SHA.test(m.sha256)||
   m.sha256!==hash(csv)||m.csvBytes!==csv.length||
   !Number.isSafeInteger(m.rowCount)||m.rowCount!==parsed.rows.length||!parsed.valid)
   fail("tickets-snapshot-inconsistent");
  snapshots++;
 }
 for(const name of map.keys()){
  if(name==="jira-config.json"||name.endsWith("/current.json"))continue;
  const v=name.split("/");
  if(!map.has(v.slice(0,4).join("/")+"/current.json"))
   fail("tickets-orphan-snapshot");
  const pointer=JSON.parse(map.get(v.slice(0,4).join("/")+"/current.json")!.toString("utf8")) as
   {snapshotId:string};
  if(v[5]!==pointer.snapshotId)fail("tickets-orphan-version");
 }
 const digest=createHash("sha256");
 for(const item of [...entries].sort((a,b)=>a.path.localeCompare(b.path,"en"))){
  digest.update(item.path+"|"+item.sha256+"|"+item.size+"\n");
 }
 return {files:entries.length,snapshots,bytes,sha256:digest.digest("hex")};
}
export function inspectTicketTransferBytes(input:Buffer):{bundle:TicketTransfer;report:TicketTransferReport}{
 if(input.length>150*1024*1024||input.length<20)fail("tickets-bundle-size");
 let v:unknown;
 try{v=JSON.parse(input.toString("utf8"));}
 catch{fail("tickets-bundle-invalid");}
 const obj=v as Partial<TicketTransfer>;
 if(!obj||obj.version!==1||!Array.isArray(obj.entries)||
  !Number.isSafeInteger(obj.totalBytes))fail("tickets-bundle-invalid");
 const report=validateContents(obj.entries);
 if(obj.totalBytes!==report.bytes)fail("tickets-bundle-size-mismatch");
 return {bundle:obj as TicketTransfer,report};
}
async function regularFile(file:string):Promise<Buffer>{
 const stat=await lstat(file);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size<1||stat.size>MAX_FILE)
  fail("tickets-source-untrusted");
 const b=await readFile(file);
 if(b.length!==stat.size)fail("tickets-source-changed");
 return b;
}
export function ticketStorageDirectory():string{
 const fromEnv=process.env.SMN_TICKETS_DIR?.trim();
 const root=fromEnv||join(process.cwd(),"data","tickets");
 if(!isAbsolute(root)||resolve(root)!==root)fail("tickets-root-invalid");
 return root;
}
/** Export ONLY active versions and the Jira configuration. Reject orphaned or unsafe data. */
export async function captureTicketTransfer(root=ticketStorageDirectory()):Promise<{bytes:Buffer;report:TicketTransferReport}>{
 const stat=await lstat(root).catch((e:NodeJS.ErrnoException)=>{
  if(e.code==="ENOENT")return null;throw e;
 });
 const entries:Entry[]=[];
 async function descend(directory:string,parts:string[]):Promise<void>{
  const list=await readdir(directory);
  for(const name of list.sort()){
   if(name.startsWith(".")||name===".."||name.includes("\\")||name.includes("/"))
    fail("tickets-source-path");
   const rel=[...parts,name].join("/");
   const file=join(directory,name),st=await lstat(file);
   if(st.isSymbolicLink())fail("tickets-source-link");
   if(st.isDirectory()){
    if(parts.length>=6||!(
     (parts.length===0&&ID.test(name))||
     (parts.length===1&&["scrum","kanban"].includes(name))||
     (parts.length===2&&ID.test(name))||
     (parts.length===3&&DATE.test(name))||
     (parts.length===4&&name==="versions")||
     (parts.length===5&&UUID.test(name))))
     fail("tickets-source-path");
    await descend(file,[...parts,name]);
   }else if(st.isFile()){
    if(!(validPath(rel)||pointerPath(rel)))fail("tickets-source-path");
    const b=await regularFile(file);
    entries.push({path:rel,size:b.length,sha256:hash(b),data:b.toString("base64")});
    if(entries.length>MAX_FILES)fail("tickets-file-limit");
   }else fail("tickets-source-type");
  }
 }
 if(stat){
  if(!stat.isDirectory()||stat.isSymbolicLink())fail("tickets-root-untrusted");
  await descend(root,[]);
 }
 const bundle:TicketTransfer={version:1,entries,totalBytes:entries.reduce((sum,x)=>sum+x.size,0)};
 const bytes=Buffer.from(JSON.stringify(bundle));
 return {bytes,report:inspectTicketTransferBytes(bytes).report};
}
/** Only a fresh, empty isolated folder is allowed; never merge into live folders. */
export async function stageTicketTransfer(input:Buffer,destination:string):Promise<TicketTransferReport>{
 const {bundle,report}=inspectTicketTransferBytes(input);
 const stat=await lstat(destination).catch((e:NodeJS.ErrnoException)=>{
  if(e.code==="ENOENT")return null;throw e;
 });
 if(stat)fail("tickets-stage-not-pristine");
 const parent=resolve(destination,"..");
 const rel=relative(parent,destination);
 if(rel!== "tickets"||!isAbsolute(destination)||resolve(destination)!==destination)
  fail("tickets-stage-invalid");
 await mkdir(destination,{mode:0o700});
 try{
  for(const entry of bundle.entries){
   const path=join(destination,...entry.path.split("/"));
   await mkdir(resolve(path,".."),{recursive:true,mode:0o700});
   await writeFile(path,Buffer.from(entry.data,"base64"),{flag:"wx",mode:0o600});
  }
  return report;
 }catch(error){throw error;}
}

/** Paths of live snapshots to check against the restored PostgreSQL team/cycle catalog. */
export function ticketTransferScopes(bundle:TicketTransfer):
 Array<{teamId:string;mode:"scrum"|"kanban";cycleId:string}>{
 const keys=new Map<string,{teamId:string;mode:"scrum"|"kanban";cycleId:string}>();
 for(const entry of bundle.entries){
  if(!entry.path.endsWith("/current.json"))continue;
  const [teamId,mode,cycleId]=entry.path.split("/");
  if(mode!=="scrum"&&mode!=="kanban")fail("tickets-mode-invalid");
  keys.set(teamId+"|"+mode+"|"+cycleId,{teamId,mode,cycleId});
 }
 return [...keys.values()];
}
