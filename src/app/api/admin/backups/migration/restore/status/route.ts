import {NextRequest} from "next/server";
import {lstat,readFile} from "node:fs/promises";
import {join} from "node:path";
import {authorizeApi} from "@/server/auth/authorization";
import {jsonResult} from "@/server/auth/request";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const STAGES=new Set(["queued","fenced","privacy-installed",
 "candidate-prepared","activating","promoted","complete",
 "rolled-back","incident","failed"]);
export async function GET(request:NextRequest){
 const actor=await authorizeApi(request,"read",
  {type:"backups",exists:true,inScope:true});
 if(!actor||actor.role!=="admin")
  return jsonResult({error:"forbidden"},403);
 try{
  const file=join(process.cwd(),"updates","migration-status.json");
  const stat=await lstat(file);
  if(!stat.isFile()||stat.isSymbolicLink()||
   stat.size<20||stat.size>2048)throw Error("migration-status-untrusted");
  const data=JSON.parse(await readFile(file,"utf8")) as {
   version?:number;token?:string;stage?:string;recordedAt?:string
  };
  if(data.version!==1||!UUID.test(data.token??"")||
   !STAGES.has(data.stage??"")||!data.recordedAt||
   !Number.isFinite(Date.parse(data.recordedAt)))
   throw Error("migration-status-invalid");
  return jsonResult({stage:data.stage,recordedAt:data.recordedAt,
   completed:data.stage==="complete",restorationVerified:data.stage==="complete",
   manualRecoveryRequired:data.stage==="incident"});
 }catch{return jsonResult({state:"not-started"},404);}
}
