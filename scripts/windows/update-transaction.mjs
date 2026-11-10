// Persistent, fail-closed application-only cutover journal.
// This module never starts, stops, or modifies PostgreSQL.
import {readFile,writeFile,rename,lstat,mkdir} from "node:fs/promises";
import {randomUUID} from "node:crypto";
import path from "node:path";
import {existsSync} from "node:fs";

const LEGACY_NAMES=["app","prisma","scripts","launch-portable.mjs","Demarrer SMN.cmd",
  "Recuperer admin SMN.cmd","distribution-version.json"];
const layoutNames=root=>existsSync(path.join(root,"app","distribution-version.json"))?["app"]:LEGACY_NAMES;
const ID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const VERSION=/^[a-zA-Z0-9._-]{1,80}$/;
async function kind(file){
 try {
  const stat=await lstat(file);
  if(stat.isSymbolicLink())throw Error("update-transaction-symlink");
  return stat.isDirectory()?"directory":"file";
 } catch(error){if(error?.code==="ENOENT")return null;throw error;}
}
async function atomic(file,value){
 const tmp=file+"."+randomUUID()+".tmp";
 await writeFile(tmp,JSON.stringify(value)+"\n",{flag:"wx"});
 await rename(tmp,file);
}
function journalPath(root){return path.join(root,"updates","cutover-journal.json");}
export async function readCutover(root){
 const updatesInfo=await kind(path.join(root,"updates"));
 if(updatesInfo!=="directory")throw Error("update-protected-root-unsafe");
 let record;
 try{record=JSON.parse(await readFile(journalPath(root),"utf8"));}
 catch(error){if(error?.code==="ENOENT")return null;throw Error("update-journal-unreadable");}
 if(!record||record.format!==1||!ID.test(record.id)||!VERSION.test(record.version)||
   !["applying","committed","recovered"].includes(record.state)||
   !Array.isArray(record.entries)||record.entries.length!==layoutNames(root).length||
   record.entries.some((e,i)=>e.name!==layoutNames(root)[i]||typeof e.old!=="boolean"||
     typeof e.next!=="boolean"))
  throw Error("update-journal-invalid");
 return record;
}
export async function beginCutover(root,id,version){
 if(!ID.test(id)||!VERSION.test(version))throw Error("update-journal-invalid");
 const previous=await readCutover(root);
 if(previous?.state==="applying")throw Error("update-recovery-required");
 const entries=[];
 const prepared=path.join(root,"updates","prepared",id);
 for(const name of layoutNames(root)){
  entries.push({name,old:!!await kind(path.join(root,name)),
    next:!!await kind(path.join(prepared,name))});
 }
 const record={format:1,id,version,state:"applying",entries};
 await atomic(journalPath(root),record);
 return record;
}
export async function finishCutover(root,record,state){
 if(!["committed","recovered"].includes(state))throw Error("update-journal-invalid");
 await atomic(journalPath(root),{...record,state});
}
export async function recoverCutover(root){
 const record=await readCutover(root);
 if(!record||record.state!=="applying")return record?.state??"none";
 const prepared=path.join(root,"updates","prepared",record.id);
 const rollback=path.join(root,"updates","rollback",record.id);
 if(await kind(prepared)!=="directory"||await kind(rollback)!=="directory")
  throw Error("update-recovery-folder-unsafe");
 // Reverse order, failing closed on any unexpected collision or missing backup.
 for(const entry of [...record.entries].reverse()){
  const live=path.join(root,entry.name);
  const back=path.join(rollback,entry.name);
  const candidate=path.join(prepared,entry.name);
  const backupKind=await kind(back);
  const liveKind=await kind(live);
  const preparedKind=await kind(candidate);
  if(backupKind){
   if(!entry.old)throw Error("update-recovery-unexpected-backup");
   if(liveKind){
    if(preparedKind||!entry.next)throw Error("update-recovery-collision");
    await mkdir(path.dirname(candidate),{recursive:true});
    await rename(live,candidate);
   }
   await rename(back,live);
  }else if(entry.old){
   if(!liveKind)throw Error("update-recovery-missing-original");
   // A preexisting live component cannot be distinguished from a moved-in
   // candidate without its backup; fail closed for suspicious missing candidate.
   if(entry.next&&!preparedKind)throw Error("update-recovery-unverifiable");
  }else if(liveKind){
   if(!entry.next||preparedKind)throw Error("update-recovery-collision");
   await mkdir(path.dirname(candidate),{recursive:true});
   await rename(live,candidate);
  }
 }
 await finishCutover(root,record,"recovered");
 await atomic(path.join(root,"updates","status.json"),{
  state:"failed",version:null,at:new Date().toISOString()
 });
 return "recovered";
}
