import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(name:string)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const editor=read("src/app/app/admin/links/link-editor.tsx");
const dialog=read("src/app/app/admin/links/link-dialog.tsx");
const css=read("src/app/app/admin/links/links-cockpit.css");

test("link creation and editing both use Cockpit Agile modal presentation",()=>{
 assert.match(editor,/locked=\{pending\} large cockpit/);
 assert.match(editor,/smn-links-modal-header/);
 assert.match(editor,/smn-links-modal-body/);
 assert.match(editor,/smn-links-modal-footer/);
 assert.match(editor,/aria-label=\{t\("links.cancel"\)\}/);
 assert.match(dialog,/cockpit\?" smn-links-cockpit-dialog":""/);
 assert.match(dialog,/aria-modal="true"/);
 assert.match(dialog,/if\(event\.key==="Escape"\)/);
 assert.match(dialog,/previous\?\.focus\(\)/);
});
test("modal header follows current theme without hard-coded blue",()=>{
 const header=css.match(/\.smn-links-cockpit-dialog \.smn-links-modal-header\{[^}]+\}/)?.[0]??"";
 assert.match(header,/var\(--smn-brand/);
 assert.match(header,/color-mix/);
 assert.doesNotMatch(header,/#10294d|#194b80|#1b508d/);
 assert.match(css,/\.smn-links-cockpit-dialog \.modal-content\{/);
 assert.match(css,/\.smn-links-cockpit-dialog \.smn-links-modal-body/);
 assert.match(css,/@media\(max-width:650px\)/);
});
test("link form retains validation and persistence behaviors",()=>{
 for(const preserved of ["normalizeLink(","confirmScopeRequired","method:item?","revision:item.revision","required maxLength={200}","type=\"url\" required maxLength={2048}","maxLength={4000}","onSaved()"])
  assert.ok(editor.includes(preserved),preserved);
});
