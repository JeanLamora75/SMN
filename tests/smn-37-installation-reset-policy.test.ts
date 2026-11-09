import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {RESET_RISKS,RESET_BLOCKERS,RESET_CONFIRMATION,assessResetRequest}
 from "../src/server/installation/reset-policy";

describe("SMN-37 — refus par défaut et absence de reset implicite",()=>{
 it("refuse tout compte non autorisé même avec la phrase correcte",()=>{
  const result=assessResetRequest(RESET_CONFIRMATION,false);
  assert.equal(result.canExecute,false);
  assert.equal(result.reason,"forbidden");
 });
 it("refuse une absence de confirmation ou une phrase inexacte",()=>{
  for(const input of [null,undefined,"REINITIALISER",true,
   "REINITIALISER MON INSTALLATION "]){
   const result=assessResetRequest(input,true);
   assert.equal(result.canExecute,false);
   assert.equal(result.reason,"confirmation-required");
  }
 });
 it("refuse même la confirmation explicite sans garanties de reprise",()=>{
  const result=assessResetRequest(RESET_CONFIRMATION,true);
  assert.equal(result.canExecute,false);
  assert.equal(result.reason,"reset-blocked");
  assert.ok(result.blockers.includes("rollback-not-qualified"));
  assert.ok(result.blockers.includes("files-and-db-atomicity-not-qualified"));
  assert.ok(result.blockers.includes("erasure-ledger-not-qualified"));
 });
 it("inclut les fichiers, comptes, liens, sauvegardes et copies externes",()=>{
  for(const risk of ["database-overwrite","private-files",
   "archives-and-snapshots","accounts-and-sessions","historical-links",
   "backup-before-reset","external-copies"]){
   assert.ok(RESET_RISKS.includes(risk as typeof RESET_RISKS[number]));
  }
  assert.ok(RESET_BLOCKERS.length>0);
 });
});
