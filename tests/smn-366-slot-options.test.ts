import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createDefaultDashboardLayout,validateDashboardLayout} from "../src/server/dashboard-builder/layout";
import {updateDashboardSlot,normalizeSlotOptions} from "../src/lib/dashboard-builder/slot-options";

test("SMN-366 AC1/AC3: editing and clearing affect only targeted slot, keep identity",()=>{
 const original=createDefaultDashboardLayout("scrum");
 const slot=original.rows[0].blocks[0].slots[0];
 const other=original.rows[0].blocks[1].slots[0];
 const modified=updateDashboardSlot(original,slot.id,{source:"indicator:x",view:"number",filters:{}});
 assert.equal(modified.rows[0].blocks[0].slots[0].source,"indicator:x");
 assert.deepEqual(modified.rows[0].blocks[1].slots[0],other);
 assert.equal(original.rows[0].blocks[0].slots[0].source,undefined);
 const empty=updateDashboardSlot(modified,slot.id,null);
 assert.deepEqual(empty.rows[0].blocks[0].slots[0],slot);
 assert.deepEqual(empty.rows[0].blocks[1].slots[0],other);
 validateDashboardLayout(empty);
});
test("SMN-366 AC2: fields incompatible with indicators are rejected",()=>{
 assert.throws(()=>normalizeSlotOptions({limit:5},"indicator",[]),/incompatible/);
 assert.deepEqual(normalizeSlotOptions({sort:"desc",limit:5,columns:["name"]},"registry",[]),
  {limit:5,sort:"desc",columns:["name"]});
 assert.throws(()=>normalizeSlotOptions({limit:101},"registry",[]),/invalid/);
});
test("SMN-366 AC2: exceptions limited to active team's cycle list",()=>{
 assert.throws(()=>normalizeSlotOptions({cycleIdOverride:"foreign"},"indicator",["own"]),/forbidden/);
 assert.deepEqual(normalizeSlotOptions({cycleIdOverride:"own"},"indicator",["own"]),{cycleIdOverride:"own"});
});
test("SMN-366 AC1/AC3/AC4: prefill, confirmation and draft-only actions",()=>{
 const wizard=readFileSync(new URL("../src/app/app/dashboard-builder/slot-wizard.tsx",import.meta.url),"utf8");
 const editor=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-editor.tsx",import.meta.url),"utf8");
 assert.match(wizard,/initialSlot/);
 assert.match(wizard,/Options avancées/);
 assert.match(wizard,/Confirmer le vidage/);
 assert.match(editor,/updateDashboardSlot\(current,wizardSlot,null\)/);
 assert.match(editor,/setDraft\(current=>current\?updateDashboardSlot/);
});
