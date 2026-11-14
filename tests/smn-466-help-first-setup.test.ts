import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFile,readdir} from "node:fs/promises";
import path from "node:path";
import {helpSetupSteps,helpSetupStepIds} from "../src/lib/help-setup";
import {helpCatalog} from "../src/lib/help-catalog";
import {loadHelpContent} from "../src/server/help-content";
import {buildHelpIndexes} from "../scripts/build-help-index.mjs";

const root=path.resolve("content/help");
const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const guideIds=["overview","general-settings","teams","calendar","members",
 "sprints","kanban-periods","backup","reports"] as const;

describe("SMN-466 — first-setup documentation FR/EN",()=>{
 it("publishes full translated articles for every onboarding guide",async()=>{
  for(const lang of ["fr","en"] as const){
   const files=await readdir(path.join(root,lang));
   for(const id of guideIds){
    assert.ok(files.includes(id+".md"),`${lang}/${id} missing`);
    const source=await readFile(path.join(root,lang,id+".md"),"utf8");
    assert.match(source,/^# .+/);
    assert.match(source,/^## /m);
    assert.ok(source.length>200,`${lang}/${id} seems empty`);
    assert.doesNotMatch(source,/<script|https?:\/\/|@example\.|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
   }
  }
 });
 it("connects stable checklist IDs to the catalog and shipped guides",async()=>{
  for(const mode of ["scrum","kanban"] as const){
   const steps=helpSetupSteps(helpCatalog(admin,mode),mode);
   for(const step of steps){
    assert.ok(helpSetupStepIds.includes(step.id));
    for(const lang of ["fr","en"]){
     const result=await loadHelpContent(step.articleId,lang,admin,mode,root);
     assert.equal(result.status,"ready",`${lang}/${step.articleId}`);
     if(result.status==="ready"){
      assert.equal(result.isFallback,false);
      assert.match(result.markdown,new RegExp("\\*\\*"+step.id+"\\*\\*"));
     }
    }
   }
  }
  assert.ok(!helpSetupSteps(helpCatalog(user,"scrum"),"scrum").some(step=>step.id==="team"));
 });
 it("uses only real internal application destinations",async()=>{
  for(const lang of ["fr","en"]){
   for(const id of guideIds){
    const source=await readFile(path.join(root,lang,id+".md"),"utf8");
    for(const match of source.matchAll(/\]\((\/app(?:\/[a-z0-9-]+)+)\)/g)){
     const route=match[1].replace(/^\/app\//,"");
     const file=path.join("src/app/app",route,"page.tsx");
     await assert.doesNotRejects(readFile(file,"utf8"),`${lang}/${id} dead link: ${match[1]}`);
    }
   }
  }
 });
 it("keeps local index files synchronized and long content out of global i18n",async()=>{
  await buildHelpIndexes({check:true});
  for(const lang of ["fr","en"]){
   const translations=await readFile(path.join("src/i18n",lang+".json"),"utf8");
   assert.ok(!translations.includes("Manually mark **backup**"));
   assert.ok(!translations.includes("Marquez manuellement **backup**"));
  }
 });
});
