import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {parsePrivacyQualificationArgs,assessArchiveLedgerTimeline,
 buildPrivacyQualification} from "../scripts/smn-40-privacy-qualification";

const archive="a710f9a7-8a48-4fbc-b3ae-17e3c14bed4d";
test("SMN-40 privacy: only a valid archive and read-only check",()=>{
 assert.equal(parsePrivacyQualificationArgs(["--archive",archive,"--check"]),archive);
 for(const args of [[],["--archive",archive,"--approve"],
  ["--archive",archive,"--restore"],["--archive","invalid","--check"]])
  assert.throws(()=>parsePrivacyQualificationArgs(args),
   /privacy-qualification-check-only/);
});
test("SMN-40 privacy: coverage dates distinguish old and new archive",()=>{
 const now="2026-11-11T16:11:00.000Z",start="2026-11-11T13:36:18.984Z";
 assert.equal(assessArchiveLedgerTimeline({archiveCreatedAt:now,
  ledgerCoverageStart:start,ledgerMarkers:0}).position,"archive-within-ledger-coverage");
 assert.equal(assessArchiveLedgerTimeline({archiveCreatedAt:"2026-11-11T11:08:00.000Z",
  ledgerCoverageStart:start,ledgerMarkers:0}).position,"archive-before-ledger-coverage");
 const unknown=assessArchiveLedgerTimeline({archiveCreatedAt:null,
  ledgerCoverageStart:start,ledgerMarkers:0});
 assert.equal(unknown.position,"unverifiable");
 assert.equal(unknown.unrecordedHistoryAbsenceProven,false);
 assert.equal(unknown.postArchiveErasureAbsenceProven,false);
});
test("SMN-40 privacy: no archive content or aggregate authorization inferred",()=>{
 const out=buildPrivacyQualification({archiveId:archive,
  archiveCreatedAt:"2026-11-11T16:11:00.000Z",
  verified:true,
  components:[{kind:"office-report"},{kind:"office-template"}],
  ledgerCoverageStart:"2026-11-11T13:36:18.984Z",recordedEvents:0});
 assert.equal(out.office.reports,1);
 assert.equal(out.office.templates,1);
 assert.equal(out.office.humanReviewRequired,true);
 assert.equal(out.office.personalDataAbsenceProven,false);
 assert.equal(out.collective.families.length,7);
 assert.equal(out.collective.allSevenQualified,false);
 assert.equal(out.erasure.timeline.position,"archive-within-ledger-coverage");
 assert.equal(out.erasure.externalSourcesReconciled,false);
 assert.equal(out.restorationAuthorized,false);
});
test("SMN-40 privacy: script never mutates DB or restored copies",()=>{
 const code=readFileSync(new URL("../scripts/smn-40-privacy-qualification.ts",import.meta.url),"utf8");
 assert.match(code,/previewBackupReadOnly/);
 assert.match(code,/readErasureLedger/);
 assert.doesNotMatch(code,/\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER)\s+(DATABASE|TABLE)\b/i);
 assert.doesNotMatch(code,/pg_restore|rehearseBackupRestore|execSync/);
});
