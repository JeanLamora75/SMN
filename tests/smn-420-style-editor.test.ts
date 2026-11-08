import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PREDEFINED_CHART_STYLES,CHART_TYPES,validChartStyleConfig} from "../src/server/reports/chart-style-contract";
import {composeAdaptiveChart} from "../scripts/smn-412-adaptive-chart.mjs";

const source=()=>readFileSync("src/app/app/admin/settings/reports/charts/style-editor.tsx","utf8");
const route=()=>readFileSync("src/app/api/admin/reports/chart-styles/preview/route.ts","utf8");
test("M2 dedicated route and M1 card navigation are protected and linked",()=>{
 const page=readFileSync("src/app/app/admin/settings/reports/charts/[styleId]/page.tsx","utf8");
 const gallery=readFileSync("src/app/app/admin/settings/reports/charts/style-gallery.tsx","utf8");
 assert.match(page,/currentAccount\(/);
 assert.match(page,/canAccess\(actor,"read"/);
 assert.match(page,/ChartStyleEditor/);
 assert.match(gallery,/href=\{"\/app\/admin\/settings\/reports\/charts\/"\+style.id\}/);
});
test("M2 uses accordions and a persistent preview, not a gallery-side editor",()=>{
 const s=source();
 assert.match(s,/<details open>/);
 assert.match(s,/smn-chart-m2-columns/);
 assert.match(s,/smn-chart-m2-preview/);
 assert.match(s,/smn-chart-m2-actions/);
 for(const type of CHART_TYPES)assert.ok(s.includes('type==="'+type+'"'));
});
test("preview only POSTs on explicit click, never from an effect or onChange",()=>{
 const s=source();
 const matches=s.match(/fetch\(PREVIEW/g)??[];
 assert.equal(matches.length,1);
 const fn=s.slice(s.indexOf("async function refreshPreview()"),s.indexOf("async function save()"));
 assert.match(fn,/fetch\(PREVIEW/);
 assert.match(s,/onClick=\{\(\)=>void refreshPreview\(\)\}/);
 const effects=[...s.matchAll(/useEffect\(\(\)=>\{/g)];
 assert.ok(effects.length>=3);
 for(const effect of effects){
  const snippet=s.slice(effect.index,effect.index+500);
  assert.doesNotMatch(snippet,/fetch\(PREVIEW/);
 }
});
test("preview server checks authentication and strict v1 config before rasterizer",()=>{
 const s=route();
 assert.match(s,/authorizeApi\(req,"read"/);
 assert.match(s,/readJsonObject\(req,12000\)/);
 assert.match(s,/validChartType\(raw.type\)/);
 assert.match(s,/validChartStyleConfig\(raw.config\)/);
 assert.match(s,/2_000_000/);
 assert.match(s,/Cache-Control":"private, no-store"/);
 assert.doesNotMatch(s,/readIndicatorReporting|INSERT INTO|UPDATE public|withAuthDb/);
});
test("all six styles render an illustrative scene from bounded synthetic values",()=>{
 const s=route();
 assert.match(s,/PREVIEW_CYCLES/);
 assert.match(s,/PREVIEW_SERIES/);
 assert.match(s,/Livré/);
 assert.match(s,/Prévu/);
 assert.match(s,/target:\{widthEmu:960\*3048,heightEmu:560\*3048\}/);
 const style=structuredClone(PREDEFINED_CHART_STYLES[0].config);
 assert.ok(validChartStyleConfig(style));
 for(const type of CHART_TYPES){
  const cycles=["S1","S2","S3","S4","S5","S6"].map(name=>({name}));
  const series=type==="gauge"?[{name:"Progress",unit:"%",values:[38,44,56,65,70,76]}]:
   [{name:"Done",unit:"SP",values:[8,12,10,16,14,19]},{name:"Planned",unit:"SP",values:[13,14,16,18,17,21]}];
  const svg=composeAdaptiveChart({type,cycles,series,target:{widthEmu:960*3048,heightEmu:560*3048},locale:"fr",style});
  assert.ok(svg?.svg.startsWith("<svg"));
 }
});
test("draft save carries revision and blocks invalid configurations",()=>{
 const s=source();
 assert.match(s,/validChartStyleConfig\(draft\)/);
 assert.match(s,/revision:original.revision/);
 assert.match(s,/action:"update"/);
 assert.match(s,/setPreviewStatus\("stale"\)/);
 assert.match(s,/window\.confirm\(tr\("discardConfirm"\)\)/);
 assert.match(s,/beforeunload/);
 assert.match(s,/source==="custom"/);
});
test("editor keys are present in both translations",()=>{
 const fr=JSON.parse(readFileSync("src/i18n/fr.json","utf8"));
 const en=JSON.parse(readFileSync("src/i18n/en.json","utf8"));
 const keys=(o:Record<string,unknown>)=>Object.keys(o).sort();
 assert.deepEqual(keys(fr.chartStyles.editor),keys(en.chartStyles.editor));
 for(const nested of ["legend","orientationOptions","barModes","markers"])
  assert.deepEqual(keys(fr.chartStyles.editor[nested]),keys(en.chartStyles.editor[nested]));
});
