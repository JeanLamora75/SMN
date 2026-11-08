import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createOfficeStyleSnapshot,createOfficeChartStyleResolver,
 OfficeChartStyleResolutionError} from "../src/server/reports/office-chart-style-resolver";
import {PREDEFINED_CHART_STYLES,CHART_TYPES} from "../src/server/reports/chart-style-contract";
import {parseOfficeChartTag,discoverOfficeChartTags} from "../scripts/smn-402-office-chart-tags.mjs";
import {discoverPowerPointChartTargets} from "../scripts/smn-411-chart-targets.mjs";
import {syntheticOfficeTemplate} from "../scripts/poc/smn-415-office-baseline.mjs";

const styles=PREDEFINED_CHART_STYLES.map(s=>({
 id:s.id,revision:0,source:"builtin" as const,config:s.config
}));
const snapshot=createOfficeStyleSnapshot({
 styles,
 defaults:Object.fromEntries(CHART_TYPES.map(type=>[type,{styleId:"cockpit-agile",revision:1}]))
});
test("report style never changes explicit tag STYLE and applies to other chart types",()=>{
 const resolver=createOfficeChartStyleResolver(snapshot,"corporate");
 for(const type of CHART_TYPES){
  assert.deepEqual([resolver({type}).id,resolver({type}).source],["corporate","report"]);
  assert.deepEqual([resolver({type,style:"minimal"}).id,resolver({type,style:"minimal"}).source],
   ["minimal","tag"]);
 }
 const defaults=createOfficeChartStyleResolver(snapshot);
 assert.deepEqual([defaults({type:"line"}).id,defaults({type:"line"}).source],
  ["cockpit-agile","default"]);
 const historical=createOfficeChartStyleResolver(null);
 assert.equal(historical({type:"line"}).source,"legacy");
});
test("explicit invalid and deleted styles fail without fallback and without side effects",()=>{
 assert.throws(()=>createOfficeChartStyleResolver(snapshot,"deleted-style"),
  (e:unknown)=>e instanceof OfficeChartStyleResolutionError&&e.code==="office-chart-style-not-found");
 assert.throws(()=>createOfficeChartStyleResolver(snapshot,"<script>"),
  (e:unknown)=>e instanceof OfficeChartStyleResolutionError&&e.code==="office-chart-invalid-style-id");
 assert.throws(()=>createOfficeChartStyleResolver(null,"corporate"),
  (e:unknown)=>e instanceof OfficeChartStyleResolutionError&&e.code==="office-chart-style-not-found");
 const resolver=createOfficeChartStyleResolver(snapshot,"corporate");
 assert.equal(resolver({type:"line",style:"minimal"}).id,"minimal");
 assert.throws(()=>resolver({type:"line",style:"deleted-style"}),
  (e:unknown)=>e instanceof OfficeChartStyleResolutionError&&e.code==="office-chart-style-not-found");
});
test("the same report-level override resolves mixed DOCX and PPTX chart tags",()=>{
 const example=[
  "{{CHART:TREND|TYPE=bar|LAST=6}}",
  "{{CHART:TREND|TYPE=line|LAST=4|STYLE=minimal}}",
  "{{CHART:TREND|TYPE=area|LAST=5}}"
 ];
 const resolver=createOfficeChartStyleResolver(snapshot,"corporate");
 // Validate the same tag grammar used by Word and PowerPoint adapters.
 const expected=["corporate","minimal","corporate"];
 assert.deepEqual(example.map(tag=>resolver(parseOfficeChartTag(tag)).id),expected);
 const original=JSON.stringify(snapshot);
 for(const format of ["docx","pptx"] as const){
  const bytes=syntheticOfficeTemplate(format,3,"horizontal");
  if(format==="docx"){
   const found=discoverOfficeChartTags(bytes,format);
   assert.equal(found.length,3);
   assert.ok(found.every(item=>resolver(item.params).id==="corporate"));
  }else{
   const found=discoverPowerPointChartTargets(bytes);
   assert.equal(found.length,3);
   assert.ok(found.every(item=>resolver(item.options).id==="corporate"));
  }
 }
 assert.equal(JSON.stringify(snapshot),original);
});
test("the three export actions carry the same ephemeral choice; no persistence write",()=>{
 const ui=readFileSync("src/app/app/reports/office-template-catalog.tsx","utf8");
 const route=readFileSync("src/app/api/admin/reports/office-templates/generate/route.ts","utf8");
 assert.match(ui,/smn-office-report-style/);
 assert.match(ui,/value=""/);
 assert.match(ui,/styleOverride\(\)/);
 assert.equal((ui.match(/\.\.\.styleOverride\(\)/g)??[]).length,3);
 assert.match(ui,/action:"download"/);
 assert.match(ui,/action:"check"/);
 assert.match(ui,/action:"save"/);
 assert.match(route,/input.reportStyleId/);
 assert.match(route,/createOfficeChartStyleResolver\(styleSnapshot,reportStyleId\)/);
 assert.match(route,/if\(action==="check"\)/);
 assert.ok(route.indexOf("const resolveChartStyle=")<route.indexOf('if(action==="check")'));
 assert.ok(route.indexOf("const resolveChartStyle=")<route.indexOf("saveOfficeReport("));
 assert.doesNotMatch(route,/INSERT INTO public\.smn_chart_style|UPDATE public\.smn_chart_style/);
});
test("server rejects invalid override before file operations and checks rights",()=>{
 const route=readFileSync("src/app/api/admin/reports/office-templates/generate/route.ts","utf8");
 assert.match(route,/authorizeApi\(req,"read",resource\)/);
 assert.match(route,/resolveAdminTeam\(db,/);
 assert.match(route,/assertTeamReportCycle\(db,/);
 assert.match(route,/validChartStyleId\(reportStyleId\)/);
 assert.ok(route.indexOf("validChartStyleId(reportStyleId)")<route.indexOf("readOfficeTemplateById(modelId)"));
 assert.match(route,/office-chart-invalid-style-id/);
 assert.match(route,/OfficeChartStyleResolutionError/);
});
test("FR/EN strings are complete and selection is optional",()=>{
 const fr=JSON.parse(readFileSync("src/i18n/fr.json","utf8"));
 const en=JSON.parse(readFileSync("src/i18n/en.json","utf8"));
 for(const name of [
  "officeReportStyleLabel","officeReportStyleDefaults","officeReportStyleHint",
  "officeReportStyleMissing","officeReportStyleInvalid","officeReportStyleUnavailable",
  "officeReportStyleForbidden","officeReportStyleLoadError"
 ])for(const locale of [fr,en])assert.ok(locale.reportsCenter[name]?.length);
 assert.equal(fr.reportsCenter.officeReportStyleDefaults,"Styles par défaut");
});
