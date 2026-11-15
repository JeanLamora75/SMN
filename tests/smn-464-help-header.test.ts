import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {helpArticleForContext} from "../src/lib/help-catalog";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const action=source("src/app/app/help/help-header-action.tsx");
const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};

describe("SMN-464 — contextual help header integration",()=>{
 it("maps only known page paths to stable article IDs",()=>{
  for(const [route,id,mode] of [
   ["/app/admin/settings","general-settings","scrum"],
   ["/app/admin/settings/teams","teams","scrum"],
   ["/app/admin/settings/jira","jira-settings","scrum"],
   ["/app/admin/settings/maintenance","maintenance-settings","scrum"],
   ["/app/admin/sprints","sprints","scrum"],
   ["/app/tickets","tickets","kanban"],
   ["/app/reports","reports","scrum"]
  ] as const){
   assert.ok(action.includes(JSON.stringify(route)+":"+JSON.stringify(id)));
   assert.equal(helpArticleForContext(route,admin,mode)?.id,id);
  }
  assert.equal(helpArticleForContext("/app/admin/sprints",admin,"kanban"),null);
  assert.equal(helpArticleForContext("/app/admin/settings",user,"scrum"),null);
  assert.doesNotMatch(action,/startsWith\(|includes\(pathname\)/);
 });
 it("places the secondary help action in every priority header",()=>{
  for(const path of [
   "src/app/app/admin/settings/page.tsx",
   "src/app/app/admin/settings/settings-page-shell.tsx",
   "src/app/app/tickets/tickets-files.tsx",
   "src/app/app/reports/page.tsx",
   "src/app/app/admin/sprints/sprint-index-view.tsx"
  ]) assert.match(source(path),/<HelpHeaderAction screenTitle=/,path);
 });
 it("does not submit or mutate an existing screen form",()=>{
  const button=source("src/app/app/help/help-context-button.tsx");
  assert.match(button,/type="button"/);
  assert.match(button,/method:"GET"/);
  assert.match(button,/competingModal\(\)/);
  assert.match(button,/launchButton\?\.focus\(\)/);
  assert.doesNotMatch(action,/fetch\(|localStorage|sessionStorage/);
 });
});
