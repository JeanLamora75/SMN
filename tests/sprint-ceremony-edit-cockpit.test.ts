import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";

const edit=readFileSync(new URL("../src/app/app/operational-edit.tsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/app/app/admin/sprints/[sprintId]/sprint-detail-cockpit.css",import.meta.url),"utf8");

test("Sprint ceremony editing uses the existing Cockpit Agile modal header and body",()=>{
 assert.match(edit,/props\.kind==="event"\?" smn-sprint-ceremony-cockpit-dialog":""/);
 assert.match(edit,/props\.kind==="event"\?"modal-content smn-cockpit-modal"/);
 assert.match(edit,/props\.kind==="event"\?"smn-cockpit-modal-header"/);
 assert.match(edit,/props\.kind==="event"\?"smn-cockpit-modal-body"/);
 assert.match(edit,/createPortal\(/);
 assert.match(edit,/ref=\{ref\}/);
 assert.match(edit,/onClose=\{\(\)=>setOpened\(false\)\}/);
 assert.match(edit,/saved=\{saved\} onCancel=\{close\}/);
});
test("start, planned duration and actual duration share one responsive row",()=>{
 const row=edit.indexOf('className="smn-operational-event-time-row"');
 const end=edit.indexOf("</div>",row);
 assert.ok(row>=0&&end>row);
 const content=edit.slice(row,end);
 for(const key of ["dashboard.operational.edit.start","dashboard.operational.edit.duration","sprintDetail.ceremonyActualDuration"])
  assert.ok(content.includes(key),key);
 assert.match(css,/\.smn-sprint-ceremony-cockpit-dialog \.smn-operational-event-time-row\{/);
 assert.match(css,/grid-template-columns:minmax\(0,2fr\) minmax\(0,1fr\) minmax\(0,1\.3fr\)/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
});
test("event saving still persists both durations, start date and status",()=>{
 for(const item of ['dashboardLocalToIso(when,timeZone,initial.startsAt)','actualMinutes,expectedActualMinutes:initial.actualMinutes','expectedStartAt:initial.startsAt','expectedEndAt:initial.endsAt','router.refresh()'])
  assert.ok(edit.includes(item),item);
});
