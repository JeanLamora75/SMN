import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const page=read("src/app/app/admin/absence-categories/page.tsx");
const editor=read("src/app/app/admin/absence-categories/absence-categories-admin.tsx");
const action=read("src/app/app/admin/absence-categories/absence-category-create-button.tsx");
const css=read("src/app/app/admin/absence-categories/absence-category-cockpit.css");
test("Add category is a contextual hero action wired to the editor",()=>{
 assert.match(page,/action=\{<AbsenceCategoryCreateButton\/>\}/);
 assert.match(action,/dispatchEvent\(new Event\(OPEN_ABSENCE_CATEGORY\)\)/);
 assert.match(editor,/addEventListener\(OPEN_ABSENCE_CATEGORY,newCategory\)/);
 assert.doesNotMatch(page,/import AddCategoryButton/);
});
test("create and edit use one accessible Cockpit Agile dialog",()=>{
 assert.match(editor,/createPortal\(<dialog/);
 assert.match(editor,/dialog\.showModal\(\)/);
 assert.match(editor,/smn-absence-category-header/);
 assert.match(editor,/smn-absence-category-form/);
 assert.match(editor,/smn-absence-category-footer/);
 assert.match(editor,/onCancel=\{event=>\{event\.preventDefault\(\);closeEditor\(\);\}\}/);
 assert.match(editor,/onClick=\{\(\)=>edit\(category\)\}/);
 assert.match(editor,/onClick=\{closeEditor\}/);
 assert.match(editor,/dirty&&!window\.confirm\(t\("draft\.discardWarning"\)\)/);
 assert.doesNotMatch(editor,/<form className="d-grid gap-3 border-top pt-3"/);
});
test("existing fields and saving behavior are preserved",()=>{
 for(const field of ["absence-category-name","absence-category-color","absence-category-picker","isActive",
  "updatedAt:draft.updatedAt","usageCount","/api/admin/absence-categories"]){
  assert.ok(editor.includes(field),field);
 }
 assert.match(css,/--smn-context-start/);
 assert.match(css,/--smn-context-end/);
 assert.match(css,/@media\(max-width:650px\)/);
});
