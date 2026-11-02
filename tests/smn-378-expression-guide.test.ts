import assert from "node:assert/strict";
import {test} from "node:test";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import ExpressionGuide from "../src/app/app/admin/settings/indicators/expression-guide";
import IndicatorSettingsTabs from "../src/app/app/admin/settings/indicators/settings-tabs";
import {parseFormula} from "../src/server/indicators/formula";

const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("catalogue of documented available expressions has valid examples",()=>{
 for(const formula of [
  "MIN(12, 8)","MAX(12, 8)","ROUND(25 / 3, 2)",
  "(POINTS_FAITS / POINTS_PREVUS) * 100",
  "SUM_LAST(SP_TERMINES, 5)","AVG_LAST(SP_TERMINES, 5)",
  "MIN_LAST(SP_TERMINES, 5)","MAX_LAST(SP_TERMINES, 5)",
  "LAST_VALUES(SP_TERMINES, 5)","PREVIOUS(SP_TERMINES, 1)",
  "DELTA(SP_TERMINES, 1)","DELTA_PCT(SP_TERMINES, 1)",
  'ROLE_JH("DEVELOPER")','ROLE_JH_PLANNED("DEVELOPER")','ROLE_MAX_JH("DEVELOPER")'
 ])assert.doesNotThrow(()=>parseFormula(formula),formula);
});
test("guide has explanations, search, categories and copy controls",()=>{
 const html=renderToStaticMarkup(createElement(ExpressionGuide));
 assert.match(html,/Guide des expressions/);
 assert.match(html,/Rechercher/);
 assert.match(html,/Catégorie/);
 for(const item of ["ROLE_JH","ROLE_JH_PLANNED","ROLE_MAX_JH","SUM_LAST","LAST_VALUES","ROUND"])
  assert.match(html,new RegExp(item));
 assert.match(html,/Copier/);
});
test("settings show real tabs and formula editor links to guide without resetting draft",()=>{
 const html=renderToStaticMarkup(createElement(IndicatorSettingsTabs,{catalogue:createElement("p",null,"Catalogue fictif"),permissions:createElement("p",null,"Droits fictifs")}));
 assert.match(html,/role="tablist"/);
 assert.match(html,/role="tabpanel"/);
 assert.match(html,/Guide des expressions/);
 const sourceText=source("src/app/app/admin/indicators/formula-publication-editor.tsx");
 assert.match(sourceText,/target="_blank"/);
 assert.match(sourceText,/guide-expressions/);
 assert.match(sourceText,/value=\{formula\}/);
});
