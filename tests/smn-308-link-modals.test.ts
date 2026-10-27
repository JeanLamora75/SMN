import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const read=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
test("create/edit and delete use the shared modal shell",()=>{
 const editor=read("src/app/app/admin/links/link-editor.tsx");
 const cockpit=read("src/app/app/admin/links/links-cockpit.tsx");
 assert.match(editor,/<LinkDialog titleId=/);
 assert.match(cockpit,/<LinkDialog titleId="smn-links-delete-title"/);
});
test("modal traps tab focus and restores triggering element",()=>{
 const dialog=read("src/app/app/admin/links/link-dialog.tsx");
 assert.match(dialog,/event\.key==="Tab"/);
 assert.match(dialog,/last\.focus\(\)/);
 assert.match(dialog,/first\.focus\(\)/);
 assert.match(dialog,/previous\?\.focus\(\)/);
 assert.match(dialog,/document\.body\.style\.overflow/);
});
test("write pending state blocks Escape closing",()=>{
 const dialog=read("src/app/app/admin/links/link-dialog.tsx");
 assert.match(dialog,/if\(!locked\)closeRef\.current\(\)/);
});

test("portal does not access document.body during the server render",()=>{
 const dialog=read("src/app/app/admin/links/link-dialog.tsx");
 assert.match(dialog,/if\(!mounted\)return null/);
 assert.match(dialog,/queueMicrotask\(\(\)=>setMounted\(true\)\)/);
});
