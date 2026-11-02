import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const migration=read("scripts/db-upgrade.ts");
const policy=read("scripts/db-upgrade-policy.ts");
const capture=read("src/server/indicators/closure-snapshot.ts");
const closure=read("src/server/sprints/closure.ts");
const reporting=read("src/server/indicators/reporting.ts");
test("v33 upgrade only applies explicit, backed-up migrations",()=>{
 assert.match(migration,/SMN_V33_BACKUP_VERIFIED/);
 assert.match(migration,/before\.version===32/);
 assert.match(migration,/before\.version===33/);
 assert.match(policy,/version===33/);
 assert.match(migration,/BEGIN/);
});
test("v33 capture uses team-scoped manual and computed results with explicit states",()=>{
 assert.match(capture,/s\.team_id=\$1 AND s\.is_active=true/);
 assert.match(capture,/m\.cycle_type='scrum' AND m\.cycle_id=\$2/);
 assert.match(capture,/r\.cycle_type='scrum' AND r\.cycle_id=\$2/);
 assert.match(capture,/"not-recorded"/);
 assert.match(capture,/"unavailable"/);
});
test("closure appends immutable versioned v33 indicator snapshots",()=>{
 assert.match(closure,/captureCycleIndicators/);
 assert.match(closure,/indicatorsV33/);
 assert.match(closure,/COALESCE\(MAX\(version\),0\)\+1/);
 assert.match(closure,/INSERT INTO public\.smn_sprint_closure_snapshot/);
});
test("dashboard cutover allows configurable Builder rather than fixed legacy KPIs",()=>{
 const page=read("src/app/app/page.tsx");
 const builder=read("src/app/app/dashboard-builder/dashboard-consultation.tsx");
 assert.match(page,/dashboardBuilderCutoverEnabled\(\)/);
 assert.match(builder,/visibleSlots\(block\)/);
 assert.match(builder,/layout\.header\.blocks/);
});
test("v33 reporting is team-scoped and reads frozen closure snapshots",()=>{
 assert.match(reporting,/WHERE team_id=\$1 AND deleted_at IS NULL/);
 assert.match(reporting,/smn_indicator_manual_value/);
 assert.match(reporting,/smn_indicator_computed_result/);
 assert.match(reporting,/FROM public\.smn_sprint_closure_snapshot/);
});
test("dashboard slot assignments are in a dedicated constrained table",()=>{
 const sql=read("prisma/migrations/20261101_smn_dashboard_slots_additive/migration.sql");
 assert.match(sql,/PRIMARY KEY\(team_id,block_key,slot_index\)/);
 assert.match(sql,/UNIQUE\(team_id,indicator_id\)/);
 assert.match(sql,/slot_index BETWEEN 1 AND 4/);
 assert.match(sql,/slot_index BETWEEN 1 AND 2/);
});
