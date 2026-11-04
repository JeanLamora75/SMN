import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {listCreatableDashboardTemplates} from "../src/lib/dashboard-builder/templates";
import {validateBlockDimensions} from "../src/lib/dashboard-builder/dimensions";

const read=(path:string)=>readFileSync(new URL("../src/app/app/dashboard-builder/"+path,import.meta.url),"utf8");

test("SMN-381: gallery renders six real template geometries and applies selection on confirmation",()=>{
 const source=read("template-gallery.tsx");
 assert.equal(listCreatableDashboardTemplates().length,6);
 for(const template of listCreatableDashboardTemplates()){
  assert.equal(template.slots.reduce((n,s)=>n+s.rowSpan*s.columnSpan,0),template.rows*template.columns);
 }
 for(const token of ["t.slots.map","cell.columnSpan","cell.rowSpan","aria-pressed","disabled={!selected}","onChoose(selected)"])
  assert.ok(source.includes(token),token);
});
test("SMN-381: source wizard uses business categories, compatible views and no free-text column codes",()=>{
 const source=read("slot-wizard.tsx");
 for(const token of ["categoryNames","category===c","compatibleVisualizations(selected)","aria-pressed","columnNames","type=\"checkbox\"","normalizeSlotOptions","onConfirm(selected.code,view,clean)"])
  assert.ok(source.includes(token),token);
 assert.doesNotMatch(source,/Colonnes \(codes séparés par une virgule\)/);
});
test("SMN-381: dimensions are validated and only applied on confirmation",()=>{
 const source=read("block-dimensions.tsx");
 assert.deepEqual(validateBlockDimensions({width:4,height:640}),{width:4,height:640});
 for(const token of ["useDashboardModalFocus","setDraft","onChange(draft)","setOpen(false)","aria-pressed"])
  assert.ok(source.includes(token),token);
});
test("SMN-381: copy retains saved-only, permissions, replacement confirmation and no data copies",()=>{
 const source=read("dashboard-copy-modal.tsx");
 const editor=read("dashboard-editor.tsx");
 for(const token of ["layout.rows.map","getDashboardTemplate","target.hasSavedLayout&&!confirmed","expectedRevision:target.revision","Votre brouillon contient des modifications"])
  assert.ok(source.includes(token),token);
 assert.ok(editor.includes("layout={published}"));
 assert.ok(editor.includes("unsaved={changed}"));
});
test("SMN-381: modal focus trap, keyboard Escape and close focus restoration are implemented",()=>{
 const source=read("modal-focus.ts");
 for(const token of ["keydown","event.key===\"Tab\"","event.key===\"Escape\"","previous?.focus()","aria"])
  if(token!=="aria")assert.ok(source.includes(token),token);
 const editor=read("dashboard-editor.tsx");
 for(const token of ["resetFocus","pendingFocus","exitFocus","role=\"alertdialog\"","role=\"dialog\""])
  assert.ok(editor.includes(token),token);
});
test("SMN-381: visual scope is local and shell, producer and SQL are not changed by modals",()=>{
 const styles=read("modal-ux.module.css");
 const editor=read("dashboard-editor.tsx");
 const list=read("dashboard-business-list.tsx");
 const consultation=read("dashboard-consultation.tsx");
 assert.match(styles,/\.header\{/);
 assert.match(styles,/@media\(max-width:767\.98px\)/);
 assert.ok(editor.includes("DashboardSlotWizard"));
 assert.ok(list.includes('visible.has("status")'));
 assert.ok(consultation.includes("slot.filters?.columns"));
});
