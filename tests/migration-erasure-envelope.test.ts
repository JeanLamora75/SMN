import assert from "node:assert/strict";
import {test} from "node:test";
import {createHmac} from "node:crypto";
import {createErasureMarker,ERASURE_GENESIS_MAC}
 from "../src/server/backup/erasure-evidence-format";
import {sealPortableErasureEvidence,openPortableErasureEvidence}
 from "../src/server/backup/migration-erasure-envelope";
const key=Buffer.from("75".repeat(32),"hex");
const phrase="phrase-de-transfert-longue-et-distincte-pour-SMN-40";
const start="2026-11-11T13:36:18.984Z";
const anchor=(markers:ReturnType<typeof createErasureMarker>[])=>{
 const a={version:1 as const,coverageStart:start,count:markers.length,
  headMac:markers.at(-1)?.mac??ERASURE_GENESIS_MAC};
 const seal=createHmac("sha256",key).update(
  ["smn-erasure-anchor-v1",a.version,a.coverageStart,a.count,a.headMac].join("|")
 ).digest("hex");
 return {...a,seal};
};
test("transfer authenticated empty ledger without creating a new one",()=>{
 const env=sealPortableErasureEvidence({version:1,ledgerKeyHex:key.toString("hex"),
  anchor:anchor([]),markers:[]},phrase);
 const out=openPortableErasureEvidence(env,phrase);
 assert.equal(out.valid,true);
 assert.equal(out.recordedEvents,0);
 assert.equal(out.coverageStart,start);
 assert.equal(out.restorationAuthorized,false);
 assert.equal(out.requiresIndependentFreshnessProof,true);
 assert.equal(JSON.stringify(env).includes(key.toString("hex")),false);
 assert.equal(JSON.stringify(env).includes(phrase),false);
});
test("nonempty chain preserved; wrong phrase and forged ciphertext blocked",()=>{
 const marker=createErasureMarker(key,ERASURE_GENESIS_MAC,"erase",
  new Date("2026-11-11T14:00:00.000Z"),
  "77dd8844-393f-43d5-9da1-18b25cf709e4","a".repeat(64));
 const env=sealPortableErasureEvidence({version:1,ledgerKeyHex:key.toString("hex"),
  anchor:anchor([marker]),markers:[marker]},phrase);
 assert.equal(openPortableErasureEvidence(env,phrase).recordedEvents,1);
 assert.throws(()=>openPortableErasureEvidence(env,"une-autre-phrase-valide-de-vingt-caracteres"),
  /transfer-authentication-failed/);
 assert.throws(()=>openPortableErasureEvidence({...env,tag:"f".repeat(32)},phrase),
  /transfer-authentication-failed/);
});
test("invalid anchor, malformed input and weak phrase fail closed",()=>{
 const raw={version:1,ledgerKeyHex:key.toString("hex"),
  anchor:anchor([]),markers:[]};
 assert.throws(()=>sealPortableErasureEvidence({...raw,
  anchor:{...raw.anchor,count:1}},phrase),/transfer-ledger-unverified/);
 assert.throws(()=>sealPortableErasureEvidence(raw,"short"),/transfer-phrase-invalid/);
 assert.throws(()=>openPortableErasureEvidence({},phrase),/transfer-envelope-invalid/);
});
