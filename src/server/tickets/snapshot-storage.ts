import {createHash,randomUUID} from "node:crypto";
import {open,readFile,readdir,realpath,rename,mkdir,lstat,rm} from "node:fs/promises";
import path from "node:path";
import {validateTicketCsv,TICKET_CSV_SCHEMA_VERSION} from "@/lib/ticket-csv-contract";

const ID=/^[a-zA-Z0-9_-]{1,100}$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const GENERATION=/^[a-f0-9-]{36}$/;
const MAX_NAME=180;

export type TicketCycleMode="scrum"|"kanban";
export type TicketScope={teamId:string;cycleId:string;mode:TicketCycleMode};
export type TicketSnapshotMetadata={
 schemaVersion:number;
 snapshotId:string;
 teamId:string;
 cycleId:string;
 mode:TicketCycleMode;
 businessDate:string;
 importedAt:string;
 originalFilename:string;
 importedBy:string;
 rowCount:number;
 csvBytes:number;
 sha256:string;
};
export class TicketStorageError extends Error{
 constructor(public readonly code:string){super(code);this.name="TicketStorageError";}
}
export type TicketStorageOptions={
 directory?:string;
 authorize:(scope:TicketScope,action:"read"|"write"|"delete")=>Promise<void>;
};
type Current={snapshotId:string};
const textEncoder=new TextEncoder();

function checkScope(scope:TicketScope):void{
 if(!scope||!ID.test(scope.teamId)||!ID.test(scope.cycleId)||!["scrum","kanban"].includes(scope.mode))
  throw new TicketStorageError("invalid-scope");
}
function checkDate(date:string):void{
 if(typeof date!=="string"||!DATE.test(date)||
    !Number.isFinite(Date.parse(date+"T00:00:00Z"))||
    new Date(date+"T00:00:00Z").toISOString().slice(0,10)!==date)
  throw new TicketStorageError("invalid-business-date");
}
function baseDirectory(input?:string):string{
 const fromEnv=process.env.SMN_TICKETS_DIR?.trim();
 const directory=input??fromEnv??path.join(process.cwd(),"data","tickets");
 if(!path.isAbsolute(directory))throw new TicketStorageError("invalid-directory");
 return path.resolve(directory);
}
async function secureDirectory(directory:string):Promise<void>{
 const target=path.resolve(directory);
 // Do not follow symbolic links through any pre-existing directory component.
 const parts=target.split(path.sep);
 let current=path.parse(target).root;
 for(const part of parts.slice(current.split(path.sep).filter(Boolean).length)){
  if(!part)continue;
  current=path.join(current,part);
  try{
   const s=await lstat(current);
   if(!s.isDirectory()||s.isSymbolicLink())throw new TicketStorageError("unsafe-path");
  }catch(error){
   if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;
   await mkdir(current).catch(async e=>{
    if((e as NodeJS.ErrnoException).code!=="EEXIST")throw e;
    const s=await lstat(current);
    if(!s.isDirectory()||s.isSymbolicLink())throw new TicketStorageError("unsafe-path");
   });
  }
 }
 const actual=await realpath(target);
 if(actual!==target)throw new TicketStorageError("unsafe-path");
}
function folder(scope:TicketScope,root:string):string{
 return path.join(root,scope.teamId,scope.mode,scope.cycleId);
}
function dateFolder(scope:TicketScope,date:string,root:string):string{
 checkDate(date);
 return path.join(folder(scope,root),date);
}
async function readSafeFile(file:string):Promise<Buffer>{
 const stat=await lstat(file);
 if(!stat.isFile()||stat.isSymbolicLink())throw new TicketStorageError("unsafe-file");
 return readFile(file);
}
async function readCurrent(directory:string):Promise<string|null>{
 try{
  const value=JSON.parse((await readSafeFile(path.join(directory,"current.json"))).toString("utf8")) as Current;
  if(!GENERATION.test(value.snapshotId))throw new TicketStorageError("invalid-pointer");
  return value.snapshotId;
 }catch(e){
  if((e as NodeJS.ErrnoException).code==="ENOENT")return null;
  throw e;
 }
}
async function readMetadata(directory:string,id:string):Promise<TicketSnapshotMetadata>{
 if(!GENERATION.test(id))throw new TicketStorageError("invalid-snapshot");
 const versionDir=path.join(directory,"versions",id);
 await secureDirectory(versionDir);
 const file=path.join(versionDir,"metadata.json");
 const meta=JSON.parse((await readSafeFile(file)).toString("utf8")) as TicketSnapshotMetadata;
 if(meta.snapshotId!==id)throw new TicketStorageError("invalid-metadata");
 return meta;
}
async function lockDate(directory:string,action:()=>Promise<void>):Promise<void>{
 const lock=path.join(directory,".mutation.lock");
 let handle:Awaited<ReturnType<typeof open>>;
 try{handle=await open(lock,"wx",0o600);}
 catch(e){
  if((e as NodeJS.ErrnoException).code==="EEXIST")throw new TicketStorageError("snapshot-busy");
  throw e;
 }
 try{await action();}
 finally{await handle.close().catch(()=>{});await rm(lock,{force:true}).catch(()=>{});}
}
function validMetadata(meta:TicketSnapshotMetadata,scope:TicketScope,date:string):boolean{
 return meta.teamId===scope.teamId&&meta.cycleId===scope.cycleId&&meta.mode===scope.mode&&
 meta.businessDate===date&&/^[a-f0-9]{64}$/.test(meta.sha256)&&
 Number.isSafeInteger(meta.rowCount)&&meta.rowCount>=0&&
 (meta.csvBytes===undefined||(Number.isSafeInteger(meta.csvBytes)&&meta.csvBytes>=0));
}
function validateFilename(filename:string):string{
 if(typeof filename!=="string"||filename.length===0||filename.length>MAX_NAME||
 filename!==filename.trim()||/[\/\\\u0000-\u001f]/.test(filename)||filename==="."||filename==="..")
  throw new TicketStorageError("invalid-filename");
 return filename;
}

export async function saveTicketSnapshot(
 scope:TicketScope,input:{
  businessDate:string;filename:string;csv:string;actorId:string;
  expectedSnapshotId?:string|null;
 },options:TicketStorageOptions,
):Promise<TicketSnapshotMetadata>{
 checkScope(scope);checkDate(input.businessDate);
 const name=validateFilename(input.filename);
 if(!input.actorId||typeof input.actorId!=="string"||input.actorId.length>150)
  throw new TicketStorageError("invalid-actor");
 const parsed=validateTicketCsv(input.csv);
 if(!parsed.valid)throw new TicketStorageError("invalid-csv");
 if(input.expectedSnapshotId!==undefined&&input.expectedSnapshotId!==null&&!GENERATION.test(input.expectedSnapshotId))
  throw new TicketStorageError("invalid-expected-snapshot");
 const root=baseDirectory(options.directory);
 // The server-side caller must verify the actual team/cycle and permissions.
 await options.authorize(scope,"write");
 const dir=dateFolder(scope,input.businessDate,root);
 await secureDirectory(dir);
 let saved:TicketSnapshotMetadata|null=null;
 await lockDate(dir,async()=>{
  await options.authorize(scope,"write");
  const previous=await readCurrent(dir);
  if(previous!==null&&input.expectedSnapshotId!==previous)
   throw new TicketStorageError("confirmation-required");
  if(previous===null&&input.expectedSnapshotId!=null)
   throw new TicketStorageError("stale-confirmation");
  const snapshotId=randomUUID();
  const versionDir=path.join(dir,"versions",snapshotId);
  await secureDirectory(versionDir);
  const csvBuffer=Buffer.from(input.csv,"utf8");
  const meta:TicketSnapshotMetadata={
   schemaVersion:TICKET_CSV_SCHEMA_VERSION,snapshotId,
   teamId:scope.teamId,cycleId:scope.cycleId,mode:scope.mode,
   businessDate:input.businessDate,importedAt:new Date().toISOString(),
   originalFilename:name,importedBy:input.actorId,rowCount:parsed.rows.length,
   csvBytes:csvBuffer.byteLength,
   sha256:createHash("sha256").update(csvBuffer).digest("hex"),
  };
  let published=false;
  try{
   const csvHandle=await open(path.join(versionDir,"snapshot.csv"),"wx",0o600);
   try{await csvHandle.writeFile(csvBuffer);await csvHandle.sync();}
   finally{await csvHandle.close();}
   const metaHandle=await open(path.join(versionDir,"metadata.json"),"wx",0o600);
   try{await metaHandle.writeFile(JSON.stringify(meta,null,2));await metaHandle.sync();}
   finally{await metaHandle.close();}
   const next=path.join(dir,".next-"+snapshotId+".json");
   const pointer=await open(next,"wx",0o600);
   try{await pointer.writeFile(JSON.stringify({snapshotId} satisfies Current));await pointer.sync();}
   finally{await pointer.close();}
   await rename(next,path.join(dir,"current.json"));
   published=true;
   saved=meta;
   // Once the pointer changes, a replaced version is no longer a current file.
   // Cleanup failures are non-fatal and must not roll back a published snapshot.
   if(previous)await rm(path.join(dir,"versions",previous),{recursive:true,force:true}).catch(()=>{});
  }finally{
   if(!published)await rm(versionDir,{recursive:true,force:true}).catch(()=>{});
  }
 });
 if(!saved)throw new TicketStorageError("publication-failed");
 return saved;
}

export async function listTicketSnapshots(scope:TicketScope,options:TicketStorageOptions):Promise<TicketSnapshotMetadata[]>{
 checkScope(scope);await options.authorize(scope,"read");
 const root=baseDirectory(options.directory),parent=folder(scope,root);
 try{await secureDirectory(parent);}
 catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return [];throw e;}
 const names=await readdir(parent),result:TicketSnapshotMetadata[]=[];
 for(const date of names){
  if(!DATE.test(date))continue;
  const dir=dateFolder(scope,date,root);
  try{
   await secureDirectory(dir);
   const id=await readCurrent(dir);
   if(!id)continue;
   const meta=await readMetadata(dir,id);
   if(!validMetadata(meta,scope,date))throw new TicketStorageError("invalid-metadata");
   result.push(meta);
  }catch(e){
   if((e as NodeJS.ErrnoException).code==="ENOENT")continue;
   throw e;
  }
 }
 return result.sort((a,b)=>b.businessDate.localeCompare(a.businessDate));
}

export async function readTicketSnapshot(scope:TicketScope,businessDate:string,options:TicketStorageOptions):
 Promise<{metadata:TicketSnapshotMetadata;csv:string}|null>{
 checkScope(scope);checkDate(businessDate);await options.authorize(scope,"read");
 const root=baseDirectory(options.directory),dir=dateFolder(scope,businessDate,root);
 await secureDirectory(dir);
 const current=await readCurrent(dir);
 if(!current)return null;
 const metadata=await readMetadata(dir,current);
 if(!validMetadata(metadata,scope,businessDate))throw new TicketStorageError("invalid-metadata");
 const csv=(await readSafeFile(path.join(dir,"versions",current,"snapshot.csv"))).toString("utf8");
 if(createHash("sha256").update(textEncoder.encode(csv)).digest("hex")!==metadata.sha256)
  throw new TicketStorageError("integrity-failure");
 return {metadata,csv};
}

export async function deleteTicketSnapshot(
 scope:TicketScope,businessDate:string,expectedSnapshotId:string,
 options:TicketStorageOptions,
):Promise<boolean>{
 checkScope(scope);checkDate(businessDate);
 if(!GENERATION.test(expectedSnapshotId))throw new TicketStorageError("invalid-expected-snapshot");
 await options.authorize(scope,"delete");
 const root=baseDirectory(options.directory),dir=dateFolder(scope,businessDate,root);
 await secureDirectory(dir);
 let removed=false;
 await lockDate(dir,async()=>{
  // A closed sprint must be rejected here, not merely hidden in the UI.
  await options.authorize(scope,"delete");
  const current=await readCurrent(dir);
  if(!current)return;
  if(current!==expectedSnapshotId)throw new TicketStorageError("stale-confirmation");
  const marker=path.join(dir,".deleted-"+randomUUID()+".json");
  // Hide the published pointer atomically before removing the payload.
  await rename(path.join(dir,"current.json"),marker);
  removed=true;
  // The old bytes cannot become visible even if cleanup fails.
  await rm(path.join(dir,"versions"),{recursive:true,force:true}).catch(()=>{});
  await rm(marker,{force:true}).catch(()=>{});
 });
 return removed;
}
