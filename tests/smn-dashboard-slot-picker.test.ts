import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveDashboardSource} from "../src/server/dashboard-builder/sources";
import {dashboardPermission} from "../src/server/dashboard-builder/permissions";
import type {Client} from "pg";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Dashboard Builder uses configurable slots, not fixed legacy dashboard positions",()=>{
 const consultation=read("src/app/app/dashboard-builder/dashboard-consultation.tsx");
 assert.match(consultation,/visibleSlots\(block\)/);
 assert.match(consultation,/slot\.source/);
 assert.match(consultation,/slot\.view/);
 const batch=read("src/server/dashboard-builder/batch.ts");
 assert.match(batch,/requireDashboardPermission\(db,scope,"read"\)/);
 assert.match(batch,/scope\.teamId/);
});
test("indicator source is unavailable when absent and rejects incompatible visualization",()=>{
 const sources=[{code:"indicator:id1",name:"Indicateur",category:"indicator" as const,
  unit:"SP",scope:"cycle" as const,permission:"read" as const,views:["number" as const],
  status:"available" as const}];
 assert.equal(resolveDashboardSource(sources,"indicator:unknown","number").status,"unknown");
 assert.equal(resolveDashboardSource(sources,"indicator:id1","list").status,"incompatible");
 assert.equal(resolveDashboardSource(sources,"indicator:id1","number").status,"available");
});
test("permissions refuse an unauthorized team instead of leaking indicators",async()=>{
 const db={query:async()=>({rows:[]})} as unknown as Client;
 const permission=await dashboardPermission(db,{installationId:"installation1",accountId:"account1",teamId:"team1"});
 assert.deepEqual(permission,{canRead:false,canEdit:false});
});
test("Dashboard Builder never deletes manual indicator values during slot configuration",()=>{
 const batch=read("src/server/dashboard-builder/batch.ts");
 const consultation=read("src/app/app/dashboard-builder/dashboard-consultation.tsx");
 assert.doesNotMatch(batch,/DELETE FROM public\.smn_indicator_manual_value/);
 assert.doesNotMatch(consultation,/DELETE FROM public\.smn_indicator_manual_value/);
});
