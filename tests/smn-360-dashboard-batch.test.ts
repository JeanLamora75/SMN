import assert from "node:assert/strict";
import test from "node:test";
import {batchCacheKey,validateBatchRequests,readDashboardBatch} from "../src/server/dashboard-builder/batch";
import type {Client} from "pg";
const scope={installationId:"installation1",accountId:"account1",teamId:"team1"};
const item={id:"slot1",source:"indicator:indicator1",view:"number",cycleId:"cycle1"};
test("SMN-360 AC2: cache identity isolates installation, account, team, cycle, permissions and filters",()=>{
 const a=batchCacheKey(scope,"read",item);
 for(const delta of [
  [{...scope,installationId:"installation2"},"read",item],
  [{...scope,accountId:"account2"},"read",item],
  [{...scope,teamId:"team2"},"read",item],
  [scope,"none",item],
  [scope,"read",{...item,cycleId:"cycle2"}],
  [scope,"read",{...item,filters:{x:1}}],
 ] as const)assert.notEqual(a,batchCacheKey(delta[0],delta[1],delta[2]));
 assert.equal(batchCacheKey(scope,"read",{...item,filters:{a:1,b:2}}),
  batchCacheKey(scope,"read",{...item,filters:{b:2,a:1}}));
});
test("SMN-360 AC1: rejects duplicate response ids and unbounded batches",()=>{
 assert.throws(()=>validateBatchRequests([item,item]),/invalid/);
 assert.throws(()=>validateBatchRequests(Array.from({length:81},(_,i)=>({...item,id:"x"+i}))),/invalid/);
});
test("SMN-360 AC1/AC3: equal source requests deduplicate, distinct errors isolated",async()=>{
 let producerCalls=0;
 const db={query:async(sql:string)=>{
  if(sql.includes("smn_dashboard_team_grant"))return {rows:[{role:"admin",can_read:true,can_edit:true}]};
  if(sql.includes("schema_version"))return {rows:[{schema_version:33}]};
  if(sql.includes("smn_indicator_definition"))return {rows:[{id:"indicator1",tag:"TEST",name:"Test",unit:"sp"}]};
  if(sql.includes("smn_indicator_manual_value")){producerCalls++;return {rows:[{value:"0"}]};}
  throw Error("unexpected query");
 }} as unknown as Client;
 const results=await readDashboardBatch(db,scope,[item,{...item,id:"slot2"},{id:"slot3",source:"unknown:abc",view:"number"}]);
 assert.equal(producerCalls,1);
 assert.deepEqual(results.map(x=>x.state),["available","available","absent"]);
 assert.equal(results[0].value,"0");
});
test("SMN-360 AC4: obsolete contexts are aborted by client hook",async()=>{
 const fs=await import("node:fs");
 const s=fs.readFileSync(new URL("../src/app/app/dashboard-builder/use-dashboard-batch.ts",import.meta.url),"utf8");
 assert.match(s,/AbortController/);
 assert.match(s,/controller\.abort\(\)/);
 assert.match(s,/generation\.current/);
 assert.match(s,/setInterval\(refresh/);
});
