import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import fr from "../src/i18n/fr.json";
import en from "../src/i18n/en.json";
import {recommendedIndicators} from "../src/lib/indicators/recommended-catalog";
import {localizeRecommendedIndicator} from "../src/lib/indicators/recommended-catalog.en";

const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("indicator settings tabs and toolbars are localized, without French hard-coded labels",()=>{
 const tabs=read("src/app/app/admin/settings/indicators/settings-tabs.tsx");
 for(const key of ["catalogue","expressions","recommended","cards","list","create","tabsLabel"])
  assert.match(tabs,new RegExp('indicatorSettingsUi\\.'+key));
 for(const hardcoded of [">Catalogue</button>",">Cartes</button>",">Liste</button>",">Créer un indicateur</button>"])
  assert.ok(!tabs.includes(hardcoded),hardcoded);
});
test("expression descriptions, categories and clipboard labels switch with language",()=>{
 const guide=read("src/app/app/admin/settings/indicators/expression-guide.tsx");
 assert.match(guide,/useLocale\(\)/);
 assert.match(guide,/englishDescriptions/);
 assert.match(guide,/categoryLabels\[entry\.category\]/);
 assert.match(guide,/indicatorSettingsUi\.copy/);
 const list=guide.match(/const englishDescriptions=\[([^;]+)\];/)?.[1];
 assert.ok(list,"English expression descriptions must exist");
 assert.equal(JSON.parse(list).length,16);
});
test("all 41 recommended indicator records have translated reference descriptions without modifying formulas or tags",()=>{
 assert.equal(recommendedIndicators.length,41);
 for(const original of recommendedIndicators){
  const english=localizeRecommendedIndicator(original,"en");
  assert.notEqual(english.name,original.name,original.id);
  assert.notEqual(english.purpose,original.purpose,original.id);
  assert.notEqual(english.caveat,original.caveat,original.id);
  assert.equal(english.formula,original.formula,original.id);
  assert.equal(english.suggestedTag,original.suggestedTag,original.id);
  assert.equal(english.id,original.id);
  assert.deepEqual(localizeRecommendedIndicator(original,"fr"),original);
 }
});
test("recommended indicator filters operate on localized strings and labels",()=>{
 const guide=read("src/app/app/admin/settings/indicators/recommended-guide.tsx");
 assert.match(guide,/localizeRecommendedIndicator\(entry,locale\)/);
 assert.match(guide,/filterRecommendedIndicators\(all,query,domain,type\)/);
 for(const key of ["recommendedIntro","manual","computed","display","purpose","interpretation","caveat","copy","allDomains"]){
  assert.ok(guide.includes("indicatorSettingsUi."+key),key);
 }
});
test("French and English reference UI catalogs have matching keys",()=>{
 assert.deepEqual(Object.keys(fr.indicatorSettingsUi).sort(),Object.keys(en.indicatorSettingsUi).sort());
 for(const key of Object.keys(fr.indicatorSettingsUi) as (keyof typeof fr.indicatorSettingsUi)[]){
  assert.ok(fr.indicatorSettingsUi[key].trim(),key);
  assert.ok(en.indicatorSettingsUi[key].trim(),key);
 }
});
