import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createDefaultDashboardLayout,validateDashboardLayout} from "../src/server/dashboard-builder/layout";
import {appendDashboardRow,appendDashboardBlock} from "../src/lib/dashboard-builder/composition";
import {listCreatableDashboardTemplates} from "../src/lib/dashboard-builder/templates";
test("SMN-364 AC1: append empty row at end without forcing template",()=>{
 const original=createDefaultDashboardLayout("scrum");
 const draft=appendDashboardRow(original,"new-row");
 assert.equal(draft.rows.length,original.rows.length+1);
 assert.deepEqual(draft.rows.at(-1),{id:"new-row",blocks:[]});
 assert.equal(original.rows.some(r=>r.id==="new-row"),false);
 validateDashboardLayout(draft);
});
test("SMN-364 AC3/AC4: each model creates exact blank slots with unique stable identities",()=>{
 for(const model of listCreatableDashboardTemplates()){
  const original=createDefaultDashboardLayout("kanban");
  const ids=Array.from({length:model.slotCount},(_,i)=>model.id+"-slot-"+i);
  const result=appendDashboardBlock(original,original.rows[0].id,model.id,{blockId:model.id+"-block",slotIds:ids});
  const block=result.rows[0].blocks.at(-1)!;
  assert.equal(block.templateVersion,model.version);
  assert.deepEqual(block.slots.map(s=>s.templateSlotId),model.slots.map(s=>s.slotId));
  assert.deepEqual(block.slots.map(s=>s.id),ids);
  assert.ok(block.slots.every(s=>!s.source&&!s.view));
  assert.notEqual(result,original);
  assert.equal(original.rows[0].blocks.length+1,result.rows[0].blocks.length);
  validateDashboardLayout(result);
 }
});
test("SMN-364 AC4: unknown rows and duplicate identifiers are rejected",()=>{
 const initial=createDefaultDashboardLayout("scrum");
 assert.throws(()=>appendDashboardBlock(initial,"missing","M01",{blockId:"b",slotIds:["s"]}),/row-not-found/);
 assert.throws(()=>appendDashboardBlock(initial,initial.rows[0].id,"M02",{blockId:"b",slotIds:["s","s"]}),/ids-invalid/);
 assert.throws(()=>appendDashboardRow(initial,initial.rows[0].id),/id-invalid/);
});
test("SMN-364 AC2: gallery is modal and paginated six templates maximum",()=>{
 const gallery=readFileSync(new URL("../src/app/app/dashboard-builder/template-gallery.tsx",import.meta.url),"utf8");
 assert.match(gallery,/PAGE_SIZE=6/);
 assert.match(gallery,/useDashboardModalFocus/);
 assert.match(gallery,/ui\.geometry/);
 assert.match(gallery,/aria-pressed/);
 assert.match(gallery,/listCreatableDashboardTemplates/);
});
test("SMN-364 AC1/AC3: editor adds rows at bottom and does not open source assistant",()=>{
 const editor=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-editor.tsx",import.meta.url),"utf8");
 assert.match(editor,/appendDashboardRow\(current,crypto.randomUUID\(\)\)/);
 assert.match(editor,/appendDashboardBlock\(current,galleryRow,templateId/);
 assert.match(editor,/Ajouter un bloc/);
 assert.match(editor,/Ajouter une ligne/);
 assert.doesNotMatch(editor,/setSourceModalOpen|openSlotWizard/);
});
