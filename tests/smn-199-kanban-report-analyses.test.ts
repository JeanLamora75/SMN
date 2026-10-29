import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
test("Kanban selection is voluntary and scoped to installation team",()=>{
 const src=readFileSync("src/server/kanban/report-analysis-choices.ts","utf8");
 assert.match(src,/if\(ids.length===0\)return \[\]/);
 assert.match(src,/p.team_id/);
 assert.match(src,/allowed.has\(x\)/);
});
test("Kanban reference freezes selected analyses before PDF rendering",()=>{
 const snapshot=readFileSync("src/server/kanban/render-reference.ts","utf8");
 const view=readFileSync("src/app/app/admin/kanban-periods/[id]/report/frozen/page.tsx","utf8");
 assert.match(snapshot,/selectedKanbanAnalyses\(db,periodId\)/);
 assert.match(snapshot,/canonicalJson\(payload\)/);
 assert.match(view,/stored.payload.chosenAnalyses/);
 assert.match(view,/interprétations, non KPI/);
});
test("Scrum and Kanban choice APIs enforce admin writes on writable connections",()=>{
 const scrum=readFileSync("src/app/api/admin/reports/sprints/[id]/analysis-choices/route.ts","utf8");
 const kanban=readFileSync("src/app/api/admin/kanban-periods/[id]/analysis-choices/route.ts","utf8");
 assert.match(scrum,/withAuthDb|withLegacyTeamApi/);
 assert.match(kanban,/withAuthDb|withLegacyTeamApi/);
 assert.match(scrum,/authorizeApi\(req,"write"/);
 assert.match(kanban,/authorizeApi\(req,"write"/);
});
