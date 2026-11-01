import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseReportIndicatorSelection} from "../src/server/reports/dynamic-indicators";
const read=(path:string)=>readFileSync(path,"utf8");
test("SMN-350: transient selection parser validates scope, order and explicit empty",()=>{
 const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
 assert.equal(parseReportIndicatorSelection(undefined),null);
 assert.deepEqual(parseReportIndicatorSelection(""),[]);
 assert.deepEqual(parseReportIndicatorSelection(b+","+a),[b,a]);
 assert.throws(()=>parseReportIndicatorSelection(a+","+a),/invalid-report-indicator-selection/);
 assert.throws(()=>parseReportIndicatorSelection("not-an-id"),/invalid-report-indicator-selection/);
});
test("SMN-350: HTML and PDF read the same immutable frozen payload, no preference writes",()=>{
 const projection=read("src/server/reports/dynamic-indicators.ts");
 assert.match(projection,/smn_indicator_team_selection/);
 assert.match(projection,/d\.archived_at IS NULL/);
 assert.doesNotMatch(projection,/\bINSERT\b|\bUPDATE\b|\bDELETE\b/);
 const scrum=read("src/server/reports/render-reference.ts");
 const kanban=read("src/server/kanban/render-reference.ts");
 assert.match(scrum,/composeHtmlReportPreview\(db,sprintId,indicatorSelection\)/);
 assert.match(kanban,/dynamicIndicators/);
 assert.match(scrum,/canonicalJson\(payload\)/);
 assert.match(kanban,/hashKanbanPayload\(payload\)/);
 const preview=read("src/app/app/admin/sprints/[sprintId]/report/preview/page.tsx");
 assert.match(preview,/frozen&&indicators!==undefined/);
 assert.match(preview,/data\.dynamicIndicators/);
});
