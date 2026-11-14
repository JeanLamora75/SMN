import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {mkdtemp,mkdir,writeFile,rm,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {availableHelpArticleIds} from "../src/server/help-available";
import {helpCatalog,helpArticleById} from "../src/lib/help-catalog";
import {privateNavigation,activePrivateEntry} from "../src/lib/private-navigation";
import {translate} from "../src/i18n/catalog";
import {loadHelpContent} from "../src/server/help-content";

const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};

describe("Help Center: navigation, accessibility and permissions",()=>{
 it("provides help directly before settings for admins and at the end for users",()=>{
  for(const role of ["admin","user"] as const){
   const entries=privateNavigation("scrum",role).flatMap(g=>g.entries);
   const index=entries.findIndex(e=>e.id==="help");
   assert.ok(index>=0);
   assert.equal(entries[index].href,"/app/help");
   assert.equal(activePrivateEntry("/app/help",entries[index]),true);
   assert.equal(activePrivateEntry("/app/help/subpage",entries[index]),true);
   assert.equal(translate("fr",entries[index].label),"Aide");
   assert.equal(translate("en",entries[index].label),"Help");
   assert.equal(entries[index+1]?.id,role==="admin"?"settings":undefined);
  }
 });
 it("exposes four localized categories without exposing hidden admin articles",()=>{
  for(const locale of ["fr","en"] as const){
   for(const key of ["gettingStarted","configuration","modules","troubleshooting"]){
    const text=translate(locale,("helpCenter."+key) as Parameters<typeof translate>[1]);
    assert.ok(text.trim());
    assert.doesNotMatch(text,/translation unavailable|traduction indisponible/i);
   }
  }
  assert.equal(helpArticleById("teams",user,"scrum"),null);
  assert.ok(helpCatalog(user,"scrum").some(x=>x.id==="overview"));
 });
 it("only advertises articles available in the chosen language or explicit fallback",async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),"smn-help-catalog-"));
  try{
   await mkdir(path.join(dir,"fr"));
   await mkdir(path.join(dir,"en"));
   await writeFile(path.join(dir,"fr","overview.md"),"# Présentation");
   await writeFile(path.join(dir,"en","tickets.md"),"# Tickets");
   await writeFile(path.join(dir,"en","bad name.md"),"# Invalid");
   const available=await availableHelpArticleIds("en",dir);
   assert.deepEqual([...available].sort(),["overview","tickets"]);
   assert.deepEqual([...await availableHelpArticleIds("de",dir)],["overview"]);
   assert.deepEqual([...await availableHelpArticleIds("../secrets",dir)],[]);
   const filtered=helpCatalog(user,"scrum").filter(x=>available.has(x.id));
   assert.deepEqual(filtered.map(x=>x.id),["overview","tickets"]);
  }finally{await rm(dir,{recursive:true,force:true});}
 });
 it("loads only authorized requested article content; browsing the index is filename-only",async()=>{
  const available=await availableHelpArticleIds("en");
  assert.ok(available.has("overview"));
  assert.ok(available.has("tickets"));
  const result=await loadHelpContent("overview","en",user,"scrum");
  assert.equal(result.status,"ready");
  assert.equal((await loadHelpContent("teams","en",user,"scrum")).status,"forbidden");
 });
 it("keeps the center page read-only, full-width and without speculative controls",async()=>{
  const source=await readFile("src/app/app/help/page.tsx","utf8");
  const css=await readFile("src/app/app/help/help-center.css","utf8");
  assert.match(source,/container-fluid/);
  assert.match(source,/availableHelpArticleIds/);
  assert.match(source,/currentAccount/);
  assert.match(source,/helpCatalog\(account,mode\)/);
  assert.match(source,/loadHelpContent\(selected\.id,locale,account,mode\)/);
  assert.match(css,/max-width:none/);
  assert.doesNotMatch(source,/fetch\s*\(|\.query\s*\(|POST|PATCH|DELETE|useServerAction/);
  assert.match(source,/<form method="get" action="\/app\/help" role="search"/);
  assert.match(source,/name="q" type="search"/);
 });
});
