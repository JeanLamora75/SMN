import assert from "node:assert/strict";
import {test} from "node:test";
import {randomUUID} from "node:crypto";
import {selectUpdateRecoveryPoint} from "../scripts/windows/update-backup-policy.mjs";

const now=Date.parse("2026-11-10T09:30:00.000Z");
const good=()=>({
 id:randomUUID(),status:"verified",integrityVerified:true,scopeComplete:true,
 createdAt:new Date(now-1000).toISOString(),
 components:[{kind:"database"},{kind:"office-report"}]
});
test("SMN-428: only fresh complete verified PostgreSQL recovery evidence qualifies",()=>{
 const valid=good();
 assert.equal(selectUpdateRecoveryPoint([valid],now),valid);
 for(const mutation of [
  {status:"success"},{status:"invalid"},{integrityVerified:false},
  {scopeComplete:false},{components:[]},{components:[{kind:"document"}]},
  {createdAt:new Date(now-24*60*60*1000-1).toISOString()},
  {createdAt:new Date(now+1).toISOString()}, {createdAt:"invalid"},
  {id:"../../escape"}
 ]){
  assert.equal(selectUpdateRecoveryPoint([{...valid,...mutation}],now),null);
 }
 assert.equal(selectUpdateRecoveryPoint([null,{status:"verified"},valid],now),valid);
 assert.equal(selectUpdateRecoveryPoint([],now),null);
});
