import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test} from "node:test";
import {initializeErasureLedger,readErasureLedger} from
 "../src/server/backup/erasure-ledger";
import {hasUnresolvedErasureIntent} from "../src/server/backup/erasure-intent";
import {withAuditedErasureTransaction} from "../src/server/backup/erasure-transaction";
import {currentErasureEvidence,evaluateErasureProtection} from
 "../src/server/backup/erasure-protection";

test("exceptional executor records a receipt and a durable external marker but never qualifies history",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn40-executor-"));
 const keys=["SMN_ERASURE_LEDGER_DIR","SMN_ERASURE_ANCHOR_DIR",
  "SMN_ERASURE_LEDGER_KEY_HEX","SMN_BACKUP_DIR"] as const;
 const previous=keys.map(k=>process.env[k]);
 try{
  process.env.SMN_ERASURE_LEDGER_DIR=join(root,"ledger");
  process.env.SMN_ERASURE_ANCHOR_DIR=join(root,"anchor");
  process.env.SMN_ERASURE_LEDGER_KEY_HEX=randomBytes(32).toString("hex");
  delete process.env.SMN_BACKUP_DIR;
  await initializeErasureLedger(new Date("2026-01-01T00:00:00.000Z"));
  let receiptId="";
  const queries:string[]=[];
  const db={
   query:async(sql:string,params:unknown[]=[]):Promise<{rows:any[]}>=>{
    queries.push(sql);
    if(sql.includes("SELECT tablename FROM pg_catalog.pg_tables"))
     return {rows:[{tablename:"smn_privacy_erasure_receipt"}]};
    if(sql.includes("INSERT INTO public.smn_privacy_erasure_receipt")){
     receiptId=String(params[0]);
     return {rows:[]};
    }
    if(sql.startsWith("SELECT scope_revision,operation FROM")){
     assert.equal(params[0],receiptId);
     return {rows:[{scope_revision:"a".repeat(64),operation:"erase"}]};
    }
    return {rows:[]};
   }
  };
  const result=await withAuditedErasureTransaction(db,{
   scopeRevision:"a".repeat(64),operation:"erase",expectedRows:1,
   subjectId:"smn40-synthetic-member"
  },async()=>1);
  assert.equal(result.recorded,true);
  assert.equal(result.affectedRows,1);
  assert.equal(result.receiptId,receiptId);
  assert.ok(queries.some(q=>q==="BEGIN ISOLATION LEVEL SERIALIZABLE"));
  assert.ok(queries.some(q=>q.includes("set_config('smn.privacy_receipt_id'")));
  assert.ok(queries.some(q=>q==="COMMIT"));
  assert.equal(await hasUnresolvedErasureIntent(),false);
  const ledger=await readErasureLedger();
  assert.equal(ledger.markers.length,1);
  assert.equal(ledger.markers[0].eventId,receiptId);
  assert.equal(ledger.markers[0].version,2);
  assert.ok(ledger.markers[0].subjectToken);
  const backup="2026-01-02T00:00:00.000Z";
  const evidence=await currentErasureEvidence(backup);
  assert.equal(evidence.state,"verified");
  if(evidence.state==="verified"){
   assert.equal(evidence.completeHistory,false);
   assert.equal(evaluateErasureProtection(backup,evidence).permitted,false);
  }
 }finally{
  for(let i=0;i<keys.length;i++){
   const value=previous[i];
   if(value===undefined)delete process.env[keys[i]];
   else process.env[keys[i]]=value;
  }
  await rm(root,{recursive:true,force:true});
 }
});

test("uncertain database commit leaves a durable pending erasure intent",async()=>{
 const root=await mkdtemp(join(tmpdir(),"smn40-ambiguous-"));
 const keys=["SMN_ERASURE_LEDGER_DIR","SMN_ERASURE_ANCHOR_DIR",
  "SMN_ERASURE_LEDGER_KEY_HEX","SMN_BACKUP_DIR"] as const;
 const previous=keys.map(k=>process.env[k]);
 try{
  process.env.SMN_ERASURE_LEDGER_DIR=join(root,"ledger");
  process.env.SMN_ERASURE_ANCHOR_DIR=join(root,"anchor");
  process.env.SMN_ERASURE_LEDGER_KEY_HEX=randomBytes(32).toString("hex");
  delete process.env.SMN_BACKUP_DIR;
  await initializeErasureLedger(new Date("2026-01-01T00:00:00.000Z"));
  const db={query:async(sql:string)=>{
   if(sql.includes("SELECT tablename FROM pg_catalog.pg_tables"))
    return {rows:[{tablename:"smn_privacy_erasure_receipt"}]};
   if(sql==="COMMIT")throw Error("simulated-disconnected-commit");
   return {rows:[]};
  }};
  await assert.rejects(withAuditedErasureTransaction(db,{
   scopeRevision:"b".repeat(64),operation:"erase",expectedRows:1,
   subjectId:"smn40-synthetic-member"
  },async()=>1),/privacy-erasure-outcome-unresolved/);
  assert.equal(await hasUnresolvedErasureIntent(),true);
  assert.equal((await readErasureLedger()).markers.length,0);
  assert.equal((await currentErasureEvidence("2026-01-02T00:00:00.000Z")).state,
   "unavailable");
 }finally{
  for(let i=0;i<keys.length;i++){
   const value=previous[i];
   if(value===undefined)delete process.env[keys[i]];
   else process.env[keys[i]]=value;
  }
  await rm(root,{recursive:true,force:true});
 }
});
