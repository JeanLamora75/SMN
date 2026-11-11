import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {parseSemanticArgs,assessSemanticCatalog,cohortRiskBuckets}
 from "../scripts/smn-40-isolated-semantic-audit";
test("SMN-40 semantic: strictly check-only",()=>{
 assert.equal(parseSemanticArgs(["--check"]),true);
 for(const args of [[],["--apply"],["--check","--write"]])
  assert.throws(()=>parseSemanticArgs(args),/semantic-check-only/);
});
test("SMN-40 semantic: 195-table catalog and foreign-key coverage are separately tracked",()=>{
 const schema={tables:["smn_sprint","smn_member_assignment",
  "smn_indicator_definition","smn_indicator_manual_value",
  "smn_indicator_computed_result"],
  columns:[
   {table_name:"smn_sprint",column_name:"id",udt_name:"text"},
   {table_name:"smn_sprint",column_name:"team_id",udt_name:"text"},
   {table_name:"smn_member_assignment",column_name:"team_id",udt_name:"text"},
   {table_name:"smn_member_assignment",column_name:"member_id",udt_name:"text"},
   {table_name:"smn_member_assignment",column_name:"start_on",udt_name:"date"},
   {table_name:"smn_member_assignment",column_name:"end_on",udt_name:"date"},
   {table_name:"smn_indicator_definition",column_name:"id",udt_name:"text"},
   {table_name:"smn_indicator_manual_value",column_name:"team_id",udt_name:"text"},
   {table_name:"smn_indicator_computed_result",column_name:"team_id",udt_name:"text"}],
  foreignKeys:[{source:"smn_indicator_manual_value",target:"smn_indicator_definition"}]};
 const outcome=assessSemanticCatalog(schema);
 assert.equal(outcome.tables,5);
 assert.equal(outcome.tablesWithoutDeclaredForeignKeyConnections,3);
 assert.equal(outcome.coreRelations.memberAssignments,true);
 assert.equal(outcome.coreRelations.indicatorV33,true);
 assert.equal(outcome.families.length,7);
 assert.equal(outcome.semanticMappingComplete,false);
 assert.equal(outcome.families.every(f=>f.retentionAuthorized===false),true);
});
test("SMN-40 semantic: small sprint cohorts explicitly flag single-member exposure",()=>{
 assert.deepEqual(cohortRiskBuckets([0,1,2,4,5,8]),{
  teamCount:6,empty:1,singleMember:1,twoToFour:2,fiveOrMore:2,
  risk:"not-excluded"
 });
 assert.throws(()=>cohortRiskBuckets([-1]),/cohort-count-invalid/);
});
test("SMN-40 semantic: no writes, names or personal values disclosed",()=>{
 const code=readFileSync(new URL("../scripts/smn-40-isolated-semantic-audit.ts",import.meta.url),"utf8");
 assert.match(code,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/);
 assert.match(code,/count\(DISTINCT ma.member_id\)/);
 assert.match(code,/restorationAuthorized:false/);
 assert.doesNotMatch(code,/\b(CREATE|DROP|ALTER|INSERT|UPDATE|DELETE|TRUNCATE)\s+(DATABASE|TABLE|INTO|FROM)\b/i);
 assert.doesNotMatch(code,/pg_restore|rehearseBackupRestore|spawn\(/);
});
