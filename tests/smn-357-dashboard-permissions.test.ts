import assert from "node:assert/strict";
import test from "node:test";
import type { Client } from "pg";
import { dashboardPermission, requireDashboardPermission } from "../src/server/dashboard-builder/permissions";
import { readFileSync } from "node:fs";
const scope={installationId:"installA",accountId:"accountA",teamId:"teamA"};
function db(rows:unknown[]):Client{
 return {query:async(sql:string,params:string[])=>{
  assert.match(sql,/smn_dashboard_team_grant/);
  assert.match(sql,/t\.installation_id=i\.id/);
  assert.deepEqual(params,["installA","accountA","teamA"]);
  return {rows};
 }} as unknown as Client;
}
test("SMN-357 AC1: read and edit independent, edit implies read",async()=>{
 assert.deepEqual(await dashboardPermission(db([{role:"user",can_read:true,can_edit:false}]),scope),{canRead:true,canEdit:false});
 await requireDashboardPermission(db([{role:"user",can_read:true,can_edit:false}]),scope,"read");
 await assert.rejects(requireDashboardPermission(db([{role:"user",can_read:true,can_edit:false}]),scope,"edit"),/forbidden/);
 assert.deepEqual(await dashboardPermission(db([{role:"user",can_read:false,can_edit:true}]),scope),{canRead:false,canEdit:false});
});
test("SMN-357 AC2/AC4: denied teams and ungranted accounts never get access",async()=>{
 assert.deepEqual(await dashboardPermission(db([]),scope),{canRead:false,canEdit:false});
 assert.deepEqual(await dashboardPermission(db([{role:"user",can_read:false,can_edit:false}]),scope),{canRead:false,canEdit:false});
 await assert.rejects(requireDashboardPermission(db([]),scope,"read"),/forbidden/);
 await assert.rejects(requireDashboardPermission(db([]),scope,"edit"),/forbidden/);
});
test("SMN-357 AC4: administrator of scoped installation can read and edit",async()=>{
 assert.deepEqual(await requireDashboardPermission(db([{role:"admin",can_read:false,can_edit:false}]),scope,"edit"),{canRead:true,canEdit:true});
});
test("SMN-357 AC3: rights removal never deletes configurations",()=>{
 const sql=readFileSync(new URL("../prisma/migrations/20261102_smn357_dashboard_permissions/migration.sql",import.meta.url),"utf8");
 assert.match(sql,/CHECK \(NOT can_edit OR can_read\)/);
 assert.doesNotMatch(sql,/DELETE FROM.*smn_dashboard_layout/i);
 const server=readFileSync(new URL("../src/server/dashboard-builder/layout.ts",import.meta.url),"utf8");
 assert.match(server,/requireDashboardPermission\(db,scope,"read"\)/);
 assert.match(server,/requireDashboardPermission\(db,scope,"edit"\)/);
});
test("SMN-357 AC2: API authenticates both paths and delegates team rights to DB",()=>{
 const route=readFileSync(new URL("../src/app/api/dashboard-builder/layout/route.ts",import.meta.url),"utf8");
 assert.match(route,/type:"collective"/);
 assert.match(route,/scopeFor\(db,actor.id/);
 assert.doesNotMatch(route,/input\.installationId|input\.accountId/);
});
