import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {describe,it} from "node:test";
import path from "node:path";
import {helpArticleById,helpArticleForContext,helpCatalog} from "../src/lib/help-catalog";
import {helpSetupSteps} from "../src/lib/help-setup";
import {loadHelpContent} from "../src/server/help-content";
import {searchHelp} from "../src/server/help-search";
import {canAccess} from "../src/server/access-policy";

const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const inactive={role:"user",is_active:false,must_change_password:false};
const requireChange={role:"user",is_active:true,must_change_password:true};
const context="/app/admin/kanban-periods";
const helpId="kanban-periods";
const root=path.resolve("content/help");
const readResource=(actor:typeof user)=>canAccess(actor,"read",{type:"collective",exists:true,inScope:true});

describe("AU-01 — access to Kanban help mirrors the read-only business module",()=>{
 it("allows both authorized roles to read the guide only in Kanban mode",()=>{
  for(const actor of [admin,user]){
   assert.equal(readResource(actor),true);
   assert.equal(helpArticleById(helpId,actor,"kanban")?.route,context);
   assert.equal(helpArticleForContext(context,actor,"kanban")?.id,helpId);
   assert.ok(helpCatalog(actor,"kanban").some(article=>article.id===helpId));
   assert.equal(helpArticleById(helpId,actor,"scrum"),null);
   assert.equal(helpArticleById(helpId,actor,null),null);
   assert.equal(helpArticleForContext(context,actor,"scrum"),null);
  }
 });
 it("does not permit an inactive or unverified actor to read a guide",()=>{
  for(const actor of [inactive,requireChange,null,undefined]){
   assert.equal(helpArticleById(helpId,actor,"kanban"),null);
   assert.equal(helpArticleForContext(context,actor,"kanban"),null);
  }
 });
 it("preserves admin-only access to configuration guides and write operations",()=>{
  const settings={type:"settings",exists:true,inScope:true};
  assert.equal(canAccess(user,"read",settings),false);
  assert.equal(canAccess(user,"write",settings),false);
  assert.equal(canAccess(user,"write",{type:"collective",exists:true,inScope:true}),false);
  assert.equal(canAccess(admin,"write",settings),true);
  assert.equal(helpArticleById("general-settings",user,"kanban"),null);
  assert.equal(helpArticleById("jira-settings",user,"kanban"),null);
  assert.equal(helpArticleById("backup",user,"kanban"),null);
  const route=await readFile("src/app/app/admin/kanban-periods/page.tsx","utf8");
  const form=await readFile("src/app/app/admin/kanban-periods/period-form.tsx","utf8");
  assert.match(route,/canAccess\(account,"read",\{type:"collective"/);
  assert.match(route,/KanbanPeriodForm canManage=\{account.role==="admin"\}/);
  assert.match(form,/if\(!computed\|\|!canManage/);
  assert.match(form,/disabled=\{!canManage\|\|busy\}/);
 });
 it("serves localized content to allowed users and rejects Scrum even for admin",async()=>{
  for(const locale of ["fr","en"] as const){
   const allowed=await loadHelpContent(helpId,locale,user,"kanban",root);
   assert.equal(allowed.status,"ready");
   if(allowed.status==="ready"){
    assert.equal(allowed.contentLocale,locale);
    assert.equal(allowed.isFallback,false);
    assert.match(allowed.markdown,/kanban/i);
   }
   assert.equal((await loadHelpContent(helpId,locale,admin,"scrum",root)).status,"forbidden");
   assert.equal((await loadHelpContent("general-settings",locale,user,"kanban",root)).status,"forbidden");
  }
 });
 it("includes Kanban cadence in the user checklist and excludes Scrum cadence",()=>{
  const steps=helpSetupSteps(helpCatalog(user,"kanban"),"kanban");
  const cadence=steps.find(step=>step.id==="cadence");
  assert.equal(cadence?.articleId,helpId);
  assert.equal(cadence?.route,context);
  assert.equal(steps.some(step=>step.articleId==="sprints"),false);
  const scrumSteps=helpSetupSteps(helpCatalog(user,"scrum"),"scrum");
  assert.equal(scrumSteps.find(step=>step.id==="cadence")?.articleId,"sprints");
 });
 it("includes the guide in FR and EN search for Kanban, never for Scrum",async()=>{
  for(const locale of ["fr","en"] as const){
   for(const actor of [admin,user]){
    const search=await searchHelp("kanban",locale,actor,"kanban");
    assert.equal(search.status,"ready");
    assert.ok(search.hits.some(item=>item.id===helpId));
    const scrum=await searchHelp("kanban",locale,actor,"scrum");
    assert.equal(scrum.status,"ready");
    assert.equal(scrum.hits.some(item=>item.id===helpId),false);
   }
  }
 });
});
