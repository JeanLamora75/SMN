import assert from "node:assert/strict";
import {test} from "node:test";
import {evaluateDatabaseUpdatePolicy} from "../scripts/windows/schema-update-policy.mjs";
const requirements={nodeMajor:24,postgresMajor:18,schemaVersion:33};
const healthy=()=>({diagnostic:"initialized",postgresMajor:18,schemaVersion:33,
 indicatorV33Valid:true,migrations:[{
  name:"20261101_native_v33",checksum:"a".repeat(64),finished:true,rolledBack:false
 }]});
test("SMN-429: v33 / PG18 with complete history requires zero migrations",()=>{
 const result=evaluateDatabaseUpdatePolicy(healthy(),requirements);
 assert.equal(result.action,"noop");
 assert.equal(result.schemaVersion,33);
 assert.equal(result.migrationCount,1);
});
test("SMN-429: version, incomplete state and incompatible schema are rejected",()=>{
 for(const mutation of [
  {diagnostic:"installation-incomplete"},
  {diagnostic:"schema-incompatible"},
  {postgresMajor:17},
  {postgresMajor:19},
  {schemaVersion:32},
  {schemaVersion:34},
  {indicatorV33Valid:false},
 ]){
  assert.throws(()=>evaluateDatabaseUpdatePolicy({...healthy(),...mutation},requirements));
 }
 assert.throws(()=>evaluateDatabaseUpdatePolicy(healthy(),{...requirements,schemaVersion:34}));
});
test("SMN-429: ambiguous, duplicate and interrupted migration histories are blocked",()=>{
 const first=healthy().migrations[0];
 for(const migrations of [
  [],[first,first],[{...first,finished:false}],
  [{...first,rolledBack:true}],[{...first,checksum:"invalid"}],
  [{...first,name:""}]
 ]){
  assert.throws(()=>evaluateDatabaseUpdatePolicy({...healthy(),migrations},requirements));
 }
});
test("SMN-429: input evidence is not modified and no DDL is executed",()=>{
 const before=healthy(),source=JSON.stringify(before);
 evaluateDatabaseUpdatePolicy(before,requirements);
 assert.equal(JSON.stringify(before),source);
});
