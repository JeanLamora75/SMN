import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {createDefaultDashboardLayout,validateDashboardLayout} from "../src/server/dashboard-builder/layout";
import {prepareDashboardCopy} from "../src/server/dashboard-builder/copy";
test("SMN-372 configuration copied with new ids; foreign cycle references removed",()=>{
 const source=createDefaultDashboardLayout("scrum");
 const slot=source.rows[0].blocks[0].slots[0];
 slot.source="indicator:sample";slot.view="number";
 slot.filters={cycleIdOverride:"source-cycle"};
 const copy=prepareDashboardCopy(source);
 assert.equal(copy.rows[0].blocks[0].slots[0].source,slot.source);
 assert.equal(copy.rows[0].blocks[0].slots[0].view,slot.view);
 assert.equal(copy.rows[0].blocks[0].slots[0].filters?.cycleIdOverride,undefined);
 assert.notEqual(copy.rows[0].blocks[0].id,source.rows[0].blocks[0].id);
 assert.notEqual(copy.rows[0].blocks[0].slots[0].id,slot.id);
 assert.deepEqual(copy.rows.map(r=>r.blocks.map(b=>b.templateId)),source.rows.map(r=>r.blocks.map(b=>b.templateId)));
 validateDashboardLayout(copy);
});
test("SMN-372 server enforces source read, target edit, saved-only and revision check",()=>{
 const body=readFileSync(new URL("../src/server/dashboard-builder/copy.ts",import.meta.url),"utf8");
 for(const token of ['requireDashboardPermission(db,source,"read")','requireDashboardPermission(db,target,"edit")',
 "dashboard-copy-source-not-saved","dashboard-revision-conflict",'FOR UPDATE','COMMIT','ROLLBACK'])
 assert.ok(body.includes(token),token);
});
test("SMN-372 UI warns on draft, previews published version, confirms replacement",()=>{
 const modal=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-copy-modal.tsx",import.meta.url),"utf8");
 const editor=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-editor.tsx",import.meta.url),"utf8");
 assert.match(modal,/Votre brouillon contient des modifications non enregistrées/);
 assert.match(modal,/Je confirme le remplacement/);
 assert.match(modal,/Aperçu — dernière disposition enregistrée/);
 assert.match(editor,/layout=\{published\}/);
 assert.match(editor,/unsaved=\{changed\}/);
});
