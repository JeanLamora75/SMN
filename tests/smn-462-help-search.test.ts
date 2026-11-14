import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {mkdtemp,mkdir,writeFile,rm,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {rankHelpSearch,searchHelp,normalizeHelpQuery} from "../src/server/help-search";
import {buildHelpIndexes} from "../scripts/build-help-index.mjs";
import {translate} from "../src/i18n/catalog";

const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
describe("SMN-462 search: locale, relevance, rights and build index",()=>{
 it("ranks title over body, ignores accents and case, keeps one result per article",()=>{
  const results=rankHelpSearch("EQUIPE",[
   {id:"overview",title:"Présentation",searchText:"configuration equipe"},
   {id:"teams",title:"Équipes et membres",searchText:"guide equipes et configuration"},
   {id:"tickets",title:"Tickets",searchText:"autres tickets"}
  ],new Set(["teams","overview","tickets"]));
  assert.deepEqual(results.map(x=>x.id),["teams","overview"]);
  assert.equal(normalizeHelpQuery("Préparation  DE L'ÉQUIPE"),"preparation de l equipe");
  assert.deepEqual(rankHelpSearch(" ",[],new Set()),[]);
 });
 it("queries only the active locale index with role-based filtering",async()=>{
  const tmp=await mkdtemp(path.join(tmpdir(),"smn-help-search-"));
  try{
   await writeFile(path.join(tmp,"fr.json"),JSON.stringify({version:1,locale:"fr",articles:[
    {id:"overview",title:"Présentation",searchText:"guide demarrer"},
    {id:"general-settings",title:"Configuration",searchText:"configuration parametrage"}
   ]}));
   await writeFile(path.join(tmp,"en.json"),JSON.stringify({version:1,locale:"en",articles:[
    {id:"overview",title:"Getting started",searchText:"setup guidance"},
    {id:"general-settings",title:"Private settings",searchText:"setup admin only"}
   ]}));
   assert.deepEqual((await searchHelp("setup","en",user,"scrum",tmp)).hits.map(x=>x.id),["overview"]);
   assert.deepEqual((await searchHelp("setup","en",admin,"scrum",tmp)).hits.map(x=>x.id),["overview","general-settings"]);
   assert.deepEqual((await searchHelp("guide","fr",admin,"scrum",tmp)).hits.map(x=>x.id),["overview"]);
   assert.equal((await searchHelp("setup","fr",admin,"scrum",tmp)).hits.length,0);
   assert.equal((await searchHelp("setup","de",admin,"scrum",tmp)).status,"unavailable");
   assert.equal((await searchHelp("setup","../fr",admin,"scrum",tmp)).status,"unavailable");
  }finally{await rm(tmp,{recursive:true,force:true});}
 });
 it("shows an unavailable state if an index is corrupt, missing or incomplete",async()=>{
  const tmp=await mkdtemp(path.join(tmpdir(),"smn-help-search-"));
  try{
   await writeFile(path.join(tmp,"en.json"),'{"version":1,"locale":"fr","articles":[]}');
   assert.equal((await searchHelp("test","en",user,"scrum",tmp)).status,"unavailable");
   await writeFile(path.join(tmp,"en.json"),'{"version":1,"locale":"en","articles":[{}]}');
   assert.equal((await searchHelp("test","en",user,"scrum",tmp)).status,"unavailable");
  }finally{await rm(tmp,{recursive:true,force:true});}
 });
 it("creates a separate file for each language and can validate stale index",async()=>{
  const tmp=await mkdtemp(path.join(tmpdir(),"smn-help-build-"));
  try{
   for(const locale of ["fr","en","es"]){
    await mkdir(path.join(tmp,locale));
    await writeFile(path.join(tmp,locale,"overview.md"),locale==="fr"?"# Équipe\n\nBienvenue":locale==="en"?"# Team\n\nWelcome":"# Equipo\n\nBienvenido");
   }
   assert.deepEqual((await buildHelpIndexes({base:tmp})).map(x=>x.locale),["en","es","fr"]);
   await buildHelpIndexes({base:tmp,check:true});
   const spanish=JSON.parse(await readFile(path.join(tmp,".index","es.json"),"utf8"));
   assert.equal(spanish.articles[0].title,"Equipo");
   await writeFile(path.join(tmp,"fr","overview.md"),"# Équipes modifiées");
   await assert.rejects(buildHelpIndexes({base:tmp,check:true}),/help-index-stale/);
  }finally{await rm(tmp,{recursive:true,force:true});}
 });
 it("indexes the committed locale resources and keeps UI translations concise",async()=>{
  await buildHelpIndexes({check:true});
  for(const lang of ["fr","en"] as const){
   for(const key of ["searchLabel","searchPlaceholder","searchButton","noResults","clearSearch","indexError","retrySearch"]){
    const text=translate(lang,("helpCenter."+key) as Parameters<typeof translate>[1]);
    assert.ok(text&&!/translation unavailable|traduction indisponible/i.test(text),key+":"+lang);
   }
  }
 });
});
