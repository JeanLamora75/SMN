import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("dashboard indicator picker uses Cockpit Agile modal structure",()=>{
 const view=read("src/app/app/dashboard-indicator-blocks.tsx");
 const css=read("src/app/app/dashboard-slot-cockpit.css");
 assert.ok(view.startsWith('"use client";'));
 assert.match(view,/smn-dashboard-slot-dialog smn-sprint-edit-dialog/);
 assert.match(view,/smn-indicator-dialog-header/);
 assert.match(view,/smn-indicator-dialog-form/);
 assert.match(view,/modal-footer/);
 assert.match(css,/background:#1b508d/);
 assert.match(css,/::backdrop/);
 assert.match(css,/\.btn-close/);
});
