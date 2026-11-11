import {createCipheriv,createDecipheriv,createHmac,randomBytes,
 scryptSync,timingSafeEqual} from "node:crypto";
import {verifyErasureChain,ERASURE_GENESIS_MAC,type ErasureMarker}
 from "./erasure-evidence-format";

/**
 * Operator-to-operator handoff for the independent erasure ledger.
 * Separate from SMN backups. Never persist plaintext or the signing key.
 * A valid envelope authenticates its CONTENT, not its freshness versus
 * another existing ledger: external reconciliation is still mandatory.
 */
const MAX=18*1024*1024;
const HEX=/^[a-f0-9]{64}$/;
const UTC=(s:string)=>typeof s==="string"&&
 Number.isFinite(Date.parse(s))&&new Date(s).toISOString()===s;
type Anchor={version:1;coverageStart:string;count:number;headMac:string;seal:string};
export type PortableErasureEvidence=Readonly<{
 version:1;purpose:"external-erasure-ledger-transfer";
 kdf:"scrypt-n16384-r8-p1";salt:string;iv:string;
 ciphertext:string;tag:string;
}>;
type Payload={version:1;ledgerKeyHex:string;anchor:Anchor;markers:ErasureMarker[]};
function derive(phrase:string,salt:Buffer){
 if(typeof phrase!=="string"||phrase.length<20||phrase.length>256||
  phrase.trim()!==phrase)throw Error("transfer-phrase-invalid");
 return scryptSync(phrase,salt,32,{N:16384,r:8,p:1,maxmem:64*1024*1024});
}
function parsePayload(input:unknown):Payload{
 if(!input||typeof input!=="object")throw Error("transfer-payload-invalid");
 const p=input as Partial<Payload>,a=p.anchor;
 if(p.version!==1||typeof p.ledgerKeyHex!=="string"||
  !HEX.test(p.ledgerKeyHex)||!a||a.version!==1||
  !UTC(a.coverageStart)||!Number.isSafeInteger(a.count)||a.count<0||
  !HEX.test(a.headMac)||!HEX.test(a.seal)||
  !Array.isArray(p.markers)||p.markers.length>50000)
  throw Error("transfer-payload-invalid");
 const key=Buffer.from(p.ledgerKeyHex,"hex");
 try{
  if(p.markers.length!==a.count||
   !verifyErasureChain(key,p.markers)||
   p.markers.some(m=>m.occurredAt<a.coverageStart)||
   (p.markers.at(-1)?.mac??ERASURE_GENESIS_MAC)!==a.headMac)
   throw Error("transfer-ledger-unverified");
  const signed=createHmac("sha256",key).update(
   ["smn-erasure-anchor-v1",a.version,a.coverageStart,a.count,a.headMac].join("|")
  ).digest();
  if(!timingSafeEqual(signed,Buffer.from(a.seal,"hex")))
   throw Error("transfer-ledger-unverified");
  return p as Payload;
 }finally{key.fill(0);}
}
export function sealPortableErasureEvidence(raw:unknown,phrase:string):
 PortableErasureEvidence{
 const p=parsePayload(raw);
 const plain=Buffer.from(JSON.stringify(p),"utf8");
 if(plain.length>MAX)throw Error("transfer-payload-too-large");
 const salt=randomBytes(16),iv=randomBytes(12),derived=derive(phrase,salt);
 try{
  const cipher=createCipheriv("aes-256-gcm",derived,iv);
  cipher.setAAD(Buffer.from("smn-erasure-transfer-v1","utf8"));
  const ciphertext=Buffer.concat([cipher.update(plain),cipher.final()]);
  return {version:1,purpose:"external-erasure-ledger-transfer",
   kdf:"scrypt-n16384-r8-p1",salt:salt.toString("hex"),
   iv:iv.toString("hex"),ciphertext:ciphertext.toString("base64"),
   tag:cipher.getAuthTag().toString("hex")};
 }finally{plain.fill(0);derived.fill(0);}
}
export function openPortableErasureEvidence(envelope:unknown,phrase:string){
 if(!envelope||typeof envelope!=="object")
  throw Error("transfer-envelope-invalid");
 const p=envelope as Partial<PortableErasureEvidence>;
 if(p.version!==1||p.purpose!=="external-erasure-ledger-transfer"||
  p.kdf!=="scrypt-n16384-r8-p1"||typeof p.salt!=="string"||
  !/^[a-f0-9]{32}$/.test(p.salt)||typeof p.iv!=="string"||
  !/^[a-f0-9]{24}$/.test(p.iv)||typeof p.tag!=="string"||
  !/^[a-f0-9]{32}$/.test(p.tag)||typeof p.ciphertext!=="string"||
  p.ciphertext.length>MAX*2||
  !/^[A-Za-z0-9+/]*={0,2}$/.test(p.ciphertext))
  throw Error("transfer-envelope-invalid");
 const derived=derive(phrase,Buffer.from(p.salt,"hex"));
 let clear:Buffer|undefined;
 try{
  const decipher=createDecipheriv("aes-256-gcm",derived,Buffer.from(p.iv,"hex"));
  decipher.setAAD(Buffer.from("smn-erasure-transfer-v1","utf8"));
  decipher.setAuthTag(Buffer.from(p.tag,"hex"));
  try{
   clear=Buffer.concat([
    decipher.update(Buffer.from(p.ciphertext,"base64")),decipher.final()
   ]);
  }catch{throw Error("transfer-authentication-failed");}
  if(clear.length>MAX)throw Error("transfer-payload-too-large");
  const payload=parsePayload(JSON.parse(clear.toString("utf8")) as unknown);
  // No function here writes any evidence store or authorizes a cutover.
  return {valid:true as const,coverageStart:payload.anchor.coverageStart,
   recordedEvents:payload.anchor.count,
   requiresIndependentFreshnessProof:true as const,
   requiresDestinationReconciliation:true as const,
   restorationAuthorized:false as const};
 }finally{clear?.fill(0);derived.fill(0);}
}
