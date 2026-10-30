import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const service=read("src/server/sprints/story-points.ts");
const route=read("src/app/api/admin/sprints/story-points/route.ts");
const form=read("src/app/app/admin/sprints/[sprintId]/sprint-indicators-panel.tsx");
test("Story Points writing checks only the actual needed Sprint and aggregate tables",()=>{
 assert.doesNotMatch(service,/ensureSprintSchema/);
 assert.match(service,/to_regclass\('public\.smn_sprint'\)/);
 assert.match(service,/to_regclass\('public\.smn_sprint_story_points'\)/);
 assert.match(service,/to_regclass\('public\.smn_sprint_story_points_audit'\)/);
});
test("v32 errors can distinguish missing tables and actual server faults",()=>{
 assert.match(route,/sprint-story-points-save-failed/);
 assert.match(route,/error:"schema-not-ready"/);
 assert.match(form,/result\.error==="schema-not-ready"/);
 assert.match(form,/sprint-story-points-save-failed/);
});
