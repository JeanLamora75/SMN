import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {
 HELP_SETUP_STORAGE_KEY,helpSetupStepIds,parseHelpSetupProgress,
 serializeHelpSetupProgress,helpSetupSteps,helpSetupDoneCount
} from "../src/lib/help-setup";
import {helpCatalog} from "../src/lib/help-catalog";
const admin={role:"admin",is_active:true,must_change_password:false};
const member={role:"user",is_active:true,must_change_password:false};
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

describe("SMN-465 — progression locale sans base",()=>{
 it("uses a dedicated versioned storage key with bounded step IDs",()=>{
  assert.equal(HELP_SETUP_STORAGE_KEY,"smn.help.setup.v1");
  assert.equal(new Set(helpSetupStepIds).size,helpSetupStepIds.length);
  assert.deepEqual(parseHelpSetupProgress(null),{});
  assert.deepEqual(parseHelpSetupProgress("not-json"),{});
  assert.deepEqual(parseHelpSetupProgress('{"version":2,"steps":{"team":"done"}}'),{});
  assert.deepEqual(parseHelpSetupProgress('{"version":1,"steps":{"unknown":"done"}}'),{});
  assert.deepEqual(parseHelpSetupProgress('{"version":1,"steps":{"team":"complete"}}'),{});
  assert.deepEqual(parseHelpSetupProgress('{"version":1,"steps":{"team":"done"}}'),{team:"done"});
 });
 it("preserves only known states and never stores personal or business data",()=>{
  const source={team:"done" as const,tickets:"in_progress" as const};
  const serialized=serializeHelpSetupProgress(source);
  assert.deepEqual(parseHelpSetupProgress(serialized),source);
  assert.deepEqual(JSON.parse(serialized),{version:1,steps:source});
  assert.doesNotMatch(serialized,/accountId|teamId|memberName|password|email/);
 });
 it("counts only applicable steps and never counts a merely visited page",()=>{
  const scrum=helpSetupSteps(helpCatalog(admin,"scrum"),"scrum");
  const kanban=helpSetupSteps(helpCatalog(admin,"kanban"),"kanban");
  const limited=helpSetupSteps(helpCatalog(member,"scrum"),"scrum");
  assert.ok(scrum.some(step=>step.articleId==="sprints"));
  assert.ok(kanban.some(step=>step.articleId==="kanban-periods"));
  assert.ok(!kanban.some(step=>step.articleId==="sprints"));
  assert.ok(!limited.some(step=>step.articleId==="teams"));
  assert.ok(limited.length<scrum.length);
  assert.equal(helpSetupDoneCount({},scrum),0);
  assert.equal(helpSetupDoneCount({team:"done",tickets:"in_progress"},scrum),1);
  assert.equal(helpSetupDoneCount({team:"done"},limited),0);
 });
 it("only saves after explicit clicks and never calls a write API",()=>{
  const component=read("src/app/app/help/help-setup-checklist.tsx");
  assert.match(component,/window\.localStorage\.getItem\(HELP_SETUP_STORAGE_KEY\)/);
  assert.match(component,/window\.localStorage\.setItem\(HELP_SETUP_STORAGE_KEY,serializeHelpSetupProgress\(next\)\)/);
  assert.match(component,/setProgress\(next\);/);
  assert.match(component,/catch\{\s*setError\(true\);/);
  assert.match(component,/onClick=\{\(\)=>change\(step\.id,"done"\)\}/);
  assert.doesNotMatch(component,/fetch\(|method:"POST"|method:"PUT"|method:"DELETE"|indexedDB/);
  const page=read("src/app/app/help/page.tsx");
  assert.match(page,/<HelpSetupChecklist steps=\{setupSteps\}\/>/);
 });
 it("keeps translated onboarding copy outside the global i18n catalogs",()=>{
  const copy=read("src/app/app/help/help-setup-copy.ts");
  assert.match(copy,/fr:\{/);
  assert.match(copy,/en:\{/);
  assert.match(copy,/sauvegardes SMN/);
  assert.match(copy,/SMN backups/);
 });
});
