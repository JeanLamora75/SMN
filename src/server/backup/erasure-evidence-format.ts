import {createHmac,timingSafeEqual,randomUUID} from "node:crypto";
/**
 * SMN-39 minimal non-identifying evidence format for a future protected,
 * append-only ledger OUTSIDE the database being restored.
 * It deliberately contains no name, record identifier, free text or actor.
 * This pure format does not itself provide tamper-proof storage.
 */
export type ErasureMarker=Readonly<{
 version:1;eventId:string;occurredAt:string;operation:"erase"|"anonymize";
 previousMac:string;mac:string;
}>;
const HEX=/^[a-f0-9]{64}$/;
const DATE=(s:string)=>typeof s==="string"&&!Number.isNaN(Date.parse(s))&&
 new Date(s).toISOString()===s;
function payload(marker:Omit<ErasureMarker,"mac">):string{
 return [marker.version,marker.eventId,marker.occurredAt,marker.operation,marker.previousMac].join("|");
}
function macFor(key:Buffer,marker:Omit<ErasureMarker,"mac">):string{
 if(key.length!==32)throw new Error("erasure-journal-key-invalid");
 return createHmac("sha256",key).update(payload(marker)).digest("hex");
}
export function createErasureMarker(key:Buffer,previousMac:string,
 operation:"erase"|"anonymize",now=new Date()):ErasureMarker{
 if(!HEX.test(previousMac)||!["erase","anonymize"].includes(operation)||
  !Number.isFinite(now.getTime()))throw new Error("erasure-journal-invalid-input");
 const entry:Omit<ErasureMarker,"mac">={
  version:1,eventId:randomUUID(),occurredAt:now.toISOString(),operation,previousMac
 };
 return {...entry,mac:macFor(key,entry)};
}
export function verifyErasureChain(key:Buffer,markers:readonly ErasureMarker[],
 initialMac="0".repeat(64)):boolean{
 if(key.length!==32||!HEX.test(initialMac))return false;
 let previous=initialMac;
 const ids=new Set<string>();
 let previousDate="";
 for(const marker of markers){
  if(marker.version!==1||!/^[a-f0-9-]{36}$/.test(marker.eventId)||
   ids.has(marker.eventId)||!DATE(marker.occurredAt)||
   (previousDate!==""&&marker.occurredAt<previousDate)||
   !["erase","anonymize"].includes(marker.operation)||
   !HEX.test(marker.mac)||marker.previousMac!==previous)return false;
  const expected=Buffer.from(macFor(key,marker),"hex");
  if(!timingSafeEqual(expected,Buffer.from(marker.mac,"hex")))return false;
  previous=marker.mac;
  previousDate=marker.occurredAt;
  ids.add(marker.eventId);
 }
 return true;
}
export const ERASURE_GENESIS_MAC="0".repeat(64);
