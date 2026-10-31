import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=(name:string)=>readFileSync(new URL("../src/app/app/admin/registries/"+name,import.meta.url),"utf8");
test("cycle panel uses same collapsible shell as other sections",()=>{
 const create=source("registry-create.tsx");
 assert.match(create,/<details className="smn-registry-fold"><summary>\{t\("registryCycles.heading"\)\}<\/summary>/);
 assert.match(create,/<RegistryCycles embedded/);
});
test("edit modal title includes persisted record type, icon and localized category",()=>{
 const modal=source("registry-edit-modal.tsx");
 assert.match(modal,/BootstrapIcon name=\{icons\[identity.type\]\}/);
 assert.match(modal,/identity.title/);
 assert.match(modal,/registryCreate\./);
 const dialog=source("registry-section-dialog.tsx");
 assert.match(dialog,/title:ReactNode/);
});
