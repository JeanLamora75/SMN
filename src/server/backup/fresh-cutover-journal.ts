import {createHmac,timingSafeEqual} from "node:crypto";
import {lstat,readFile} from "node:fs/promises";

const HEX=/^[a-f0-9]{64}$/;
const ID=/^[a-f0-9]{12}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export type FreshCutoverStage="intent"|"files-promoted"|"source-parked"|
 "candidate-promoted"|"verified"|"rollback-started"|"rolled-back"|"incident";
export type FreshCutoverEvent=Readonly<{
 version:1;id:string;archiveId:string;candidateDb:string;
 rollbackDb:string;stage:FreshCutoverStage;at:string;
 previousMac:string;mac:string;
}>;
export const FRESH_CUTOVER_GENESIS="0".repeat(64);
const transitions:Record<FreshCutoverStage,readonly FreshCutoverStage[]>={
 intent:["files-promoted","rollback-started","incident"],
 "files-promoted":["source-parked","rollback-started","incident"],
 "source-parked":["candidate-promoted","rollback-started","incident"],
 "candidate-promoted":["verified","rollback-started","incident"],
 verified:[], "rollback-started":["rolled-back","incident"],
 "rolled-back":[],incident:[]
};
function valid(v:FreshCutoverEvent){
 return v?.version===1&&ID.test(v.id)&&UUID.test(v.archiveId)&&
  /^smn_restore_test_newpc_[a-f0-9]{8,16}$/.test(v.candidateDb)&&
  /^smn_restore_test_back_[a-f0-9]{12}$/.test(v.rollbackDb)&&
  Object.prototype.hasOwnProperty.call(transitions,v.stage)&&
  typeof v.at==="string"&&Number.isFinite(Date.parse(v.at))&&
  new Date(v.at).toISOString()===v.at&&
  HEX.test(v.previousMac)&&HEX.test(v.mac);
}
export function freshCutoverMac(
 key:Buffer,event:Omit<FreshCutoverEvent,"mac">
):string{
 if(key.length!==32)throw Error("fresh-cutover-key-invalid");
 return createHmac("sha256",key).update([
  "smn-fresh-cutover-v1",event.id,event.archiveId,
  event.candidateDb,event.rollbackDb,event.stage,event.at,event.previousMac
 ].join("|")).digest("hex");
}
export function verifyFreshCutoverJournal(
 events:readonly FreshCutoverEvent[],key:Buffer
):boolean{
 if(events.length===0||events.length>100||events[0]?.stage!=="intent")
  return false;
 let previous=FRESH_CUTOVER_GENESIS;
 for(let i=0;i<events.length;i++){
  const e=events[i];
  if(!valid(e)||e.previousMac!==previous||
   e.id!==events[0].id||e.archiveId!==events[0].archiveId||
   e.candidateDb!==events[0].candidateDb||
   e.rollbackDb!==events[0].rollbackDb||
   (i>0&&!transitions[events[i-1].stage].includes(e.stage)))
   return false;
  const signed=Buffer.from(freshCutoverMac(key,e),"hex");
  if(!timingSafeEqual(signed,Buffer.from(e.mac,"hex")))return false;
  previous=e.mac;
 }
 return true;
}
export async function readFreshCutoverJournal(path:string,key:Buffer){
 const stat=await lstat(path);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>512*1024)
  throw Error("fresh-cutover-journal-untrusted");
 const raw=await readFile(path,"utf8");
 if(!raw.endsWith("\n"))throw Error("fresh-cutover-journal-torn");
 const events=raw.trimEnd().split("\n").map(line=>JSON.parse(line) as FreshCutoverEvent);
 if(!verifyFreshCutoverJournal(events,key))
  throw Error("fresh-cutover-journal-invalid");
 return events;
}
