import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const row=read("src/app/app/admin/sprints/[sprintId]/sprint-register-row.tsx");
const action=read("src/app/app/admin/registries/registry-delete-action.tsx");
const api=read("src/app/api/admin/registries/[id]/route.ts");
const css=read("src/app/app/admin/sprints/[sprintId]/sprint-detail-cockpit.css");

test("Sprint registers show deletion next to editing only for persisted editable records",()=>{
 assert.match(row,/const hasPersistedRecord=!historical&&href===recordHref/);
 assert.match(row,/const writable=hasPersistedRecord&&canManage/);
 const editor=row.indexOf('<BootstrapIcon name="pencil-square"/>');
 const remove=row.indexOf('<RegistryDeleteAction');
 assert.ok(editor!==-1&&remove>editor);
 assert.match(row,/\{writable&&<RegistryDeleteAction/);
 assert.match(row,/onDeleted=\{\(\)=>router\.refresh\(\)\}/);
 assert.match(row,/iconOnly className="smn-sprint-register-edit smn-sprint-register-delete"/);
 assert.match(css,/\.smn-sprint-register-action\{[^}]*display:flex/);
 assert.match(css,/\.smn-sprint-register-delete\{/);
});

test("permanent deletion reuses authorized revision-checked endpoint and user confirmation",()=>{
 assert.match(action,/window\.confirm\(tr\("confirm"/);
 assert.match(action,/method:"DELETE"/);
 assert.match(action,/JSON\.stringify\(\{teamId,revision\}\)/);
 assert.match(action,/iconOnly\?<BootstrapIcon name="trash-fill"\/>/);
 assert.match(action,/aria-label=\{tr\("button"\)\+" : "\+title\}/);
 assert.match(action,/setError\(tr\(key\)/);
 assert.match(api,/authorizeApi\(req,"write",\{type:"settings"/);
 assert.match(api,/deleteRegistryItem\(db,id,body\.teamId as string,body\.revision as number\)/);
});
