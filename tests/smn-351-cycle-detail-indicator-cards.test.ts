import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("cycle detail shows ordered indicator cards with name value unit and tag",()=>{
 const component=read("src/app/app/admin/indicators/reporting-view.tsx");
 const reporting=read("src/server/indicators/reporting.ts");
 assert.match(component,/screen==="cycle_detail"&&data&&data.columns.length>0/);
 assert.match(component,/data\.columns\.map\(column=>/);
 assert.match(component,/column\.name/);
 assert.match(component,/cycle\?\.values\[column\.id\]/);
 assert.match(component,/column\.unit/);
 assert.match(component,/column\.tag/);
 assert.match(component,/screen!=="cycle_detail"&&<div className="table-responsive"/);
 assert.match(reporting,/ORDER BY COALESCE\(p\.display_order,0\),d\.tag,d\.id/);
});

test("cycle detail supports a user-selected number of cards per row",()=>{
 const report=read("src/app/app/admin/indicators/reporting-view.tsx");
 const workspace=read("src/app/app/admin/indicators/indicator-detail-workspace.tsx");
 const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
 const css=read("src/app/app/admin/sprints/[sprintId]/sprint-detail-cockpit.css");
 assert.match(page,/<IndicatorDetailWorkspace teamId=\{teamId\} cycleId=\{cycle\.id\} locale=\{locale\}/);
 assert.match(workspace,/smn-sprint-indicator-detail-toolbar/);
 assert.match(workspace,/smn-sprint-indicator-detail-controls/);
 assert.match(workspace,/smn-sprint-indicator-cards-per-row-v1/);
 assert.match(workspace,/window\.localStorage\.getItem/);
 assert.match(workspace,/window\.localStorage\.setItem/);
 assert.match(workspace,/MIN_COLUMNS=1,MAX_COLUMNS=6,DEFAULT_COLUMNS=3/);
 assert.match(workspace,/disabled=\{columns>=MAX_COLUMNS\}/);
 assert.match(workspace,/disabled=\{columns<=MIN_COLUMNS\}/);
 assert.match(report,/smn-indicator-detail-card-grid/);
 assert.match(report,/"--smn-detail-cards-per-row":cardsPerRow/);
 assert.match(css,/grid-template-columns:repeat\(var\(--smn-detail-cards-per-row,3\),minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:650px\)/);
});

test("les icônes du catalogue v33 s'affichent en filigrane sans masquer les valeurs",()=>{
 const component=read("src/app/app/admin/indicators/reporting-view.tsx");
 const reporting=read("src/server/indicators/reporting.ts");
 const css=read("src/app/app/admin/sprints/[sprintId]/sprint-detail-cockpit.css");
 assert.match(reporting,/d\.unit_short AS unit,d\.icon,d\.color,/);
 assert.match(reporting,/icon:string\|null;color:string\|null/);
 assert.match(component,/column\.icon&&isDashboardIcon\(column\.icon\)/);
 assert.match(component,/<SMNIcon name=\{column\.icon\}\/>/);
 assert.match(component,/smn-indicator-detail-watermark/);
 assert.match(component,/smn-indicator-detail-card-content/);
 assert.match(css,/\.smn-indicator-detail-watermark\{[\s\S]*?position:absolute;inset:0/);
 assert.match(css,/pointer-events:none;overflow:hidden;opacity:\.07;container-type:size/);
 assert.match(css,/\.smn-indicator-detail-card-content\{[\s\S]*?z-index:1/);
 assert.match(css,/font-size:min\(100cqh,85cqw\)/);
 assert.match(css,/transform:none/);
 assert.doesNotMatch(css,/font-size:clamp\(200px,18vw,420px\)/);
});
