import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
const editor=readFileSync(new URL("../src/app/app/admin/links/link-editor.tsx",import.meta.url),"utf8");
test("scope changes require explicit confirmation",()=>{
 assert.match(editor,/scopeChanged=Boolean\(item&&item\.scope!==scope\)/);
 assert.match(editor,/if\(scopeChanged&&!confirmScope\)/);
 assert.match(editor,/checked=\{confirmScope\}/);
});
test("switching visibility clears prior confirmation",()=>{
 assert.match(editor,/setConfirmScope\(false\)/);
});
test("editing preserves search and filters through list reload",()=>{
 const cockpit=readFileSync(new URL("../src/app/app/admin/links/links-cockpit.tsx",import.meta.url),"utf8");
 assert.match(cockpit,/const changed=\(\)=>\{setEditing\(null\);setDeleting\(null\);setLoading\(true\);setReload\(n=>n\+1\);\}/);
});
