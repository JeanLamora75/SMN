import {readFileSync} from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import type {Client} from "pg";
import {resolveDashboardSource,validateSourceDescriptors,listDashboardSources,type SourceDescriptor} from "../src/server/dashboard-builder/sources";

const available:SourceDescriptor={code:"indicator:x",name:"Example",category:"indicator",scope:"cycle",unit:"sp",permission:"read",views:["number","card"],status:"available"};
test("SMN-358 AC2/AC4: distinguish available, unavailable, unknown and incompatible",()=>{
 const absent:SourceDescriptor={...available,code:"link:catalog",status:"unavailable",reason:"adapter-not-connected"};
 assert.equal(resolveDashboardSource([available,absent],"indicator:x","number").status,"available");
 assert.equal(resolveDashboardSource([available,absent],"link:catalog","list").status,"unavailable");
 assert.equal(resolveDashboardSource([available,absent],"missing","card").status,"unknown");
 assert.equal(resolveDashboardSource([available,absent],"indicator:x","text").status,"incompatible");
});
test("SMN-358 AC2: metadata must have stable unique codes and valid views",()=>{
 validateSourceDescriptors([available]);
 assert.throws(()=>validateSourceDescriptors([available,available]),/invalid/);
 assert.throws(()=>validateSourceDescriptors([{...available,views:["fake" as "card"]}]),/invalid/);
});
test("SMN-358 AC1/AC3: SQL reads configured v33 indicator metadata only",async()=>{
 const calls:string[]=[];
 const db={query:async(sql:string)=>{
  calls.push(sql);
  if(sql.includes("smn_dashboard_team_grant"))return {rows:[{role:"admin",can_read:true,can_edit:true}]};
  if(sql.includes("schema_version"))return {rows:[{schema_version:33}]};
  if(sql.includes("smn_indicator_definition"))return {rows:[{id:"uuid-1",tag:"CUSTOM",name:"Custom",unit:"%",display_style:"number"}]};
  throw Error("unexpected SQL");
 }} as unknown as Client;
 const sources=await listDashboardSources(db,{installationId:"singleton",accountId:"actor1",teamId:"team1"});
 assert.equal(sources.find(s=>s.code==="indicator:uuid-1")?.status,"available");
 assert.equal(sources.find(s=>s.code==="registry:items")?.status,"available");
 assert.ok(calls.some(s=>s.includes("smn_indicator_team_selection")));
 assert.ok(calls.every(s=>!/^\s*(INSERT|UPDATE|DELETE)/i.test(s)));
});

test("Dashboard Builder: calendrier et notes raccordés aux producteurs métiers",()=>{
 const sources=readFileSync(new URL("../src/server/dashboard-builder/sources.ts",import.meta.url),"utf8");
 const batch=readFileSync(new URL("../src/server/dashboard-builder/batch.ts",import.meta.url),"utf8");
 const lists=readFileSync(new URL("../src/server/dashboard-builder/lists.ts",import.meta.url),"utf8");
 assert.ok(sources.includes('code:"calendar:ceremonies"'));
 assert.ok(sources.includes('code:"notes:sprint"'));
 assert.ok(sources.includes('status:"available"'));
 assert.match(batch,/readCalendarDashboardList/);
 assert.match(batch,/readNotesDashboardList/);
 assert.match(lists,/readCurrentSprintEvents/);
 assert.match(lists,/readCycleNotesAndAlerts/);
 assert.match(lists,/s\.team_id=\$3/);
});
