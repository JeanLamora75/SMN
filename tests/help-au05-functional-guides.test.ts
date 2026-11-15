import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {describe,it} from "node:test";
import {helpArticleById} from "../src/lib/help-catalog";
import {loadHelpContent} from "../src/server/help-content";
import {buildHelpIndexes} from "../scripts/build-help-index.mjs";

const root=path.resolve("content/help");
const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const read=(p:string)=>readFile(p,"utf8");
const guide=(locale:"fr"|"en",id:string)=>read(path.join(root,locale,id+".md"));
const links=(md:string)=>[...md.matchAll(/\]\((\/app[^)\s]*)\)/g)].map(m=>m[1]);

describe("AU-05 — verified operational guides for Reports, Members and General Settings",()=>{
 it("covers the four report tabs, administrative creation and Office download/save without conflating them",async()=>{
  const page=await read("src/app/app/reports/page.tsx");
  const create=await read("src/app/app/reports/new-report-form.tsx");
  const office=await read("src/app/app/reports/office-template-catalog.tsx");
  const tags=await read("src/app/app/reports/office-tag-configurator.tsx");
  assert.match(page,/const tabs=\["reports","templates","tags","archives"\]/);
  assert.match(page,/account\.role==="admin"&&!scoped&&<NewReportForm/);
  assert.match(create,/tr\("newReport"\)/);
  for(const v of ["sprint","template","title","language"])assert.ok(create.includes('tr("'+v+'")'));
  for(const action of ['action:"save"','action:"download"'])assert.ok(office.includes(action));
  assert.match(office,/officeOverwriteConfirm/);
  assert.match(tags,/\["scalar","indicator","row","chart"\]/);
  for(const locale of ["fr","en"] as const){
   const md=await guide(locale,"reports");
   for(const section of locale==="fr"
    ?["Rapports","Modèles","Tags","Archives","Générer","Enregistrer","langue","filtre"]
    :["Reports","Templates","Tags","Archives","Generate","Save","language","filter"]){
    assert.ok(md.toLowerCase().includes(section.toLowerCase()),locale+": missing "+section);
   }
   assert.deepEqual(links(md),["/app/reports"]);
   assert.ok(md.length>2500);
  }
 });
 it("covers member list/cards, actual filters, creation permissions and assignment dates",async()=>{
  const page=await read("src/app/app/admin/members/team-overview.tsx");
  for(const fragment of ['View="cards"|"list"','teamCockpit.roleLabel','teamCockpit.functionLabel',
    'teamCockpit.statusLabel','teamCockpit.searchPlaceholder','teamUX.addMember',
    'teamUX.activeAssignmentHeading','teamUX.inactiveAssignmentHeading','canManage&&']){
   assert.ok(page.includes(fragment),fragment);
  }
  assert.match(page,/localStorage\.getItem\(CHOICE\)/);
  assert.match(page,/team-create-title/);
  for(const locale of ["fr","en"] as const){
   const md=await guide(locale,"members");
   for(const term of locale==="fr"
    ?["Cartes","Liste","recherche","rôle","fonction","statut","actifs","inactifs","affectation"]
    :["Cards","List","search","role","function","status","active","inactive","assignment"]){
    assert.ok(md.toLowerCase().includes(term.toLowerCase()),locale+": missing "+term);
   }
   assert.deepEqual(links(md),["/app/admin/members"]);
   assert.ok(md.length>1900);
  }
 });
 it("documents the real three settings tabs, fixed fields, selectors and revision-safe save",async()=>{
  const page=await read("src/app/app/admin/settings/general/page.tsx");
  const form=await read("src/app/app/admin/settings/settings-form.tsx");
  assert.match(page,/type:"settings"/);
  assert.match(form,/\["general","language","appearance"\]/);
  for(const field of ["fixed-mode","fixed-product","locale","theme","palette","country"]){
   assert.ok(form.includes('id="'+field+'"'),field);
  }
  for(const value of ["ocean","forest","violet","red-purple"]){
   assert.ok(form.includes('value="'+value+'"'),value);
  }
  assert.match(form,/revision:saved\.revision/);
  assert.match(form,/settings\.conflict/);
  assert.match(form,/disabled=\{busy\|\|!dirty\}/);
  for(const locale of ["fr","en"] as const){
   const md=await guide(locale,"general-settings");
   for(const term of locale==="fr"
    ?["Général","Langue","Apparence","pays","thème","palette","révision","Enregistrer"]
    :["General","Language","Appearance","country","theme","palette","revision","Save"]){
    assert.ok(md.toLowerCase().includes(term.toLowerCase()),locale+": missing "+term);
   }
   assert.deepEqual(links(md),["/app/admin/settings/general"]);
   assert.ok(md.length>1700);
  }
 });
 it("does not expose restricted articles to user; shares localized content and current indexes",async()=>{
  for(const locale of ["fr","en"] as const){
   for(const id of ["reports","members","general-settings"]){
    const a=await loadHelpContent(id,locale,admin,"scrum",root);
    assert.equal(a.status,"ready");
    if(a.status==="ready"){
     assert.equal(a.contentLocale,locale);
     assert.equal(a.isFallback,false);
    }
    assert.equal(helpArticleById(id,admin,"kanban")?.id,id);
   }
   assert.equal((await loadHelpContent("reports",locale,user,"scrum",root)).status,"ready");
   for(const id of ["members","general-settings"]){
    assert.equal((await loadHelpContent(id,locale,user,"scrum",root)).status,"forbidden");
   }
  }
  assert.deepEqual((await buildHelpIndexes({check:true})).map(x=>x.locale),["en","fr"]);
 });
});
