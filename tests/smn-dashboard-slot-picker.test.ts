import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("dashboard offers a plus action on each configurable position",()=>{
 const component=read("src/app/app/dashboard-indicator-blocks.tsx");
 assert.match(component,/block\.positions\.map/);
 assert.match(component,/onClick=\{\(\)=>void open\(block\.key,position\.index/);
 assert.match(component,/aria-label=\{t\("indicators\.dashboard\.configureSlot"\)/);
 assert.match(component,/showModal\(\)/);
});
test("slot picker only offers active, nonarchived indicators of authorized team",()=>{
 const route=read("src/app/api/admin/indicators/dashboard-slots/route.ts");
 assert.match(route,/requireIndicatorTeam/);
 assert.match(route,/s\.team_id=\$1 AND s\.is_active=true/);
 assert.match(route,/d\.archived_at IS NULL/);
 assert.match(route,/candidates:candidates\.rows/);
 const component=read("src/app/app/dashboard-indicator-blocks.tsx");
 assert.match(component,/candidates\.filter\(c=>!occupiedByOther\(c\.id\)\)/);
});
test("slot replacement remains atomic and does not touch historical indicator values",()=>{
 const src=read("src/server/indicators/dashboard-slots.ts");
 assert.match(src,/BEGIN/);
 assert.match(src,/pg_advisory_xact_lock/);
 assert.match(src,/DELETE FROM public\.smn_indicator_dashboard_slot/);
 assert.match(src,/COMMIT/);
 assert.doesNotMatch(src,/DELETE FROM public\.smn_indicator_manual_value/);
});
