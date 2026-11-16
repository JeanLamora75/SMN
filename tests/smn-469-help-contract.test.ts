import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {describe,it} from "node:test";
import path from "node:path";
import {helpCatalog,helpArticleById} from "../src/lib/help-catalog";
import {helpSetupSteps,parseHelpSetupProgress,serializeHelpSetupProgress,helpSetupDoneCount} from "../src/lib/help-setup";
import {loadHelpContent} from "../src/server/help-content";
import {searchHelp} from "../src/server/help-search";
import {verifyOfflineHelp} from "../scripts/windows/verify-offline-help.mjs";

const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const root=path.resolve("content/help");
const source=(file:string)=>readFile(path.resolve(file),"utf8");

describe("SMN-469 — contract and security of the Help module",()=>{
 it("enforces restricted docs for user, admin and both Agile modes",async()=>{
  for(const mode of ["scrum","kanban"] as const){
   const all=helpCatalog(admin,mode);
   const restricted=helpCatalog(user,mode);
   assert.ok(all.length>restricted.length);
   assert.ok(restricted.every(a=>all.some(b=>b.id===a.id)));
   for(const article of all){
    const loaded=await loadHelpContent(article.id,"fr",admin,mode,root);
    assert.equal(loaded.status,"ready",mode+"/"+article.id);
   }
   for(const article of all.filter(a=>!restricted.some(b=>b.id===a.id))){
    assert.equal((await loadHelpContent(article.id,"fr",user,mode,root)).status,
     "forbidden",mode+"/"+article.id);
   }
  }
  assert.equal(helpArticleById("sprints",admin,"kanban"),null);
  assert.equal(helpArticleById("kanban-periods",admin,"scrum"),null);
 });
 it("reads only approved help documentation with no write handlers or mutation requests",async()=>{
  const sources=[
   "src/app/app/help/page.tsx",
   "src/app/app/help/help-context-button.tsx",
   "src/app/app/help/help-setup-checklist.tsx",
   "src/app/api/help/articles/[articleId]/route.ts",
   "src/server/help-content.ts",
   "src/server/help-search.ts",
   "src/server/help-available.ts",
   "src/server/help-path.ts"
  ];
  for(const target of sources){
   const text=await source(target);
   assert.doesNotMatch(text,/export\s+(?:async\s+)?function\s+(?:POST|PUT|PATCH|DELETE)\s*\(/);
   assert.doesNotMatch(text,/\b(?:INSERT\s+INTO|UPDATE\s+public\.|DELETE\s+FROM|CREATE\s+TABLE)\b/i);
   assert.doesNotMatch(text,/\b(?:writeFile|appendFile|unlink|mkdir|rename)\s*\(/);
  }
  for(const target of ["src/app/app/help/help-context-button.tsx","src/app/app/help/help-setup-checklist.tsx"]){
   const text=await source(target);
   assert.doesNotMatch(text,/fetch\([\s\S]*?method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i);
  }
  const route=await source("src/app/api/help/articles/[articleId]/route.ts");
  assert.match(route,/export async function GET/);
  assert.match(route,/loadHelpContent\(articleId,locale,actor,mode\)/);
  const checklist=await source("src/app/app/help/help-setup-checklist.tsx");
  assert.match(checklist,/window\.localStorage\.setItem/);
  assert.match(checklist,/setProgress\(next\)/);
  assert.doesNotMatch(checklist,/\bfetch\s*\(/);
 });
 it("checks progress is self-declared, versioned and excludes inaccessible steps",()=>{
  const scrum=helpSetupSteps(helpCatalog(admin,"scrum"),"scrum");
  const kanban=helpSetupSteps(helpCatalog(admin,"kanban"),"kanban");
  const member=helpSetupSteps(helpCatalog(user,"scrum"),"scrum");
  assert.ok(scrum.some(step=>step.articleId==="sprints"));
  assert.ok(kanban.some(step=>step.articleId==="kanban-periods"));
  assert.equal(kanban.some(step=>step.articleId==="sprints"),false);
  assert.equal(member.some(step=>step.id==="team"),false);
  const progress=parseHelpSetupProgress(serializeHelpSetupProgress({team:"done",tickets:"in_progress"}));
  assert.equal(helpSetupDoneCount(progress,scrum),1);
  assert.equal(helpSetupDoneCount(progress,member),0);
  assert.equal(helpSetupDoneCount({},scrum),0);
  assert.deepEqual(parseHelpSetupProgress('{"version":999,"steps":{"team":"done"}}'),{});
 });
 it("performs actual locale-specific index searches with authorization filtering",async()=>{
  for(const locale of ["fr","en"] as const){
   const query=locale==="fr"?"ticket":"ticket";
   const result=await searchHelp(query,locale,user,"scrum");
   assert.equal(result.status,"ready");
   assert.ok(result.hits.some(item=>item.id==="tickets"));
   assert.equal(result.hits.some(item=>item.id==="jira-settings"),false);
  }
  const adminResult=await searchHelp("jira","fr",admin,"scrum");
  assert.equal(adminResult.status,"ready");
  assert.ok(adminResult.hits.some(item=>item.id==="jira-settings"));
  const memberResult=await searchHelp("jira","fr",user,"scrum");
  assert.equal(memberResult.status,"ready");
  assert.ok(!memberResult.hits.some(item=>item.id==="jira-settings"));
 });
 it("validates every installed FR/EN article and search index",async()=>{
  const evidence=await verifyOfflineHelp(root);
  assert.deepEqual(evidence.locales,["fr","en"]);
  assert.equal(evidence.articleCount,32);
 });
});
