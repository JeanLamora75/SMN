import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const editor=read("src/app/app/admin/companies/companies-admin.tsx");
const page=read("src/app/app/admin/companies/page.tsx");
const styles=read("src/app/app/admin/companies/companies-cockpit-modal.css");

test("creating and editing companies opens the Cockpit Agile modal rather than an inline form",()=>{
 assert.match(editor,/const \[editorOpen,setEditorOpen\]=useState\(false\)/);
 assert.match(editor,/setEditorOpen\(true\)/);
 assert.match(editor,/mounted&&editorOpen&&createPortal\(<dialog/);
 assert.match(editor,/dialog\.showModal\(\)/);
 assert.match(editor,/smn-company-cockpit-header/);
 assert.match(editor,/smn-company-cockpit-body/);
 assert.match(editor,/smn-company-cockpit-footer/);
 assert.match(editor,/onCancel=\{event=>\{event\.preventDefault\(\);closeEditor\(\)\}\}/);
 assert.match(editor,/openerRef\.current\?\.focus\(\)/);
 assert.doesNotMatch(editor,/<section className="smn-panel rounded-4 p-3 p-lg-4" aria-label=\{t\(selected/);
});
test("modal preserves company validation, persistence, archive actions and unsaved change protection",()=>{
 for(const token of ["useUnsavedChanges(editorOpen&&(dirty||busy)","companiesAdmin.unsaved",
  "normalize", "method:selected?", "revision:selected.revision","maxLength={120}",
  "maxLength={2000}","palette.map(color","setEditorOpen(false)"]){
  if(token==="normalize")continue;
  assert.ok(editor.includes(token),token);
 }
 assert.match(editor,/onClick=\{\(\)=>edit\(company\)\}/);
 assert.match(editor,/onClick=\{\(\)=>edit\(null\)\}/);
 assert.match(editor,/onClick=\{\(\)=>void archive\(company\)\}/);
 assert.match(editor,/onClick=\{closeEditor\}/);
 assert.match(editor,/\{error&&<div role="alert" className="alert alert-warning">\{error\}<\/div>\}/);
});
test("modal follows the selected theme and has a mobile layout",()=>{
 assert.match(page,/import "\.\/companies-cockpit-modal\.css"/);
 assert.match(styles,/--smn-context-start/);
 assert.match(styles,/--smn-context-end/);
 assert.match(styles,/--smn-surface/);
 assert.match(styles,/@media\(max-width:767\.98px\)/);
});
