import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {describe,it} from "node:test";
import {helpCatalog} from "../src/lib/help-catalog";
import {loadHelpContent} from "../src/server/help-content";
import {buildHelpIndexes} from "../scripts/build-help-index.mjs";
import {canAccess} from "../src/server/access-policy";

const user={role:"user",is_active:true,must_change_password:false};
const admin={role:"admin",is_active:true,must_change_password:false};
const root=path.resolve("content/help");
const directLinks=(source:string)=>[...source.matchAll(/\]\((\/app(?:\/[^)\s]*)?)\)/g)].map(match=>match[1]);

describe("AU-03 — rights-aware links in shared FR/EN guides",()=>{
 it("never links a standard user to a forbidden or mode-incompatible help destination",async()=>{
  for(const locale of ["fr","en"] as const){
   for(const mode of ["scrum","kanban"] as const){
    const articles=helpCatalog(user,mode);
    const allowedRoutes=new Set(articles.map(article=>article.route));
    assert.ok(articles.length>=7,locale+"/"+mode);
    for(const article of articles){
     const result=await loadHelpContent(article.id,locale,user,mode,root);
     assert.equal(result.status,"ready",locale+"/"+mode+"/"+article.id);
     if(result.status!=="ready")continue;
     for(const link of directLinks(result.markdown)){
      assert.ok(allowedRoutes.has(link.split("?")[0])&&
       (!link.includes("?")||link==="/app/help?article=overview"&&articles.some(a=>a.id==="overview")),
       locale+"/"+mode+"/"+article.id+" has inaccessible or mismatched link "+link);
     }
    }
   }
  }
 });
 it("preserves helpful shared destinations and explains restricted operations in both languages",async()=>{
  for(const locale of ["fr","en"] as const){
   const docs=Object.fromEntries(await Promise.all(
    ["overview","calendar","faq","indicators"].map(async id=>
     [id,await readFile(path.join(root,locale,id+".md"),"utf8")] as const)
   ));
   for(const id of ["overview","calendar","faq","indicators"]){
    assert.doesNotMatch(docs[id],/\]\(\/app\/admin\/settings(?:\/[^)]*)?\)/,
     locale+"/"+id);
    assert.doesNotMatch(docs[id],/\]\(\/app\/admin\/members\)/,locale+"/"+id);
   }
   assert.ok(directLinks(docs.overview).includes("/app/team-calendar"));
   assert.ok(directLinks(docs.overview).includes("/app/tickets"));
   assert.ok(directLinks(docs.overview).includes("/app/reports"));
   assert.ok(directLinks(docs.calendar).includes("/app/team-calendar"));
   assert.ok(directLinks(docs.faq).includes("/app/help?article=overview"));
   assert.ok(directLinks(docs.indicators).includes("/app/admin/indicators"));
   if(locale==="fr"){
    assert.match(docs.overview,/administrateur/);
    assert.match(docs.calendar,/droits/);
    assert.match(docs.indicators,/administrateur/);
    assert.match(docs.faq,/autorisations/);
   }else{
    assert.match(docs.overview,/administrator/);
    assert.match(docs.calendar,/role/);
    assert.match(docs.indicators,/administrator/);
    assert.match(docs.faq,/permissions/);
   }
  }
 });
 it("leaves admin permissions in place and does not expose restricted help to user",()=>{
  const settings={type:"settings",exists:true,inScope:true};
  const backups={type:"backups",exists:true,inScope:true};
  assert.equal(canAccess(user,"read",settings),false);
  assert.equal(canAccess(user,"read",backups),false);
  assert.equal(canAccess(admin,"read",settings),true);
  for(const mode of ["scrum","kanban"] as const){
   for(const id of ["general-settings","teams","members","jira-settings","backup"]){
    assert.equal(helpCatalog(user,mode).some(article=>article.id===id),false,id);
   }
  }
 });
 it("has fresh, locale-matched search indexes",async()=>{
  const result=await buildHelpIndexes({check:true});
  assert.deepEqual(result.map(item=>item.locale),["en","fr"]);
  assert.ok(result.every(item=>item.articles===32));
 });
});
