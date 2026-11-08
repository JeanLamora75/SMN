import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 filterGalleryStyles,usedAsDefault,canDeleteGalleryStyle,generateGalleryStyleId,validGalleryCatalog,
 type GalleryCatalog
} from "../src/lib/chart-style-gallery";
import {CHART_TYPES,PREDEFINED_CHART_STYLES,parseChartStyleCommand} from "../src/server/reports/chart-style-contract";

const config=()=>structuredClone(PREDEFINED_CHART_STYLES[0].config);
const styles=[
 ...PREDEFINED_CHART_STYLES.map(s=>({id:s.id,name:s.name,description:s.description,
  source:"builtin" as const,revision:0,config:config()})),
 {id:"my-design",name:"Mon style",description:"Équipe globale",
  source:"custom" as const,revision:2,config:config()}
];
const catalog=():GalleryCatalog=>({
 styles:structuredClone(styles),
 defaults:Object.fromEntries(CHART_TYPES.map(t=>[t,{styleId:t==="line"?"my-design":"cockpit-agile",revision:1}])) as GalleryCatalog["defaults"]
});

test("M1 gallery search, origin filter and default-type filter are deterministic",()=>{
 const data=catalog(),filter={query:"",origin:"all" as const,type:"all" as const};
 assert.equal(filterGalleryStyles(data,filter).length,4);
 assert.deepEqual(filterGalleryStyles(data,{...filter,origin:"builtin"}).map(s=>s.id),
  ["cockpit-agile","corporate","minimal"]);
 assert.deepEqual(filterGalleryStyles(data,{...filter,origin:"custom"}).map(s=>s.id),["my-design"]);
 assert.deepEqual(filterGalleryStyles(data,{...filter,query:"ÉQUIPE"}).map(s=>s.id),["my-design"]);
 assert.deepEqual(filterGalleryStyles(data,{...filter,type:"line"}).map(s=>s.id),["my-design"]);
 assert.deepEqual(filterGalleryStyles(data,{...filter,type:"gauge"}).map(s=>s.id),["cockpit-agile"]);
 assert.equal(filterGalleryStyles(data,{...filter,query:"nothere"}).length,0);
 assert.equal(validGalleryCatalog(data),true);
 assert.equal(validGalleryCatalog({...data,defaults:{}}),false);
});
test("deletion rules preserve builtins and any style used as per-type default",()=>{
 const data=catalog();
 assert.deepEqual(usedAsDefault(data,"my-design"),["line"]);
 assert.equal(canDeleteGalleryStyle(data,data.styles[0]),false);
 assert.equal(canDeleteGalleryStyle(data,data.styles[3]),false);
 data.defaults.line={styleId:"corporate",revision:2};
 assert.equal(canDeleteGalleryStyle(data,data.styles[3]),true);
 const illegal={...data,styles:[...data.styles,{...data.styles[3]}]};
 assert.equal(validGalleryCatalog(illegal),false);
});
test("create and rename retain style config and optimistic revision validation",()=>{
 const initial=catalog().styles[3];
 const id=generateGalleryStyleId("Présentation Équipe","1c03a5f2-aaa0-4bb9-9ccc-101010101010");
 assert.match(id,/^presentation-equipe-[0-9a-f]{8}$/);
 const created=parseChartStyleCommand({action:"create",id,name:"Style de direction",description:"",config:initial.config});
 assert.equal(created.action,"create");
 const renamed=parseChartStyleCommand({action:"update",id:initial.id,name:"Mon style 2",
  description:initial.description,revision:initial.revision,config:initial.config});
 assert.equal(renamed.action,"update");
 assert.throws(()=>parseChartStyleCommand({action:"delete",id:"corporate",revision:0}));
 assert.throws(()=>parseChartStyleCommand({action:"create",id:"legacy",name:"Historique",description:"",config:initial.config}));
});
test("gallery requests actual PNG from the shared Office renderer with style config",()=>{
 const gallery=readFileSync("src/app/app/admin/settings/reports/charts/style-gallery.tsx","utf8");
 const endpoint=readFileSync("src/app/api/admin/reports/chart-styles/preview/route.ts","utf8");
 assert.match(gallery,/fetch\("\/api\/admin\/reports\/chart-styles\/preview"/);
 assert.match(gallery,/JSON\.stringify\(\{type:"bar",config:style\.config,locale\}\)/);
 assert.match(gallery,/blob\.type!=="image\/png"/);
 assert.match(gallery,/URL\.revokeObjectURL/);
 assert.doesNotMatch(gallery,/const grid=\[28,16,37,24,48,33\]/);
 assert.match(endpoint,/renderAdaptiveChartPng\(/);
 assert.match(endpoint,/style:raw\.config/);
 assert.match(gallery,/previewCaption/);
});
test("settings navigation, protected route and admin-only mutation API remain wired",()=>{
 const page=readFileSync("src/app/app/admin/settings/reports/charts/page.tsx","utf8");
 const nav=readFileSync("src/app/app/admin/settings/settings-catalog-view.tsx","utf8");
 const gallery=readFileSync("src/app/app/admin/settings/reports/charts/style-gallery.tsx","utf8");
 const api=readFileSync("src/app/api/admin/reports/chart-styles/route.ts","utf8");
 assert.match(page,/currentAccount\(/);
 assert.match(page,/canAccess\(actor,"read"/);
 assert.match(nav,/href="\/app\/admin\/settings\/reports\/charts"/);
 assert.match(gallery,/setPendingDefault\(/);
 assert.match(gallery,/action:"set-default"/);
 assert.match(gallery,/window\.confirm/);
 assert.match(gallery,/role="dialog"/);
 assert.match(api,/authorizeApi\(req,"write",writeScope\)/);
});
test("M1 translations have matching keys in French and English",()=>{
 const fr=JSON.parse(readFileSync("src/i18n/fr.json","utf8"));
 const en=JSON.parse(readFileSync("src/i18n/en.json","utf8"));
 const keys=(o:Record<string,unknown>)=>Object.keys(o).sort();
 assert.deepEqual(keys(fr.chartStyles.gallery),keys(en.chartStyles.gallery));
 assert.deepEqual(keys(fr.chartStyles.gallery.types),[...CHART_TYPES].sort());
 for(const l of [fr,en])for(const type of CHART_TYPES)
  assert.ok(typeof l.chartStyles.gallery.types[type]==="string");
});
