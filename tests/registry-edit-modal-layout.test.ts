import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("edit form orders date, due, status then full-width title owner description comment",()=>{
 const s=source("src/app/app/admin/registries/registry-create.tsx");
 const indexes=["registry-date","registry-due","registry-status","registry-title","registry-owner","registry-description","registry-comment"].map(x=>s.indexOf('htmlFor="'+x+'"'));
 assert(indexes.every(i=>i>=0));assert.deepEqual(indexes,[...indexes].sort((a,b)=>a-b));
 assert.match(s,/id=\{modalMode&&itemId\?"registry-main-edit":undefined\}/);
});
test("edit modal footer places Save before Cancel and hides inline submit",()=>{
 const editor=source("src/app/app/admin/registries/registry-edit-modal.tsx");
 const dialog=source("src/app/app/admin/registries/registry-section-dialog.tsx");
 assert.match(editor,/submitFormId="registry-main-edit"/);
 assert(dialog.indexOf('form={submitFormId}')<dialog.indexOf('onClick={close}',dialog.indexOf('<footer')));
});
test("registry advanced sections are independently collapsible",()=>{
 const component=source("src/app/app/admin/registries/registry-create.tsx");
 for(const heading of ["Relations entre fiches et objectifs","Classification ROAM","Évaluation du risque","Créer un obstacle à partir du risque"])
  assert(component.includes('<details className="smn-registry-fold"><summary>'+heading+'</summary>'));
 const css=source("src/app/app/admin/registries/registry-cockpit.css");
 assert.match(css,/\.smn-registry-fold\[open\]/);
});
