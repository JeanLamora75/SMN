import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {recommendedIndicators,recommendedForMode,filterRecommendedIndicators} from "../src/lib/indicators/recommended-catalog";
import {parseFormula} from "../src/server/indicators/formula";

const read=(path:string)=>readFileSync(path,"utf8");

test("41 fiches : 24 Scrum et 17 Kanban, identifiants uniques et types valides",()=>{
 assert.equal(recommendedIndicators.length,41);
 assert.equal(recommendedForMode("scrum").length,24);
 assert.equal(recommendedForMode("kanban").length,17);
 assert.equal(new Set(recommendedIndicators.map(x=>x.id)).size,41);
 for(const x of recommendedIndicators){
  assert.ok(x.name&&x.domain&&x.purpose&&x.exampleInputs&&x.exampleResult&&x.interpretation&&x.caveat&&x.unit);
  if(x.type==="manual"){assert.ok(x.suggestedTag);assert.equal(x.formula,undefined);assert.equal(x.prerequisites.length,0);}
  else{assert.ok(x.formula);assert.equal(x.suggestedTag,undefined);assert.doesNotThrow(()=>parseFormula(x.formula!));}
 }
});

test("Filtres cumulés et isolement des modes",()=>{
 const scrum=recommendedForMode("scrum"),kanban=recommendedForMode("kanban");
 assert.ok(scrum.every(x=>x.mode==="scrum"));
 assert.ok(kanban.every(x=>x.mode==="kanban"));
 const result=filterRecommendedIndicators(scrum,"VELOcité","Tendances","computed");
 assert.ok(result.length>0&&result.every(x=>x.domain==="Tendances"&&x.type==="computed"));
 assert.deepEqual(filterRecommendedIndicators(kanban,"", "Flux","manual").map(x=>x.id),["KAN-08","KAN-09","KAN-11","KAN-12"]);
 assert.equal(filterRecommendedIndicators(kanban,"not-existing", "", "").length,0);
});

test("Le troisième onglet et la page conservent strictement l'accès administrateur",()=>{
 const tabs=read("src/app/app/admin/settings/indicators/settings-tabs.tsx");
 const page=read("src/app/app/admin/settings/indicators/page.tsx");
 const guide=read("src/app/app/admin/settings/indicators/recommended-guide.tsx");
 assert.match(tabs,/Indicateurs recommandés/);
 assert.match(tabs,/Guide des expressions/);
 assert.match(tabs,/indicator-settings-catalogue/);
 assert.match(page,/account\.role!=="admin"/);
 assert.match(page,/indicatorTeams/);
 assert.match(page,/id=ANY\(\$1::text\[\]\)/);
 assert.match(guide,/recommendedForMode/);
 assert.match(guide,/navigator\.clipboard\.writeText\(value\)/);
 assert.doesNotMatch(guide,/fetch\(|method:\s*"POST"/);
});
