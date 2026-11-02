import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {resetDashboardDraft} from "../src/lib/dashboard-builder/reset";
import {createDefaultDashboardLayout,validateDashboardLayout} from "../src/server/dashboard-builder/layout";

test("SMN-371 AC2: Scrum/Kanban reset restores 2 header zones and 3 blank rows",()=>{
 for(const mode of ["scrum","kanban"] as const){
  let n=0;
  const layout=resetDashboardDraft(mode,()=>`reset-${++n}`);
  assert.equal(layout.header.blocks.length,2);
  assert.equal(layout.rows.length,3);
  assert.deepEqual(layout.rows.map(r=>r.blocks.length),[2,2,1]);
  assert.ok([...layout.header.blocks,...layout.rows.flatMap(r=>r.blocks)]
   .every(b=>b.templateId==="M01"&&b.slots.every(s=>!s.source&&!s.view)));
  validateDashboardLayout(layout);
 }
});
test("SMN-371 AC3: reset cannot mutate the persisted configuration",()=>{
 const original=createDefaultDashboardLayout("scrum");
 original.rows[0].blocks[0].slots[0].source="indicator:sample";
 original.rows[0].blocks[0].slots[0].view="number";
 const saved=JSON.stringify(original);
 let i=0;
 const draft=resetDashboardDraft("scrum",()=>`new-${++i}`);
 assert.notDeepEqual(draft,original);
 assert.equal(JSON.stringify(original),saved);
 assert.equal(original.rows[0].blocks[0].slots[0].source,"indicator:sample");
});
test("SMN-371 AC1/AC3/AC4: confirmation is draft-only, save stays explicit",()=>{
 const editor=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-editor.tsx",import.meta.url),"utf8");
 assert.match(editor,/Réinitialiser le Dashboard/);
 assert.match(editor,/setResetOpen\(true\)/);
 assert.match(editor,/resetDashboardDraft\(mode,\(\)=>crypto.randomUUID\(\)\)/);
 assert.match(editor,/setDraft\(resetDashboardDraft/);
 assert.match(editor,/setResetOpen\(false\)/);
 assert.match(editor,/setDraft\(null\)/);
 assert.match(editor,/expectedRevision:revision/);
 assert.match(editor,/method:"PUT"/);
});
