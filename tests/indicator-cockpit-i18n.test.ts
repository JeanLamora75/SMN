import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import fr from "../src/i18n/fr.json";
import en from "../src/i18n/en.json";

const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const page=read("src/app/app/admin/indicators/page.tsx");
const catalog=read("src/app/app/admin/indicators/catalog-client.tsx");
const cycles=read("src/app/app/admin/indicators/indicator-cycles.tsx");

test("indicator cockpit title and management controls use localized keys",()=>{
 assert.match(page,/translate\(locale,"indicators\.navTitle"\)/);
 for(const key of ["recalculationDone","recalculating","recalculate","manageColumns",
  "recalculationHint","definitionEyebrow","definitionSubtitle","expressionGuide","saveHint","saving"]){
  assert.ok(catalog.includes('t("indicators.'+key+'"'),key);
  assert.ok(fr.indicators[key as keyof typeof fr.indicators],key);
  assert.ok(en.indicators[key as keyof typeof en.indicators],key);
 }
 assert.doesNotMatch(catalog,/Recalculer les indicateurs|Gérer les colonnes|Les indicateurs calculés sont enregistrés par cycle/);
});
test("cycle table instructions and states are translated in English",()=>{
 assert.match(cycles,/indicators\.reporting\.columnsHint/);
 assert.match(cycles,/indicators\.reporting\.tableScroll/);
 assert.match(cycles,/sprintStates\."\+cycle\.status/);
 assert.equal(en.sprintStates.finished,"Finished");
 assert.equal(fr.sprintStates.finished,"Terminé");
 for(const key of ["columnsHint","tableScroll"] as const){
  assert.ok(fr.indicators.reporting[key]);
  assert.ok(en.indicators.reporting[key]);
 }
});
