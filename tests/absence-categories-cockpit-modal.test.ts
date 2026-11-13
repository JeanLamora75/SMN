import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import fr from "../src/i18n/fr.json";
import en from "../src/i18n/en.json";

const read=(name:string)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const page=read("src/app/app/admin/absence-categories/page.tsx");
const button=read("src/app/app/admin/absence-categories/absence-category-create-button.tsx");
const editor=read("src/app/app/admin/absence-categories/absence-categories-admin.tsx");
const css=read("src/app/app/admin/absence-categories/absence-category-cockpit.css");

test("Add category action is in settings hero and opens the editor",()=>{
 assert.match(page,/action=\{<AbsenceCategoryCreateButton\/>\}/);
 assert.match(button,/dispatchEvent\(new Event\(OPEN_ABSENCE_CATEGORY\)\)/);
 assert.match(editor,/window\.addEventListener\(OPEN_ABSENCE_CATEGORY,newCategory\)/);
 assert.match(editor,/setEditorOpen\(true\)/);
});
test("both create and edit use a native theme-aware dialog, not an inline form",()=>{
 assert.match(editor,/createPortal\(<dialog ref=\{dialogRef\}/);
 assert.match(editor,/dialog\.showModal\(\)/);
 assert.match(editor,/onCancel=\{event=>\{event\.preventDefault\(\);closeEditor\(\);\}\}/);
 assert.match(editor,/onClick=\{\(\)=>edit\(category\)\}/);
 assert.match(editor,/smn-absence-category-header/);
 assert.match(editor,/smn-absence-category-footer/);
 assert.doesNotMatch(editor,/d-grid gap-3 border-top pt-3/);
 assert.match(editor,/openerRef\.current\?\.focus\(\)/);
 assert.match(editor,/window\.confirm\(t\("draft\.discardWarning"\)\)/);
});
test("colour picker, category persistence, deactivation, historical protection and errors remain",()=>{
 for(const needle of ['method:"POST"','action:"update"','action:"create"','updatedAt:draft.updatedAt',
  'type="color"','pattern="#[a-fA-F0-9]{6}"','checked={draft.isActive}',
  'absenceCategories.usedHint','absenceCategories.noDelete',
  'notice&&isError&&<p role="alert"']){
  assert.ok(editor.includes(needle),needle);
 }
 assert.match(editor,/setEditorOpen\(false\)/);
 assert.match(editor,/useUnsavedChanges\(editorOpen&&\(dirty\|\|busy\)/);
});
test("Cockpit Agile colours follow theme and close label is localized",()=>{
 assert.match(page,/import "\.\/absence-category-cockpit\.css"/);
 assert.match(css,/--smn-context-start/);
 assert.match(css,/--smn-context-end/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.equal(en.absenceCategories.cancel,"Cancel");
 assert.equal(fr.absenceCategories.cancel,"Annuler");
});
