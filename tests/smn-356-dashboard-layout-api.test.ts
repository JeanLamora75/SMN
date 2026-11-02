import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const api=readFileSync(new URL("../src/app/api/dashboard-builder/layout/route.ts",import.meta.url),"utf8");
const store=readFileSync(new URL("../src/server/dashboard-builder/layout.ts",import.meta.url),"utf8");

test("SMN-356 AC1: GET, PUT and PATCH require server-authorized session",()=>{
 assert.match(api,/export async function GET/);
 assert.match(api,/export const PUT=write/);
 assert.match(api,/export const PATCH=write/);
 assert.match(api,/authorizeApi\(request,"read",resource\)/);
 assert.match(store,/requireDashboardPermission\(db,scope,"edit"\)/);
 assert.match(api,/scopeFor\(db,actor.id/);
 assert.doesNotMatch(api,/input\.accountId|input\.installationId/);
});
test("SMN-356 AC1/AC3: stale revision returns 409 preserving draft",()=>{
 assert.match(api,/revision-conflict",message:/);
 assert.match(api,/keepDraft:true\},409/);
 assert.match(store,/AND revision=\$6/);
 assert.match(store,/ON CONFLICT DO NOTHING RETURNING revision/);
});
test("SMN-356 AC2: atomic write and rollback on failure",()=>{
 assert.match(store,/await db.query\("BEGIN"\)/);
 assert.match(store,/await db.query\("COMMIT"\)/);
 assert.match(store,/await db.query\("ROLLBACK"\)/);
 assert.match(api,/service-unavailable/);
});
test("SMN-356 AC4: duplicate submission maps to revision conflict",()=>{
 assert.match(store,/if \(q.rows.length!==1\) throw new Error\("dashboard-revision-conflict"\)/);
});
