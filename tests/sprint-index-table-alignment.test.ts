import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("Sprint state sits between name and period in header and body",()=>{
 const view=read("src/app/app/admin/sprints/sprint-index-view.tsx");
 const header=view.slice(view.indexOf("<thead><tr>"),view.indexOf("</tr></thead>"));
 assert(header.indexOf('t("sprintStates.name")')<header.indexOf('t("sprintStates.status")'));
 assert(header.indexOf('t("sprintStates.status")')<header.indexOf('t("sprintsIndex.period")'));
 const body=view.slice(view.indexOf('<tbody>{items.map'),view.indexOf('{indicatorCodes.map(code=><td'));
 assert(body.indexOf('data-label={t("sprintStates.status")}')<body.indexOf('data-label={t("sprintsIndex.period")}'));
});
test("percentage columns are left aligned with centered larger headings",()=>{
 const view=read("src/app/app/admin/sprints/sprint-index-view.tsx");
 const css=read("src/app/app/admin/sprints/sprints-cockpit.css");
 assert.match(view,/smn-sprints-gauge-cell/);
 assert.match(css,/thead th\{\s*text-align:center!important;font-size:\.86rem/);
 assert.match(css,/tbody td\.smn-sprints-gauge-cell\{\s*text-align:left!important/);
 assert.match(css,/tbody td:nth-child\(3\)\{grid-column:1\/-1\}/);
});
