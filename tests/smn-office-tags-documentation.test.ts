import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {officeRowDefinitions,officeScalarDefinitions,officeChartDefinitions} from "../src/app/app/reports/office-tags";
import {SCALAR_NAMES} from "../scripts/smn-399-office-scalars.mjs";
import {officeBusinessSources} from "../src/server/reports/office-business-rows";
import {parseOfficeChartTag} from "../scripts/smn-402-office-chart-tags.mjs";

test("All scalar tags implemented by the engine are documented in SMN",()=>{
 const documented=new Set(officeScalarDefinitions.map(item=>item.key));
 assert.equal(documented.size,officeScalarDefinitions.length);
 for(const name of SCALAR_NAMES)assert.ok(documented.has(name),name);
 assert.ok(documented.has("INDICATOR_<TAG>"));
 for(const item of officeScalarDefinitions){
  assert.ok(item.fr.trim()&&item.en.trim(),item.key);
 }
});

test("Every dynamic table source has a complete FR/EN entry and field examples",()=>{
 const expected=["MEMBERS","INDICATORS",...officeBusinessSources];
 assert.deepEqual(officeRowDefinitions.map(item=>item.source),expected);
 for(const item of officeRowDefinitions){
  assert.ok(item.fr.trim()&&item.en.trim(),item.source);
  assert.ok(item.fields.length>0,item.source);
  assert.equal(new Set(item.fields).size,item.fields.length,item.source);
  assert.ok(item.fields.every(field=>/^[A-Z][A-Z0-9_]*$/.test(field)),item.source);
 }
});

test("The six chart style examples match the real chart parser",()=>{
 assert.deepEqual(officeChartDefinitions.map(item=>item.type),
  ["bar","line","area","pie","donut","gauge"]);
 for(const item of officeChartDefinitions){
  const parsed=parseOfficeChartTag(item.example);
  assert.equal(parsed.type,item.type);
  assert.ok(item.fr.trim()&&item.en.trim());
  assert.ok(parsed.tags!==null);
 }
 assert.deepEqual(parseOfficeChartTag("{{CHART:TREND}}"),{last:6,type:"bar",tags:null});
});

test("The UI no longer promises future tables or charts already implemented",()=>{
 for(const language of ["fr","en"]){
  const content=JSON.parse(readFileSync("src/i18n/"+language+".json","utf8"));
  const message=content.reportsCenter.officeScalarOnly as string;
  assert.ok(message.length>0);
  assert.doesNotMatch(message,/première version remplace les tags simples|tables and charts will follow/i);
 }
});

test("Documentation states current scope instead of promising multi-sprint tables",()=>{
 const source=readFileSync("src/app/app/reports/office-tags.tsx","utf8");
 assert.match(source,/multi-sprint consolidation/);
 assert.match(source,/un sprint sélectionné/);
 assert.match(source,/Microsoft Office/);
 assert.match(source,/N\/D/);
});
