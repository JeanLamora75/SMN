import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {classifyBackupEvidence,classifyCleanupEvidence,blockedOperation,
 sanitizeOperationCode,reconcileCleanupEvidence,unresolvedOperation,OBJECTIVES} from "../src/server/backup/operation-diagnostics";
const now="2026-11-09T10:00:00.000Z",id="6de5b400-44a0-41eb-9a47-6a9c2474f5b6";
const backup=(overrides:Partial<Parameters<typeof classifyBackupEvidence>[0]>={})=>
 classifyBackupEvidence({operationId:id,startedAt:now,checkedAt:now,
  marker:"success",running:false,packageVerified:false,packageExists:false,
  ...overrides});
describe("SMN-41 — preuves d'incidents et résultats",()=>{
 it("ne prend jamais une réussite persistée pour une preuve du paquet",()=>{
  assert.equal(backup().status,"failed");
  assert.equal(backup({packageExists:true}).status,"failed");
  assert.equal(backup({packageVerified:true,packageExists:false}).status,"failed",
   "A claimed verification without a materialized package is never success");
  assert.equal(backup({packageVerified:true,packageExists:true}).status,"succeeded");
 });
 it("distingue exécution réelle et interruption après redémarrage",()=>{
  assert.equal(backup({marker:"running",running:true}).status,"running");
  const stopped=backup({marker:"running",running:false});
  assert.equal(stopped.status,"interrupted");
  assert.equal(stopped.processed,0);
  assert.equal(stopped.unprocessed,1);
  assert.notEqual(stopped.reason,"verified-package");
 });
 it("n'invente pas une annulation lorsqu'un paquet existe",()=>{
  assert.equal(backup({marker:"cancelled"}).status,"cancelled");
  assert.equal(backup({marker:"cancelled",packageExists:true}).status,"failed");
 });
 it("distingue traitement réussi, partiel et non traité dans une purge",()=>{
  const make=(processed:number,failed:number,running=false)=>
   classifyCleanupEvidence({operationId:id,startedAt:now,checkedAt:now,
    planned:5,processed,failed,running});
  assert.deepEqual([make(2,1).status,make(2,1).processed,
   make(2,1).failed,make(2,1).unprocessed],["partial",2,1,2]);
  assert.equal(make(5,0).status,"succeeded");
  assert.equal(make(1,0,true).status,"running");
  assert.throws(()=>classifyCleanupEvidence({operationId:id,startedAt:now,
   checkedAt:now,planned:2,processed:2,failed:1,running:false}));
 });
 it("reconcilie une purge partielle sans double-compter les éléments incertains",()=>{
  const sample={operationId:id,startedAt:now,checkedAt:now,status:"success" as const,
   planned:5,recordedProcessed:3,recordedFailed:1,verifiedRemoved:2,
   inFlight:false,currentlyRunning:false,unresolvedTombstones:1};
  const result=reconcileCleanupEvidence(sample);
  assert.equal(result.status,"partial");
  assert.deepEqual([result.processed,result.failed,result.unprocessed],[2,2,1]);
  assert.equal(result.processed+result.failed+result.unprocessed,5);
  assert.equal(reconcileCleanupEvidence({...sample,recordedProcessed:5,
   recordedFailed:0,verifiedRemoved:5,unresolvedTombstones:0}).status,"succeeded");
  assert.equal(reconcileCleanupEvidence({...sample,status:"running",currentlyRunning:true})
   .status,"running");
  assert.throws(()=>reconcileCleanupEvidence({...sample,verifiedRemoved:4}));
 });
 it("n'expose ni les noms des fichiers ni des secrets dans un artefact interrompu",()=>{
  const result=unresolvedOperation("backup",now,"unpublished-backup-artifact",2);
  assert.equal(result.status,"interrupted");
  assert.equal(result.unprocessed,2);
  assert.equal(result.operationId,"unresolved");
  assert.equal(result.targetsValidated,false);
  assert.equal(sanitizeOperationCode("password=secret"),"unverifiable-state");
  assert.throws(()=>unresolvedOperation("backup",now,"invalid-operation-marker",0));
 });
 it("ne transforme jamais un restore/reset bloqué en réussite",()=>{
  for(const kind of ["restore","installation-reset"] as const){
   const state=blockedOperation(kind,now);
   assert.equal(state.status,"blocked");
   assert.equal(state.processed,0);
  }
 });
 it("aucun texte arbitraire ni secret n'est repris dans le diagnostic",()=>{
  assert.equal(sanitizeOperationCode("Bearer top-secret"),"unverifiable-state");
  assert.equal(sanitizeOperationCode("verified-package"),"verified-package");
 });
 it("RPO 24 heures / RTO 60 minutes sont seulement indicatifs",()=>{
  assert.equal(OBJECTIVES.indicativeRpoHours,24);
  assert.equal(OBJECTIVES.indicativeRtoMinutes,60);
  assert.equal(OBJECTIVES.targetsValidated,false);
  assert.equal(backup({packageVerified:true,packageExists:true}).measuredRtoMinutes,null);
  assert.equal(backup({packageVerified:true,packageExists:true}).measuredRpoMinutes,null);
 });
});
