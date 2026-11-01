import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("B01 additive migration and native installation parity",()=>{
 const sql=read("prisma/migrations/20261101_smn_dashboard_slots_additive/migration.sql");
 const installer=read("src/server/installation/install.ts");
 const diagnostic=read("src/server/installation/diagnostic.ts");
 assert.match(sql,/PRIMARY KEY\(team_id,block_key,slot_index\)/);
 assert.match(sql,/UNIQUE\(team_id,indicator_id\)/);
 assert.match(sql,/slot_index BETWEEN 1 AND 4/);
 assert.match(sql,/slot_index BETWEEN 1 AND 2/);
 assert.match(installer,/20261101_smn_dashboard_slots_additive/);
 assert.match(diagnostic,/20261101_smn_dashboard_slots_additive/);
});
test("B01 assignment is atomic and validates selected active indicators",()=>{
 const src=read("src/server/indicators/dashboard-slots.ts");
 assert.match(src,/BEGIN/);
 assert.match(src,/pg_advisory_xact_lock/);
 assert.match(src,/is_active=true/);
 assert.match(src,/COMMIT/);
 assert.match(src,/ROLLBACK/);
});
test("B02 frozen v33 sprint snapshots supersede current values",()=>{
 const src=read("src/server/indicators/dashboard-cockpit.ts");
 assert.match(src,/cycle.status==="closed"/);
 assert.match(src,/smn_sprint_closure_snapshot/);
 assert.match(src,/indicatorsV33/);
 assert.match(src,/historical\?saved\?\.value\?\?null:raw/);
});
test("B03 and B04 dashboard has fixed cards with no duplicate dynamic table or historic KPIs",()=>{
 const cockpit=read("src/app/app/cycle-overview.tsx");
 const blocks=read("src/app/app/dashboard-indicator-blocks.tsx");
 const page=read("src/app/app/page.tsx");
 assert.match(cockpit,/DashboardIndicatorBlocks/);
 assert.match(blocks,/block.positions.map/);
 assert.doesNotMatch(cockpit,/KpiSprintScores|firstMetric=\{projection\?\.storyPoints|firstMetric=\{projection\?\.tickets/);
 assert.doesNotMatch(page,/screen="dashboard"/);
});
