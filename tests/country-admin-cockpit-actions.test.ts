import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const page=read("src/app/app/admin/countries/page.tsx");
const admin=read("src/app/app/admin/countries/country-admin.tsx");
const form=read("src/app/app/admin/countries/country-form-modal.tsx");
const menu=read("src/app/app/admin/countries/country-actions-menu.tsx");
const css=read("src/app/app/admin/countries/country-cockpit.css");
test("Add country and rename use a portal-based Cockpit Agile dialog",()=>{
 assert.match(admin,/setForm\(\{mode:"create"\}\)/);
 assert.match(admin,/<CountryFormModal/);
 assert.match(form,/createPortal\(<dialog/);
 assert.match(form,/dialog\.current/);
 assert.match(form,/element\.showModal\(\)/);
 assert.match(form,/\},\[mounted\]\)/);
 for(const n of ["smn-country-editor-header","smn-country-editor-body","smn-country-editor-footer"]){
  assert.ok(form.includes(n));assert.ok(css.includes(n));
 }
 assert.match(form,/method:mode==="create"\?"POST":"PATCH"/);
 assert.match(form,/onSaved\(\{mode,code:normalizedCode\}\)/);
 assert.match(page,/import "\.\/country-cockpit\.css"/);
});
test("ellipsis menu uses floating overlay instead of expanding the row",()=>{
 assert.doesNotMatch(admin,/<details className="d-inline-block align-middle text-start"/);
 assert.match(admin,/<CountryActionsMenu/);
 assert.match(menu,/createPortal\(<div ref=\{menu\} role="menu"/);
 assert.match(menu,/position:"fixed"/);
 assert.match(menu,/onRename\(\)/);
 assert.match(menu,/onLifecycle\(\)/);
 assert.match(menu,/Escape/);
 assert.match(menu,/window\.addEventListener\("scroll",onScroll,true\)/);
 assert.match(css,/\.smn-country-actions-menu/);
});
test("Cockpit presentation uses active palette",()=>{
 assert.match(css,/--smn-context-start/);
 assert.match(css,/--smn-context-end/);
 assert.match(css,/@media\(max-width:600px\)/);
});
