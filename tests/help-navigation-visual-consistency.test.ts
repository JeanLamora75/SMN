import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {describe,it} from "node:test";
import path from "node:path";
import {privateNavigation} from "../src/lib/private-navigation";
import {helpCatalog,helpArticleForContext} from "../src/lib/help-catalog";
import {loadHelpContent} from "../src/server/help-content";

const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const root=path.resolve("content/help");
const file=(p:string)=>readFile(p,"utf8");

describe("UX — contextual Help on every primary navigation screen",()=>{
 it("maps all primary sidebar destinations to a dedicated authorized guide",()=>{
  for(const role of ["admin","user"] as const){
   for(const mode of ["scrum","kanban"] as const){
    const nav=privateNavigation(mode,role,role==="admin");
    const items=nav.flatMap(group=>group.entries).filter(entry=>entry.href&&entry.id!=="help"&&entry.id!=="settings");
    for(const entry of items){
     const route=entry.href!;
     const article=helpArticleForContext(route,role==="admin"?admin:user,mode);
     assert.ok(article,role+"/"+mode+"/"+route+" has no contextual article");
    }
   }
  }
  assert.equal(helpArticleForContext("/app",user,"scrum")?.id,"dashboard");
  assert.equal(helpArticleForContext("/app/dashboard-builder",user,"kanban")?.id,"dashboard");
  assert.equal(helpArticleForContext("/app/admin/indicators",admin,"kanban")?.id,"indicators");
  assert.equal(helpArticleForContext("/app/admin/links",admin,"scrum")?.id,"links");
  assert.equal(helpArticleForContext("/app/admin/links",user,"scrum"),null);
  assert.equal(helpArticleForContext("/app/admin/settings/links",admin,"scrum")?.id,"links");
 });
 it("places Help in the actual dashboard, dashboard builder and links headers",async()=>{
  const [main,cycle,builder,editor,linksPage,links,indicators,map]=await Promise.all([
   file("src/app/app/page.tsx"),file("src/app/app/cycle-overview.tsx"),
   file("src/app/app/dashboard-builder/page.tsx"),file("src/app/app/dashboard-builder/dashboard-editor.tsx"),
   file("src/app/app/admin/links/page.tsx"),file("src/app/app/admin/links/links-cockpit.tsx"),
   file("src/app/app/admin/indicators/page.tsx"),file("src/app/app/help/help-header-action.tsx")
  ]);
  assert.match(main,/<CycleOverview/);
  assert.match(cycle,/<header className="smn-cycle-overview-header[\s\S]*?<HelpHeaderAction/);
  assert.match(builder,/<DashboardEditor/);
  assert.match(editor,/headerActions=\{<div[^>]*><HelpHeaderAction/);
  assert.match(editor,/\{editing&&<div[^>]*>\s*<HelpHeaderAction/);
  assert.match(linksPage,/<LinksCockpit/);
  assert.match(links,/<header className="smn-links-hero">[\s\S]*?<HelpHeaderAction/);
  assert.match(indicators,/<header className="smn-sprint-detail-hero[\s\S]*?<HelpHeaderAction/);
  for(const [route,id] of [["/app","dashboard"],["/app/dashboard-builder","dashboard"],["/app/admin/links","links"],["/app/admin/settings/links","links"],["/app/admin/indicators","indicators"]]){
   assert.ok(map.includes(JSON.stringify(route)+":"+JSON.stringify(id)),route);
  }
 });
 it("makes every contextual button opaque white, including callers with transparent/outline classes",async()=>{
  const [button,css,settings,calendar,members]=await Promise.all([
   file("src/app/app/help/help-context-button.tsx"),
   file("src/app/app/help/help-dialog.css"),
   file("src/app/app/admin/settings/settings-page-shell.css"),
   file("src/app/app/team-calendar/team-calendar-view.tsx"),
   file("src/app/app/admin/members/team-overview.tsx")
  ]);
  assert.match(button,/\+" smn-help-header-button"/);
  assert.match(button,/<button ref=\{opener\} type="button"/);
  assert.match(css,/button\.smn-help-header-button/);
  assert.match(css,/background-color:#fff!important/);
  assert.match(css,/color:#10294d!important/);
  assert.match(css,/focus-visible/);
  assert.match(settings,/background:rgba\(255,255,255,\.12\)/);
  assert.match(calendar,/btn-outline-light/);
  assert.match(members,/smn-team-view-button/);
  assert.match(css,/smn-settings-detail-hero-action button\.smn-help-header-button/);
 });
 it("serves Dashboard and Links help in both locales, restricted to correct roles",async()=>{
  for(const locale of ["fr","en"] as const){
   for(const mode of ["scrum","kanban"] as const){
    const board=await loadHelpContent("dashboard",locale,user,mode,root);
    assert.equal(board.status,"ready");
    if(board.status==="ready"){assert.equal(board.contentLocale,locale);assert.equal(board.isFallback,false)}
    const links=await loadHelpContent("links",locale,admin,mode,root);
    assert.equal(links.status,"ready");
    if(links.status==="ready"){assert.equal(links.contentLocale,locale);assert.equal(links.isFallback,false)}
    assert.equal((await loadHelpContent("links",locale,user,mode,root)).status,"forbidden");
   }
  }
  const ids=new Set(helpCatalog(admin,"scrum").concat(helpCatalog(admin,"kanban")).map(a=>a.id));
  assert.equal(ids.size,16);
 });
});
