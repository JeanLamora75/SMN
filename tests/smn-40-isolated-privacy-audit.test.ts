import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {parsePrivacyAuditArgs,safePrivacyScope,summarizePrivacySignals}
 from "../scripts/smn-40-isolated-privacy-audit";

const cluster=resolve("smn-privacy-audit-test-cluster");
const isolated="postgresql://smn_rec04_admin:secret@127.0.0.1:57186/smn_restore_test_rec04_sandbox";
const live="postgresql://smn_active:other@127.0.0.1:5432/smn";
test("privacy audit is check-only and bound to dedicated REC-04 cluster",()=>{
 assert.equal(parsePrivacyAuditArgs(["--check"]),true);
 for(const args of [[],["--run"],["--restore"],["--check","--apply"]])
  assert.throws(()=>parsePrivacyAuditArgs(args),/isolated-privacy-check-only/);
 assert.equal(safePrivacyScope(isolated,live,cluster),true);
 for(const [a,b,c] of [
  [isolated.replace("57186","5432"),live,cluster],
  [isolated.replace("smn_restore_test_rec04_sandbox","smn"),live,cluster],
  [isolated.replace("127.0.0.1","example.com"),live,cluster],
  [isolated,live.replace(":5432",":57186"),cluster],
  [isolated,live.replace(/\/smn$/,"/postgres"),cluster],
  [isolated,live.replace("smn_active","smn_rec04_admin"),cluster],
  [isolated,live,""]
 ] as const) assert.equal(safePrivacyScope(a,b,c),false);
});
test("seven families are flagged as pending; sparse counts are not member counts",()=>{
 const catalog=[
  {table:"smn_indicator_manual_value",identifiers:true,freeText:false,json:true},
  {table:"smn_dashboard_layout",identifiers:false,freeText:false,json:true},
  {table:"smn_sprint_report",identifiers:false,freeText:true,json:false},
  {table:"smn_random_table",identifiers:false,freeText:false,json:false}
 ];
 const out=summarizePrivacySignals(catalog,new Map([
  ["smn_indicator_manual_value",2],
  ["smn_dashboard_layout",20],
  ["smn_sprint_report",3],
  ["smn_random_table",200]
 ]));
 assert.equal(out.families.length,7);
 assert.equal(out.allSevenQualified,false);
 assert.equal(out.families.every(f=>f.manualReview==="required"&&
  f.cohortSizeRisk==="not-measured"&&!f.retentionAuthorized),true);
 const indicators=out.families.find(f=>f.family==="indicator-v33");
 assert.equal(indicators?.tablesWithIdentifierFields,1);
 assert.equal(indicators?.smallRecordTableSignals,1);
 const dashboards=out.families.find(f=>f.family==="dashboard-builder");
 assert.equal(dashboards?.tablesWithOpaqueJsonFields,1);
});
test("read-only script never mutates either proof database nor prints sensitive rows",()=>{
 const code=readFileSync(new URL("../scripts/smn-40-isolated-privacy-audit.ts",import.meta.url),"utf8");
 assert.match(code,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/);
 assert.match(code,/fingerprintPublicTables/);
 assert.match(code,/compareFingerprints/);
 assert.match(code,/restored-evidence-databases-missing/);
 assert.match(code,/restorationAuthorized:false/);
 assert.match(code,/databasesModifiedByThisAudit:false/);
 assert.doesNotMatch(code,/\b(DROP|CREATE|ALTER|DELETE|INSERT|UPDATE|TRUNCATE)\s+(DATABASE|TABLE|FROM|INTO)\b/i);
 assert.doesNotMatch(code,/pg_restore|rehearseBackupRestore|spawn\(/);
});
