import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Création : brouillon calculé depuis les valeurs initiales, sans faux dirty capture",()=>{
 const ui=read("src/app/app/admin/registries/registry-create-modal.tsx");
 assert.match(ui,/const dirty=type!==initialType\|\|title!==""/);
 assert.match(ui,/occurredOn!==initialDate\.current/);
 assert.doesNotMatch(ui,/setDirty\(true\)/);
 assert.match(ui,/if\(dirty&&!window\.confirm/);
});
test("Modale section : changements programmatiques ignorés",()=>{
 const ui=read("src/app/app/admin/registries/registry-section-dialog.tsx");
 assert.match(ui,/event\.nativeEvent\.isTrusted/);
});
