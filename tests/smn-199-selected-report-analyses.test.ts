import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const store=readFileSync("src/server/reports/analysis-choices.ts","utf8");
const migration=readFileSync("scripts/apply-report-schema-v32.ts","utf8");
const view=readFileSync("src/app/app/admin/sprints/[sprintId]/report/preview/page.tsx","utf8");
const compose=readFileSync("src/server/reports/html-preview.ts","utf8");
const frozen=readFileSync("src/server/reports/render-reference.ts","utf8");
test("report analyses are opt-in and validated against accessible active sources",()=>{
 assert.match(store,/if\(!ids.length\)return \[\]/);
 assert.match(store,/allowed\.has\(x\)/);
 assert.match(migration,/selected_ids jsonb NOT NULL DEFAULT/);
});
test("analyses carry explicit origin and are distinct from KPIs",()=>{
 assert.match(view,/Analyses choisies — interprétations, non indicateurs/);
 assert.match(view,/a\.origin/);
 assert.match(view,/a\.archiveId/);
 assert.match(view,/a\.createdAt/);
});
test("selection is embedded into the frozen report snapshot, not recomputed at download",()=>{
 assert.match(compose,/chosenAnalyses=await selectedReportAnalyses/);
 assert.match(frozen,/data=await composeHtmlReportPreview/);
 assert.match(frozen,/canonicalJson\(payload\)/);
});
