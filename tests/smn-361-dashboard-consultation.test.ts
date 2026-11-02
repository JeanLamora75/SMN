import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createDefaultDashboardLayout,validateDashboardLayout} from "../src/server/dashboard-builder/layout";
import {visibleSlots,gridColumns} from "../src/app/app/dashboard-builder/dashboard-consultation";
test("SMN-361 AC1: Scrum/Kanban defaults provide two header blocks and three rows",()=>{
 for(const mode of ["scrum","kanban"] as const){
  const layout=createDefaultDashboardLayout(mode);
  assert.equal(layout.header.blocks.length,2);
  assert.equal(layout.rows.length,3);
  assert.doesNotThrow(()=>validateDashboardLayout(layout));
 }
});
test("SMN-361 AC3: empty slots vanish, configured slots persist even without values",()=>{
 const layout=createDefaultDashboardLayout("scrum");
 const block=layout.rows[0].blocks[0];
 assert.deepEqual(visibleSlots(block),[]);
 block.slots[0].source="indicator:metric";
 block.slots[0].view="number";
 assert.equal(visibleSlots(block).length,1);
 assert.equal(gridColumns(block),"1fr");
});
test("SMN-361 AC2: saved personal layout is read from authorized scoped storage",()=>{
 const page=readFileSync(new URL("../src/app/app/dashboard-builder/page.tsx",import.meta.url),"utf8");
 assert.match(page,/readDashboardLayout\(db/);
 assert.match(page,/accountId:account.id,teamId/);
 assert.match(page,/readAccountDashboard/);
 assert.match(page,/withSessionReadDb/);
});
test("SMN-361 AC4: consultation has no editing controls or writes",()=>{
 const file=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-consultation.tsx",import.meta.url),"utf8");
 assert.doesNotMatch(file,/personnaliser|sauvegarder|enregistrer|\bPUT\b|\bPATCH\b|modifier/i);
 assert.match(file,/aria-label/);
 assert.match(file,/smn-panel/);
 assert.match(file,/visibleSlots/);
});
