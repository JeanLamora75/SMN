import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("SMN-230: six indicators are projected from the existing team-scoped producer",()=>{
 const source=read("src/server/sprints/index.ts");
 assert.match(source,/readSprintDetailIndicators\(db,teamId,item\.id\)/);
 assert.match(source,/const f05=f01!==null&&points\?\.added!=null&&points\?\.removed!=null/);
 assert.match(source,/100\*points\.done\/f05/);
 assert.match(source,/100\*f11\/f10/);
 assert.match(source,/item\.metrics=\{f01,f04:points\?\.done\?\?null/);
});

test("SMN-230: accessible columns, units, and absent-value marker",()=>{
 const ui=read("src/app/app/admin/sprints/sprint-index-view.tsx");
 for(const code of ["f01","f04","f07","f10","f11","f12"]) {
  assert.match(ui,new RegExp('"'+code+'"'));
 }
 assert.match(ui,/indicatorCodes\.map\(code=><th/);
 assert.match(ui,/tabIndex=\{0\}/);
 assert.match(ui,/item\.metrics\?\.\[code\]/);
 assert.match(ui,/return "—"/);
 assert.match(ui,/"tck":"sp"/);
});

test("SMN-230: percent gauges and theme-aware state colors",()=>{
 const ui=read("src/app/app/admin/sprints/sprint-index-view.tsx");
 const css=read("src/app/app/admin/sprints/sprints-cockpit.css");
 assert.match(ui,/smn-sprints-gauge/);
 assert.match(ui,/code==="f07"\|\|code==="f12"/);
 assert.match(ui,/smn-sprints-state-complete/);
 assert.match(css,/--bs-success-bg-subtle/);
 assert.match(css,/--bs-primary-bg-subtle/);
});
