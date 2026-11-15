import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {describe,it} from "node:test";
import path from "node:path";
import {registryTypes,registryStatuses} from "../src/lib/registry-types";
import {helpArticleById} from "../src/lib/help-catalog";
import {loadHelpContent} from "../src/server/help-content";
import {buildHelpIndexes} from "../scripts/build-help-index.mjs";

const root=path.resolve("content/help");
const admin={role:"admin",is_active:true,must_change_password:false};
const user={role:"user",is_active:true,must_change_password:false};
const typeTerms={
 fr:{risk:"Risque",obstacle:"Obstacle",dependency:"Dépendance",decision:"Décision",action:"Action",highlight:"Fait marquant"},
 en:{risk:"Risk",obstacle:"Impediment",dependency:"Dependency",decision:"Decision",action:"Action",highlight:"Highlight"}
} as const;
const statusTerms:{
 fr:Record<string,string>;
 en:Record<string,string>
}={
 fr:{open:"Ouvert",resolved:"Résolu",in_progress:"En cours",abandoned:"Abandonné",
 satisfied:"Satisfaite",cancelled:"Annulée",active:"Active",replaced:"Remplacée",
 todo:"À faire",completed:"Terminée",recorded:"Enregistré"},
 en:{open:"Open",resolved:"Resolved",in_progress:"In progress",abandoned:"Abandoned",
 satisfied:"Satisfied",cancelled:"Cancelled",active:"Active",replaced:"Replaced",
 todo:"To do",completed:"Completed",recorded:"Recorded"}
};

describe("AU-04 — registry documentation follows the shipped registry model",()=>{
 it("covers all six canonical types and their actual statuses in FR and EN",async()=>{
  assert.deepEqual([...registryTypes],["risk","obstacle","dependency","decision","action","highlight"]);
  for(const locale of ["fr","en"] as const){
   const markdown=await readFile(path.join(root,locale,"registries.md"),"utf8");
   const headings=[...markdown.matchAll(/^### (.+)$/gm)].map(m=>m[1]);
   const typeHeading=(type:typeof registryTypes[number])=>headings.find(h=>
    h===typeTerms[locale][type]||h.startsWith(typeTerms[locale][type]+" :"));
   assert.equal(registryTypes.filter(type=>Boolean(typeHeading(type))).length,registryTypes.length,
    "all six registered types must be documented: "+locale);
   for(const type of registryTypes){
    const headingText=typeHeading(type);
    assert.ok(headingText,locale+": missing heading "+type);
    const heading="### "+headingText;
    const start=markdown.indexOf(heading);
    const end=markdown.indexOf("\n### ",start+heading.length);
    const section=markdown.slice(start,end<0?markdown.indexOf("\n## ",start+heading.length):end);
    for(const status of registryStatuses[type]){
     const word=statusTerms[locale][status];
     assert.ok(section.includes(word),locale+"/"+type+": missing "+status+" ("+word+")");
    }
   }
  }
 });
 it("reflects the real list tabs, contextual creation and type-specific forms",async()=>{
  const list=await readFile("src/app/app/admin/registries/registry-list.tsx","utf8");
  const create=await readFile("src/app/app/admin/registries/registry-create-modal.tsx","utf8");
  const journal=await readFile("src/lib/registry-linked-creation.ts","utf8");
  assert.match(list,/visibleRegistryTypes=\["risk","obstacle","dependency"\]/);
  assert.match(create,/allowedTypes:readonly RegistryType\[]=restrictedTypes\?\?/);
  assert.match(create,/registryStatuses\[type\]/);
  for(const field of ["probability","impact","roam","requesterKind","contributorKind","atRisk","rationale","replacesId"]){
   assert.ok(create.includes(field),"missing documented field from form: "+field);
  }
  assert.match(journal,/linkedJournalTypes=\["action","decision","highlight"\]/);
  for(const locale of ["fr","en"] as const){
   const md=await readFile(path.join(root,locale,"registries.md"),"utf8");
   assert.match(md,locale==="fr"?/liste principale.*risques/i:/main list.*risks/i);
   assert.match(md,locale==="fr"?/journal/i:/journal/i);
   assert.match(md,/ROAM/);
  }
 });
 it("preserves read-only permissions and honest deletion constraints",async()=>{
  const detail=await readFile("src/app/app/admin/registries/registry-detail.tsx","utf8");
  const deletion=await readFile("src/app/app/admin/registries/registry-delete-action.tsx","utf8");
  assert.match(detail,/canManage&&<RegistryDeleteAction/);
  assert.match(detail,/!canManage&&<span/);
  assert.match(deletion,/method:"DELETE"/);
  assert.match(deletion,/linkedData/);
  for(const locale of ["fr","en"] as const){
   const md=await readFile(path.join(root,locale,"registries.md"),"utf8");
   assert.match(md,locale==="fr"?/suppression définitive/i:/permanent deletion/i);
   assert.match(md,locale==="fr"?/droits de gestion/i:/management permission/i);
   assert.doesNotMatch(md,/\]\(https?:\/\//i);
   assert.ok(md.includes("](/app/admin/registries)"));
  }
  for(const role of [user,admin]){
   assert.equal(helpArticleById("registries",role,"scrum")?.id,"registries");
   assert.equal(helpArticleById("registries",role,"kanban")?.id,"registries");
   for(const locale of ["fr","en"] as const){
    const result=await loadHelpContent("registries",locale,role,"scrum",root);
    assert.equal(result.status,"ready");
    if(result.status==="ready")assert.equal(result.contentLocale,locale);
   }
  }
 });
 it("keeps both localized search indexes synchronized with the guides",async()=>{
  const checked=await buildHelpIndexes({check:true});
  assert.deepEqual(checked.map(x=>x.locale),["en","fr"]);
  assert.ok(checked.every(x=>x.articles===32));
  for(const locale of ["fr","en"] as const){
   const index=JSON.parse(await readFile(path.join(root,".index",locale+".json"),"utf8"));
   const entry=index.articles.find((x:{id:string})=>x.id==="registries");
   assert.ok(entry);
   assert.ok(entry.searchText.includes(locale==="fr"?"faits marquants":"highlights"));
  }
 });
});
