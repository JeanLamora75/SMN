import assert from "node:assert/strict";
import {createHmac,randomBytes,randomUUID} from "node:crypto";
import {describe,it} from "node:test";
import {createErasureMarker,ERASURE_GENESIS_MAC} from
 "../src/server/backup/erasure-evidence-format";
import {openTransfer,sealTransfer} from "../scripts/smn-40-ledger-transfer";

function fixture(withErasure=false){
 const key=randomBytes(32),coverageStart="2026-11-11T13:36:18.984Z";
 const events=withErasure?[createErasureMarker(key,ERASURE_GENESIS_MAC,"erase",
  new Date("2026-11-12T08:00:00.000Z"),randomUUID())]:[];
 const anchorWithoutSeal={version:1 as const,coverageStart,count:events.length,
  headMac:events.at(-1)?.mac??ERASURE_GENESIS_MAC};
 const seal=createHmac("sha256",key).update(
  ["smn-erasure-anchor-v1",anchorWithoutSeal.version,
   anchorWithoutSeal.coverageStart,anchorWithoutSeal.count,
   anchorWithoutSeal.headMac].join("|")).digest("hex");
 return {version:1 as const,keyHex:key.toString("hex"),
  ledger:events.map(e=>JSON.stringify(e)+"\n").join(""),
  anchor:{...anchorWithoutSeal,seal}};
}
describe("SMN-40 portable erasure ledger",()=>{
 const phrase="long-private-transfer-phrase-for-evidence-tests";
 it("round-trips a valid empty ledger with authentic anchor",()=>{
  const p=fixture();
  const e=sealTransfer(p,phrase);
  assert.deepEqual(openTransfer(e,phrase),p);
  assert.equal(e.ciphertext.includes(p.keyHex),false);
 });
 it("preserves authenticated completed erasures",()=>{
  const p=fixture(true);
  assert.deepEqual(openTransfer(sealTransfer(p,phrase),phrase),p);
 });
 it("refuses wrong passphrases, corruption and modified authentication tags",()=>{
  const e=sealTransfer(fixture(true),phrase);
  assert.throws(()=>openTransfer(e,"wrong-password-with-sufficient-length"));
  assert.throws(()=>openTransfer({...e,tag:"0".repeat(32)},phrase));
  assert.throws(()=>openTransfer({...e,ciphertext:e.ciphertext.slice(0,-4)+"AAAA"},phrase));
 });
 it("rejects a forged empty history or inconsistent checkpoint",()=>{
  const p=fixture(true);
  assert.throws(()=>sealTransfer({...p,ledger:""},phrase));
  assert.throws(()=>sealTransfer({...p,anchor:{...p.anchor,count:0}},phrase));
 });
 it("does not accept an insufficient passphrase",()=>{
  assert.throws(()=>sealTransfer(fixture(),"short"));
 });
});
