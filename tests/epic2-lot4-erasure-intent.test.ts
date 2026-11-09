import {test} from "node:test";
import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {beginErasureIntent,finalizeErasureIntent,hasUnresolvedErasureIntent}
 from "../src/server/backup/erasure-intent";
import {appendCompletedErasure,initializeErasureLedger,readErasureLedger}
 from "../src/server/backup/erasure-ledger";
import {currentErasureEvidence,evaluateErasureProtection}
 from "../src/server/backup/erasure-protection";

test("SMN-39/40: pending operation blocks restore and completion is idempotent",async()=>{
 const base=await mkdtemp(join(tmpdir(),"smn-erasure-intent-"));
 const keys=["SMN_ERASURE_LEDGER_DIR","SMN_ERASURE_ANCHOR_DIR",
  "SMN_ERASURE_LEDGER_KEY_HEX","SMN_BACKUP_DIR"] as const;
 const old=keys.map(k=>process.env[k]);
 try{
  process.env.SMN_ERASURE_LEDGER_DIR=join(base,"journal");
  process.env.SMN_ERASURE_ANCHOR_DIR=join(base,"separate-anchor");
  process.env.SMN_ERASURE_LEDGER_KEY_HEX=randomBytes(32).toString("hex");
  delete process.env.SMN_BACKUP_DIR;
  const snapshotAt="2026-11-09T10:01:00.000Z";
  await initializeErasureLedger(new Date("2026-11-09T10:00:00.000Z"));
  const handle=await beginErasureIntent({planRevision:"a".repeat(64),
   operation:"erase"},new Date("2026-11-09T10:02:00.000Z"));
  assert.equal(await hasUnresolvedErasureIntent(),true);
  assert.equal((await currentErasureEvidence(snapshotAt)).state,"unavailable");
  await assert.rejects(beginErasureIntent({planRevision:"b".repeat(64),
   operation:"erase"}),/EEXIST/);
  // Simulate a process crash after journaling a committed erasure marker,
  // but before deleting the pending intent file.
  const marker=await appendCompletedErasure("erase",
   new Date("2026-11-09T10:03:00.000Z"),handle.id);
  assert.equal((await currentErasureEvidence(snapshotAt)).state,"unavailable");
  const verifiedDb={query:async(_sql:string,params:unknown[])=>({
   rows:params[0]===handle.id?[{scope_revision:handle.planRevision,operation:"erase"}]:[]
  })} as unknown as import("pg").Client;
  const deniedDb={query:async()=>({rows:[]})} as unknown as import("pg").Client;
  await assert.rejects(finalizeErasureIntent(handle,deniedDb),/commit-unverified/);
  assert.equal(await hasUnresolvedErasureIntent(),true);
  await finalizeErasureIntent(handle,verifiedDb);
  assert.equal(await hasUnresolvedErasureIntent(),false);
  const state=await readErasureLedger();
  assert.equal(state.markers.length,1,"replay must never duplicate a marker");
  assert.equal(state.markers[0].eventId,marker.eventId);
  const evidence=await currentErasureEvidence(snapshotAt);
  assert.equal(evidence.state,"verified");
  if(evidence.state==="verified"){
   assert.equal(evidence.entriesAfterBackup,1);
   assert.equal(evaluateErasureProtection(snapshotAt,{
    ...evidence,completeHistory:true}).code,"previously-erased-data");
  }
  assert.equal(evaluateErasureProtection(snapshotAt,evidence).permitted,false,
   "A valid journal is not complete until every deletion path is wired");
  await assert.rejects(finalizeErasureIntent(handle,verifiedDb),/mismatch/);
 }finally{
  for(let i=0;i<keys.length;i++){
   const value=old[i];if(value===undefined)delete process.env[keys[i]];
   else process.env[keys[i]]=value;
  }
  await rm(base,{recursive:true,force:true});
 }
});
