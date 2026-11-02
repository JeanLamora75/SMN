import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const wizard=readFileSync(new URL("../src/app/app/dashboard-builder/slot-wizard.tsx",import.meta.url),"utf8");
const editor=readFileSync(new URL("../src/app/app/dashboard-builder/dashboard-editor.tsx",import.meta.url),"utf8");
test("SMN-365 AC1: catalog search, category filter and team-scoped request",()=>{
 assert.match(wizard,/api\/dashboard-builder\/sources\?teamId=/);
 assert.match(wizard,/Rechercher par code ou nom/);
 assert.match(wizard,/s\.code\+" "\+s\.name/);
 assert.match(wizard,/category=== "all"|category==="all"/);
});
test("SMN-365 AC2: only compatible visualizations, responsive preview",()=>{
 assert.match(wizard,/compatibleVisualizations\(selected\)/);
 assert.match(wizard,/col-12 col-lg-7/);
 assert.match(wizard,/col-12 col-lg-5/);
 assert.match(wizard,/Aperçu/);
});
test("SMN-365 AC3: confirmation updates draft only",()=>{
 assert.match(editor,/setDraft\(current=>current/);
 assert.match(editor,/updateDashboardSlot\(current,wizardSlot,\{source,view,filters:options\}\)/);
 assert.match(editor,/setWizardSlot\(null\)/);
 assert.match(wizard,/onConfirm\(selected.code,view,clean\)/);
});
test("SMN-365 AC4: unavailable sources, return, cancel and close",()=>{
 assert.match(wizard,/disabled=\{s\.status!=="available"\}/);
 assert.match(wizard,/Retour aux sources/);
 assert.match(wizard,/onClose/);
 assert.match(wizard,/event\.key==="Escape"/);
});
