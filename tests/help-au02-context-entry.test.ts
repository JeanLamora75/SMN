import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {helpArticleForContext,helpCatalog} from "../src/lib/help-catalog";
import {loadHelpContent} from "../src/server/help-content";
import path from "node:path";

const source=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const entries=[
 {route:"/app/admin/members",id:"members",mode:"scrum",source:"src/app/app/admin/members/team-overview.tsx"},
 {route:"/app/team-calendar",id:"calendar",mode:"scrum",source:"src/app/app/team-calendar/team-calendar-view.tsx"},
 {route:"/app/admin/kanban-periods",id:"kanban-periods",mode:"kanban",source:"src/app/app/admin/kanban-periods/period-form.tsx"}
] as const;

describe("AU-02 — contextual help for Members, Calendar, Kanban periods",()=>{
 it("maps only exact routes to canonical article IDs",()=>{
  const map=source("src/app/app/help/help-header-action.tsx");
  for(const item of entries){
   assert.ok(map.includes(JSON.stringify(item.route)+":"+JSON.stringify(item.id)),item.route);
   assert.equal(helpArticleForContext(item.route,admin,item.mode)?.id,item.id);
   assert.equal(helpArticleForContext(item.route+"/edit",admin,item.mode),null);
   assert.equal(helpArticleForContext(item.route+"?tab=settings",admin,item.mode),null);
  }
  assert.equal(helpArticleForContext("/app/admin/kanban-periods",admin,"scrum"),null);
  assert.equal(helpArticleForContext("/app/admin/members",user,"scrum"),null);
  assert.equal(helpArticleForContext("/app/team-calendar",user,"scrum")?.id,"calendar");
  assert.equal(helpArticleForContext("/app/admin/kanban-periods",user,"kanban")?.id,"kanban-periods");
 });
 it("places a shared non-submitting contextual action in each actual screen header",()=>{
  const members=source(entries[0].source);
  assert.match(members,/import HelpHeaderAction from "\.\.\/\.\.\/help\/help-header-action"/);
  assert.match(members,/<div className="smn-team-hero-actions">\s*<HelpHeaderAction screenTitle=\{t\("teamCockpit.title"\)\}/);
  assert.match(members,/<HelpHeaderAction[^>]*className="btn smn-team-view-button"/);
  const calendar=source(entries[1].source);
  assert.match(calendar,/import HelpHeaderAction from "\.\.\/help\/help-header-action"/);
  assert.match(calendar,/<section className="smn-cal-hero"[\s\S]*?<HelpHeaderAction screenTitle=\{t\("teamCalendar.title"\)\}/);
  assert.match(calendar,/<HelpHeaderAction[^>]*className="btn btn-outline-light/);
  const kanban=source(entries[2].source);
  assert.match(kanban,/import HelpHeaderAction from "\.\.\/\.\.\/help\/help-header-action"/);
  assert.match(kanban,/<h1[^>]*>\{t\("kanbanPeriod.title"\)\}<\/h1>\s*<HelpHeaderAction screenTitle=\{t\("kanbanPeriod.title"\)\}/);
  const dialog=source("src/app/app/help/help-context-button.tsx");
  assert.match(dialog,/<button ref=\{opener\} type="button"/);
  assert.match(dialog,/fetch\("\/api\/help\/articles\/"/);
  assert.match(dialog,/method:"GET"/);
  assert.match(dialog,/competingModal\(\)/);
  assert.match(dialog,/opener\.current\?\.focus\(\)/);
  assert.match(dialog,/href=\{guideHref\} target="_blank"/);
 });
 it("loads the exact pre-existing Markdown for every authorized locale and mode",async()=>{
  for(const item of entries){
   for(const locale of ["fr","en"] as const){
    const result=await loadHelpContent(item.id,locale,admin,item.mode,path.resolve("content/help"));
    assert.equal(result.status,"ready",item.id+"/"+locale);
    if(result.status==="ready"){
     assert.equal(result.contentLocale,locale);
     assert.equal(result.isFallback,false);
     assert.match(result.markdown,/^# /);
    }
   }
  }
  assert.equal((await loadHelpContent("members","fr",user,"scrum",path.resolve("content/help"))).status,"forbidden");
  assert.equal((await loadHelpContent("calendar","en",user,"scrum",path.resolve("content/help"))).status,"ready");
  assert.equal((await loadHelpContent("kanban-periods","en",user,"kanban",path.resolve("content/help"))).status,"ready");
  assert.equal((await loadHelpContent("kanban-periods","en",user,"scrum",path.resolve("content/help"))).status,"forbidden");
 });
 it("does not introduce any new rights, database writes or duplicated user documentation",()=>{
  const map=source("src/app/app/help/help-header-action.tsx");
  assert.doesNotMatch(map,/fetch\(|localStorage|POST|PUT|DELETE|PATCH/);
  for(const item of entries){
   assert.equal(helpCatalog(admin,item.mode).find(a=>a.id===item.id)?.id,item.id);
   assert.equal((source(item.source).match(/<HelpHeaderAction\b/g)||[]).length,1,item.source);
  }
  const kanbanForm=source("src/app/app/admin/kanban-periods/period-form.tsx");
  assert.match(kanbanForm,/if\(!computed\|\|!canManage/);
  assert.match(kanbanForm,/disabled=\{!canManage\|\|busy\}/);
 });
});
