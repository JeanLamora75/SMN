import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {describe,it} from "node:test";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {helpCatalog,helpArticleById,helpArticleForContext,validateHelpCatalog,
 type HelpArticle} from "../src/lib/help-catalog";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const inactive={role:"admin",is_active:false,must_change_password:false};

function routePage(route:string):string{
 return path.join(root,"src/app",...route.split("/").filter(Boolean),"page.tsx");
}

describe("SMN help canonical catalog",()=>{
 it("uses immutable, locale-independent IDs and returns stable contexts",()=>{
  const entries=helpCatalog(admin,"scrum");
  assert.ok(entries.length>=8);
  assert.equal(new Set(entries.map(x=>x.id)).size,entries.length);
  assert.ok(entries.every(e=>!Object.keys(e).some(k=>/title|translation|locale|name|teamId|accountId/i.test(k))));
  assert.deepEqual(helpArticleById("tickets",admin,"scrum"),helpArticleById("tickets",admin,"kanban"));
  const source=readFileSync(path.join(root,"src/lib/help-catalog.ts"),"utf8");
  assert.doesNotMatch(source,/\b(?:fetch|axios|prisma|pool\.query|localStorage)\s*\(/);
 });
 it("only exposes authorized metadata, with no hidden or fake destinations",()=>{
  assert.deepEqual(helpCatalog(null,"scrum"),[]);
  assert.deepEqual(helpCatalog(inactive,"scrum"),[]);
  assert.deepEqual(helpCatalog(user,"scrum").map(e=>e.id),
   ["overview","dashboard","sprints","tickets","calendar","registries","reports","indicators","faq"]);
  assert.equal(helpArticleById("general-settings",user,"scrum"),null);
  assert.equal(helpArticleById("backup",user,"scrum"),null);
  assert.equal(helpArticleForContext("/app/admin/settings",user,"scrum"),null);
  assert.equal(helpArticleById("sprints",user,"kanban"),null);
  assert.equal(helpArticleById("kanban-periods",user,"kanban")?.route,"/app/admin/kanban-periods");
  assert.equal(helpArticleForContext("/app/admin/kanban-periods",user,"kanban")?.id,"kanban-periods");
  assert.equal(helpArticleById("sprints",admin,"kanban"),null);
  assert.equal(helpArticleById("kanban-periods",admin,"kanban")?.route,"/app/admin/kanban-periods");
  assert.equal(helpArticleForContext("/app/tickets",user,"scrum")?.id,"tickets");
  assert.equal(helpArticleForContext("/app/tickets/secret",user,"scrum"),null);
  assert.equal(helpArticleForContext("/app/tickets?x=y",user,"scrum"),null);
  assert.equal(helpArticleById("__proto__",admin,"scrum"),null);
 });
 it("checks all referenced Next routes against real page files",()=>{
  const entries=helpCatalog(admin,"scrum").concat(helpCatalog(admin,"kanban"));
  const allRoutes=new Set(entries.flatMap(e=>[e.route,...e.contexts]));
  for(const route of allRoutes)assert.ok(existsSync(routePage(route)),route);
  validateHelpCatalog([...new Map(entries.map(e=>[e.id,e])).values()],allRoutes);
 });
 it("detects duplicate IDs and inconsistent metadata, routes and contexts",()=>{
  const valid=helpCatalog(admin,"scrum");
  const all=new Set(valid.flatMap(e=>[e.route,...e.contexts]));
  validateHelpCatalog(valid,all);
  assert.throws(()=>validateHelpCatalog([...valid,valid[0]],all),/help-duplicate-or-invalid-id/);
  assert.throws(()=>validateHelpCatalog([{...valid[0],id:"Fake ID"}],all),/help-duplicate-or-invalid-id/);
  assert.throws(()=>validateHelpCatalog([{...valid[0],route:"/app/not-installed"}],all),/help-invalid-metadata-or-route/);
  assert.throws(()=>validateHelpCatalog([{...valid[0],contexts:["/app/not-installed"]}],all),/help-invalid-or-duplicate-context/);
  assert.throws(()=>validateHelpCatalog([{...valid[0],modes:[]}],all),/help-invalid-modes/);
  assert.throws(()=>validateHelpCatalog([{...valid[0],resource:"unsupported" as HelpArticle["resource"]}],all),/help-invalid-metadata-or-route/);
  assert.throws(()=>validateHelpCatalog([{...valid[0],contexts:["/app","/app"]}],all),/help-invalid-or-duplicate-context/);
 });
});
