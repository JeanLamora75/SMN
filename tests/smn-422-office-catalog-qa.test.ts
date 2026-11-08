import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {CHART_TYPES,PREDEFINED_CHART_STYLES} from "../src/server/reports/chart-style-contract";
import {officeChartDefinitions} from "../src/app/app/reports/office-tags";
import {parseOfficeChartTag} from "../scripts/smn-402-office-chart-tags.mjs";
import {createOfficeChartStyleResolver,createOfficeStyleSnapshot} from "../src/server/reports/office-chart-style-resolver";

const content=(path:string)=>readFileSync(path,"utf8");
test("live Reports > Tags documents exactly six supported types and all examples parse",()=>{
 assert.deepEqual(officeChartDefinitions.map(x=>x.type),[...CHART_TYPES]);
 for(const item of officeChartDefinitions){
  assert.ok(item.fr&&item.en&&item.noteFr&&item.noteEn);
  assert.equal(parseOfficeChartTag(item.example).type,item.type);
 }
});
test("FR/EN TAGS documentation reflects implemented M1/M2/M3 STYLE priorities",()=>{
 const doc=content("src/app/app/reports/office-tags.tsx");
 for(const fragment of [
  "Styles graphiques Office","Office chart styles","Cockpit Agile","Corporate","Minimal",
  "STYLE=corporate","STYLE=minimal","STYLE=legacy","M1","M2","M3",
  "Styles par défaut","Default styles","prioritaire sur le choix du rapport",
  "overrides the report choice","Copier","PNG"
 ])if(fragment!=="Copier")assert.ok(doc.includes(fragment),"missing documentation "+fragment);
 assert.doesNotMatch(doc,/Word conserve le rendu historique|Word retains its previous rendering/);
 assert.match(doc,/CopyOfficeTag value=\{example\}/);
});
test("documentation priorities agree with resolver across all chart types",()=>{
 const snap=createOfficeStyleSnapshot({
  styles:PREDEFINED_CHART_STYLES.map(x=>({id:x.id,revision:0,source:"builtin" as const,config:x.config})),
  defaults:Object.fromEntries(CHART_TYPES.map(type=>[type,{styleId:"cockpit-agile",revision:1}]))
 });
 for(const type of CHART_TYPES){
  assert.equal(createOfficeChartStyleResolver(snap,"corporate")({type,style:"minimal"}).id,"minimal");
  assert.equal(createOfficeChartStyleResolver(snap,"corporate")({type}).id,"corporate");
  assert.equal(createOfficeChartStyleResolver(snap)({type}).id,"cockpit-agile");
  assert.equal(createOfficeChartStyleResolver(null)({type}).source,"legacy");
  assert.equal(createOfficeChartStyleResolver(snap)({type,style:"legacy"}).source,"legacy");
 }
});
test("quality gates do not describe synthetic packages as Microsoft Office proof",()=>{
 const doc=content("_bmad-output/implementation-artifacts/smn-422-office-catalog-qa/README.md");
 for(const text of ["Windows 11","Microsoft Word","Microsoft PowerPoint","1/3/6",
  "48","36","6 packages","non exécutée","≤ 10 %","Sally","TEA","Winston"])assert.ok(doc.includes(text),text);
 assert.ok(doc.includes("Manuel — non validé"));
});
test("transient export has no global catalog mutations and real server authorization remains",()=>{
 const ui=content("src/app/app/reports/office-template-catalog.tsx");
 const route=content("src/app/api/admin/reports/office-templates/generate/route.ts");
 assert.match(ui,/officeReportStyleDefaults/);
 assert.equal((ui.match(/\.\.\.styleOverride\(\)/g)||[]).length,3);
 assert.match(route,/assertTeamReportCycle/);
 assert.match(route,/createOfficeChartStyleResolver\(styleSnapshot,reportStyleId\)/);
 assert.doesNotMatch(route,/UPDATE public\.smn_chart_style|INSERT INTO public\.smn_chart_style/);
});
test("historical tags and v33 projection are still connected to the Office engine",()=>{
 const route=content("src/app/api/admin/reports/office-templates/generate/route.ts");
 const parser=content("scripts/smn-402-office-chart-tags.mjs");
 for(const name of ["readIndicatorReporting","readReportIndicatorProjection",
  "renderOfficeIndicatorSharedChart","insertAdaptivePowerPointCharts","insertOfficeTrendImages",
  "isSupportedOfficePackage","saveOfficeReport"])assert.ok(route.includes(name),name);
 for(const key of ["TYPE","TAGS","LAST","STYLE"])assert.ok(parser.includes(key),key);
});
