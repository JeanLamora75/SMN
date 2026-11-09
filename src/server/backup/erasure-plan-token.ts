import {createHmac,randomBytes,randomUUID,timingSafeEqual} from "node:crypto";
import type {ErasureMode} from "./exceptional-erasure-policy";

/**
 * A preview receipt is *not* a deletion authorization.
 * Process-local key intentionally invalidates receipts on server restart,
 * replica changes or process recycling (fail closed).
 */
const key=randomBytes(32),TIMEOUT=10*60_000;
const hex=/^[a-f0-9]{64}$/;
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export type ImpactReceipt=Readonly<{
 v:1;planId:string;actorId:string;memberId:string;mode:ErasureMode;
 scopeRevision:string;issuedAt:string;expiresAt:string;complete:false;
}>;
const safe=(s:string)=>typeof s==="string"&&s.length>=1&&s.length<=120;
const hmac=(payload:string)=>createHmac("sha256",key).update("smn38-preview-v1|"+payload).digest();
export function issueImpactReceipt(input:{
 actorId:string;memberId:string;mode:ErasureMode;scopeRevision:string;
},now=new Date()):{token:string;receipt:ImpactReceipt}|null{
 if(!safe(input.actorId)||!safe(input.memberId)||!hex.test(input.scopeRevision)||
  !["erase","anonymize"].includes(input.mode)||!Number.isFinite(now.getTime()))return null;
 const receipt:ImpactReceipt={
  v:1,planId:randomUUID(),actorId:input.actorId,memberId:input.memberId,
  mode:input.mode,scopeRevision:input.scopeRevision,
  issuedAt:now.toISOString(),expiresAt:new Date(now.getTime()+TIMEOUT).toISOString(),
  complete:false
 };
 const payload=Buffer.from(JSON.stringify(receipt)).toString("base64url");
 return {receipt,token:"v1."+payload+"."+hmac(payload).toString("base64url")};
}
export function verifyImpactReceipt(token:string,actorId:string,now=new Date()):ImpactReceipt|null{
 if(typeof token!=="string"||token.length>1500||!safe(actorId))return null;
 const parts=token.split(".");
 if(parts.length!==3||parts[0]!=="v1"||
  !/^[a-zA-Z0-9_-]+$/.test(parts[1])||!/^[a-zA-Z0-9_-]{43}$/.test(parts[2]))
  return null;
 const given=Buffer.from(parts[2],"base64url");
 if(given.length!==32||!timingSafeEqual(hmac(parts[1]),given))return null;
 let raw:unknown;
 try{raw=JSON.parse(Buffer.from(parts[1],"base64url").toString("utf8"));}
 catch{return null;}
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const r=raw as Record<string,unknown>;
 if(Object.keys(r).sort().join(",")!=="actorId,complete,expiresAt,issuedAt,memberId,mode,planId,scopeRevision,v"||
  r.v!==1||r.complete!==false||r.actorId!==actorId||
  typeof r.planId!=="string"||!uuid.test(r.planId)||
  typeof r.memberId!=="string"||!safe(r.memberId)||
  (r.mode!=="erase"&&r.mode!=="anonymize")||
  typeof r.scopeRevision!=="string"||!hex.test(r.scopeRevision)||
  typeof r.issuedAt!=="string"||typeof r.expiresAt!=="string"||
  !Number.isFinite(Date.parse(r.issuedAt))||!Number.isFinite(Date.parse(r.expiresAt))||
  new Date(r.issuedAt).toISOString()!==r.issuedAt||
  new Date(r.expiresAt).toISOString()!==r.expiresAt||
  Date.parse(r.expiresAt)-Date.parse(r.issuedAt)!==TIMEOUT||
  now.getTime()<Date.parse(r.issuedAt)||now.getTime()>=Date.parse(r.expiresAt))
  return null;
 return r as unknown as ImpactReceipt;
}
