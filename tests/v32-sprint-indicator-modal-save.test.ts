import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const points=read("src/app/api/admin/sprints/story-points/route.ts");
const scores=read("src/app/api/admin/sprints/scores/route.ts");
const service=read("src/server/sprints/sprint-scores.ts");
const editor=read("src/app/app/admin/sprints/[sprintId]/sprint-indicators-panel.tsx");
const page=read("src/app/app/admin/sprints/[sprintId]/page.tsx");
const css=read("src/app/app/admin/sprints/[sprintId]/sprint-detail-cockpit.css");
test("v32: writes remain team-scoped without depending on pilot-only v28 gate",()=>{
 for(const route of [points,scores]){
  assert.ok(route.includes("context.version>=28&&context.version<=32"));
  assert.ok(route.includes("schema_version===28&&"));
 }
 assert.match(service,/i\.schema_version BETWEEN 28 AND 32/);
});
test("editor passes teamId and displays Cockpit Agile modal",()=>{
 assert.ok(editor.includes('new URLSearchParams({teamId})'));
 assert.ok(page.includes('sprintId={cycle.id} teamId={teamId} status={cycle.status}'));
 assert.ok(editor.includes('smn-indicator-dialog-header'));
 assert.ok(editor.includes('style={{backgroundColor:"#1b508d"'));
 assert.ok(editor.includes('className="h5 mb-0 text-white"'));
 assert.ok(editor.includes('smn-indicator-dialog-form'));
 assert.ok(css.includes('.smn-sprint-edit-dialog .smn-indicator-dialog-header'));
});
