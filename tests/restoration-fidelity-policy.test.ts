import assert from "node:assert/strict";
import {test} from "node:test";
import {recoveryDataHandling,assessMemberHistoryRestoration}
 from "../src/server/backup/restoration-fidelity-policy";
import type {FingerprintSet} from "../src/server/backup/restore-row-fingerprint";
const required=["smn_member","smn_member_assignment","smn_member_assignment_version",
 "smn_member_identity_history","smn_member_absence","smn_member_calendar_week",
 "smn_sprint","smn_indicator_definition","smn_indicator_manual_value",
 "smn_indicator_computed_result"];
const set=(changed?:string):FingerprintSet=>({
 digest:"digest",tables:required.map(table=>({
  table,rows:3,sha256:table===changed?"changed":"same"
 }))
});
test("Migration et incident : identités et historique restent conservés",()=>{
 for(const purpose of ["computer-migration","incident-recovery"] as const){
  assert.deepEqual(recoveryDataHandling(purpose),{
   purpose,memberIdentity:"preserve",historicalAssignments:"preserve",
   archivedMembers:"preserve",metricsAndReports:"preserve",
   exceptionalErasure:"independent-explicit-workflow",
   automaticAnonymization:false});
 }
 assert.throws(()=>recoveryDataHandling("exceptional-erasure" as never),
  /unsupported-recovery-purpose/);
});
test("Fidélité : vérifie noms/membres/affectations/historique sur deux restaurations",()=>{
 const good=assessMemberHistoryRestoration(set(),set());
 assert.equal(good.memberHistoryEvidenceEquivalent,true);
 assert.equal(good.requiredTableCount,10);
 assert.equal(good.identityRedactionNeeded,false);
 assert.equal(good.productionRestorationAuthorized,false);
 const bad=assessMemberHistoryRestoration(set(),set("smn_member"));
 assert.equal(bad.memberHistoryEvidenceEquivalent,false);
 assert.equal(bad.differingRequiredTableCount,1);
 const absent=assessMemberHistoryRestoration({digest:"",tables:[]},set());
 assert.equal(absent.memberHistoryEvidenceEquivalent,false);
 assert.equal(absent.missingRequiredTableCount,10);
});
