import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {presenceFromSnapshot} from "../src/lib/sprint-presence";
import fr from "../src/i18n/fr.json";
import en from "../src/i18n/en.json";

const reader=readFileSync(new URL("../src/server/sprints/presence-detail-read.ts",import.meta.url),"utf8");
const panel=readFileSync(new URL("../src/app/app/admin/sprints/[sprintId]/sprint-capacity-panel.tsx",import.meta.url),"utf8");

test("Sprint capacity computes Product Owner and Scrum Master with role-aware engine",()=>{
 assert.match(reader,/role:"PRODUCT_OWNER"/);
 assert.match(reader,/role:"SCRUM_MASTER"/);
 assert.match(reader,/includeExceptionalImpact:false,teamId/);
 assert.match(reader,/roleCapacityJh=\{productOwner:po.totalJh,scrumMaster:sm.totalJh\}/);
 assert.match(panel,/row-cols-xl-5/);
 const i=["presenceTotal","presenceDevelopmentTotal","presenceProductOwnerTotal","presenceScrumMasterTotal","presenceMembers"].map(key=>panel.indexOf('t("sprintDetail.'+key+'")'));
 assert.ok(i.every(x=>x>=0));
 assert.deepEqual(i,[...i].sort((a,b)=>a-b));
});
test("role cards are localized in both supported languages",()=>{
 for(const key of ["presenceProductOwnerTotal","presenceScrumMasterTotal","presenceRoleMethod"] as const){
  assert.ok(fr.sprintDetail[key]);
  assert.ok(en.sprintDetail[key]);
 }
});
test("historic snapshot preserves role capacities and keeps old snapshots unknown",()=>{
 const snapshot={state:"available",hoursPerJh:7,members:[{
  memberId:"m1",displayName:"Example",presenceJh:5,developmentJh:2,
  daysCount:5,unknownDays:0
 }],totalPresenceJh:5};
 const old=presenceFromSnapshot(snapshot,1);
 assert.equal(old.state,"available");
 if(old.state==="available")assert.equal(old.roleCapacityJh,undefined);
 const current=presenceFromSnapshot({...snapshot,roleCapacityJh:{productOwner:1.25,scrumMaster:1.75}},2);
 assert.equal(current.state,"available");
 if(current.state==="available")assert.deepEqual(current.roleCapacityJh,{productOwner:1.25,scrumMaster:1.75});
 const invalid=presenceFromSnapshot({...snapshot,roleCapacityJh:{productOwner:-1,scrumMaster:1}},3);
 assert.equal(invalid.state,"unavailable");
});
