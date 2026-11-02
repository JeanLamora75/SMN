import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const editor=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-editor.tsx",import.meta.url),"utf8");
const page=readFileSync(new URL("../src/app/app/dashboard-builder/page.tsx",import.meta.url),"utf8");
test("SMN-363 AC1: draft is distinct and personalization requires edit permission",()=>{
 assert.match(editor,/setDraft\(copy\(published\)\)/);
 assert.match(editor,/if\(!canEdit\)return/);
 assert.match(editor,/Actions du tableau de bord/);
 assert.match(editor,/Personnaliser/);
 assert.match(page,/dashboardPermission\(db/);
 assert.match(page,/canEdit=\{data.canEdit\}/);
});
test("SMN-363 AC2: explicit optimistic save, unchanged state disables action",()=>{
 assert.match(editor,/expectedRevision:revision/);
 assert.match(editor,/method:"PUT"/);
 assert.match(editor,/disabled=\{!changed\|\|saving\}/);
 assert.match(editor,/position-fixed bottom-0/);
 assert.match(editor,/Aucune modification/);
});
test("SMN-363 AC3: all three exit outcomes available",()=>{
 assert.match(editor,/Enregistrer et quitter/);
 assert.match(editor,/Quitter sans enregistrer/);
 assert.match(editor,/Continuer la personnalisation/);
 assert.match(editor,/setDraft\(null\)/);
});
test("SMN-363 AC4: conflict/network errors keep draft and navigation disabled",()=>{
 assert.match(editor,/response.status===409/);
 assert.match(editor,/Votre brouillon est conservé/);
 assert.match(editor,/personalizing=\{editing\}/);
 const consultation=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-consultation.tsx",import.meta.url),"utf8");
 assert.match(consultation,/navigation.previous&&!personalizing/);
 assert.match(consultation,/navigation.next&&!personalizing/);
});

test("Dashboard Builder: slot displays business source labels without leaking UUIDs",()=>{
 assert.match(editor,/fetch\("\/api\/dashboard-builder\/sources\?"/);
 assert.match(editor,/sourceByCode\.get\(slot\.source\)\?\.name/);
 assert.match(editor,/Source introuvable/);
 assert.doesNotMatch(editor,/["\u0027]✎ ["\u0027]\+slot\.source/);
 assert.match(editor,/updateDashboardSlot\(current,wizardSlot,\{source,view,filters:options\}\)/);
});
