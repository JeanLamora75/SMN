import {createHmac,timingSafeEqual} from "node:crypto";

/**
 * Portable, privacy-preserving proof to compare a frozen source snapshot with
 * a candidate on another computer. The key is the existing recovered backup
 * encryption key, already required on both ends. This HMAC authenticates the
 * receipt, not the operator's claim that the source was fully frozen.
 *
 * This is NEVER a cutover token or retrospective erasure attestation.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HASH=/^[a-f0-9]{64}$/;
const UTC=(s:string)=>typeof s==="string"&&Number.isFinite(Date.parse(s))&&
 new Date(s).toISOString()===s;
export type CurrentStateReceiptPayload=Readonly<{
 version:1;purpose:"frozen-current-state-migration";
 archiveId:string;archiveCreatedAt:string;measuredAt:string;
 schemaVersion:33;databaseDigest:string;filesDigest:string;filesCount:number;
 ledgerCoverageStart:string;ledgerHeadMac:string;ledgerCount:number;
}>;
export type SignedCurrentStateReceipt=Readonly<{
 payload:CurrentStateReceiptPayload;mac:string;
}>;
export type CandidateMeasurements=Readonly<{
 archiveId:string;databaseDigest:string;filesDigest:string;filesCount:number;
 ledgerCoverageStart:string;ledgerHeadMac:string;ledgerCount:number;
}>;
function valid(p:CurrentStateReceiptPayload):boolean{
 return p?.version===1&&p.purpose==="frozen-current-state-migration"&&
  UUID.test(p.archiveId)&&UTC(p.archiveCreatedAt)&&UTC(p.measuredAt)&&
  p.measuredAt>=p.archiveCreatedAt&&p.schemaVersion===33&&
  HASH.test(p.databaseDigest)&&HASH.test(p.filesDigest)&&
  Number.isSafeInteger(p.filesCount)&&p.filesCount>=0&&
  UTC(p.ledgerCoverageStart)&&p.ledgerCoverageStart<=p.archiveCreatedAt&&
  HASH.test(p.ledgerHeadMac)&&Number.isSafeInteger(p.ledgerCount)&&
  p.ledgerCount>=0;
}
function canonical(p:CurrentStateReceiptPayload):string{
 return ["smn-current-transfer-v1",p.version,p.purpose,p.archiveId,
  p.archiveCreatedAt,p.measuredAt,p.schemaVersion,p.databaseDigest,
  p.filesDigest,p.filesCount,p.ledgerCoverageStart,p.ledgerHeadMac,
  p.ledgerCount].join("|");
}
function mac(key:Buffer,p:CurrentStateReceiptPayload):Buffer{
 if(key.length!==32)throw Error("migration-proof-key-invalid");
 return createHmac("sha256",key).update(canonical(p)).digest();
}
export function signCurrentStateReceipt(
 payload:CurrentStateReceiptPayload,key:Buffer
):SignedCurrentStateReceipt{
 if(!valid(payload))throw Error("migration-proof-invalid");
 return {payload,mac:mac(key,payload).toString("hex")};
}
export function comparePortableCurrentState(
 untrusted:unknown,key:Buffer,candidate:CandidateMeasurements
):Readonly<{
 state:"matched"|"blocked";blockers:readonly string[];
 currentStateMatched:boolean;sourceFrozenIndependently:false;
 historicalErasureCoverageCertified:false;restorationAuthorized:false;
}>{
 const blockers:string[]=[];
 const proof=untrusted as SignedCurrentStateReceipt|null;
 const p=proof?.payload;
 if(!p||!valid(p)||!HASH.test(proof?.mac??"")){
  blockers.push("receipt-invalid");
 }else{
  const expected=mac(key,p),actual=Buffer.from(proof!.mac,"hex");
  if(!timingSafeEqual(expected,actual))blockers.push("receipt-signature-invalid");
  if(p.archiveId!==candidate.archiveId)blockers.push("archive-mismatch");
  if(p.databaseDigest!==candidate.databaseDigest)
   blockers.push("database-fingerprint-mismatch");
  if(p.filesDigest!==candidate.filesDigest||
   p.filesCount!==candidate.filesCount)
   blockers.push("managed-files-fingerprint-mismatch");
  if(p.ledgerCoverageStart!==candidate.ledgerCoverageStart||
   p.ledgerHeadMac!==candidate.ledgerHeadMac||
   p.ledgerCount!==candidate.ledgerCount)
   blockers.push("external-ledger-mismatch");
 }
 return {state:blockers.length?"blocked":"matched",blockers,
  currentStateMatched:blockers.length===0,
  sourceFrozenIndependently:false,
  historicalErasureCoverageCertified:false,
  restorationAuthorized:false};
}
