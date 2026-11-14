import test from "node:test";
import assert from "node:assert/strict";
import {serializeOfficeTag,type OfficeTagSelection} from "../src/lib/office-tag-builder";
import {parseOfficeChartTag} from "../scripts/smn-402-office-chart-tags.mjs";
import {parseOfficeRowMarker} from "../scripts/smn-office-row-sort.mjs";
import {SCALAR_NAMES} from "../scripts/smn-399-office-scalars.mjs";
import {officeRowDefinitions,officeScalarDefinitions,officeChartDefinitions} from "../src/app/app/reports/office-tags";
import {readFileSync} from "node:fs";
const defaults:OfficeTagSelection={family:"scalar",key:"TEAM_NAME",rules:[],
 chart:{type:"bar",tags:[],last:6,style:"",explicitType:false,explicitLast:false}};
function tag(overrides:Partial<OfficeTagSelection>){return serializeOfficeTag({...defaults,...overrides});}
test("Every documented scalar matches the current scalar parser contract",()=>{
 const doc=new Set(officeScalarDefinitions.filter(x=>!x.key.includes("<")).map(x=>x.key));
 for(const name of SCALAR_NAMES)assert.ok(doc.has(name),"Undocumented scalar: "+name);
 for(const name of doc)assert.equal(tag({key:name}),"{{"+name+"}}");
 for(const key of doc)assert.equal(tag({key}),"{{"+key+"}}");
 assert.equal(tag({key:"UNSAFE|PARAM=YES"}),"");
});
test("Dynamic indicator references have no placeholder and reject bad syntax",()=>{
 assert.equal(tag({family:"indicator",key:"VELOCITY"}),"{{INDICATOR_VELOCITY}}");
 assert.equal(tag({family:"indicator",key:"<TAG>"}),"");
});
test("Every documented ROW supports zero or multiple valid sortable columns",()=>{
 const names=new Set(officeRowDefinitions.map(x=>x.source));
 for(const source of officeRowDefinitions){
  const legacy=tag({family:"row",key:source.source,allowedFields:source.fields});
  assert.equal(legacy,"{{ROW:"+source.source+"}}");
  assert.equal(parseOfficeRowMarker(legacy.slice(6,-2),names).source,source.source);
  const [first,second]=source.fields;
  if(!second)continue;
  const sorted=tag({family:"row",key:source.source,allowedFields:source.fields,
   rules:[{field:first,direction:"ASC"},{field:second,direction:"DESC"}]});
  assert.equal(parseOfficeRowMarker(sorted.slice(6,-2),names).sort.length,2);
  assert.equal(tag({family:"row",key:source.source,allowedFields:source.fields,
   rules:[{field:first,direction:"ASC"},{field:first,direction:"DESC"}]}),"");
  assert.equal(tag({family:"row",key:source.source,allowedFields:source.fields,
   rules:[{field:"NOT_A_COLUMN",direction:"ASC"}]}),"");
 }
 assert.equal(tag({family:"row",key:"RISKS",allowedFields:["RISK_TITLE","RISK_PRIORITY"],
  rules:[{field:"RISK_PRIORITY",direction:"DESC"},{field:"RISK_TITLE",direction:"ASC"}]}),
  "{{ROW:RISKS|SORT=RISK_PRIORITY:DESC,RISK_TITLE:ASC}}");
});
test("Six chart formats and valid optional parameters parse without error",()=>{
 for(const chart of officeChartDefinitions){
  const type=chart.type as OfficeTagSelection["chart"]["type"];
  const generated=tag({family:"chart",key:type,chart:{type,tags:["SP_DONE"],last:6,
   style:"corporate",explicitType:true,explicitLast:!["pie","donut","gauge"].includes(type)}});
  assert.equal(parseOfficeChartTag(generated).type,type);
 }
 assert.equal(tag({family:"chart",key:"bar",chart:{...defaults.chart,tags:["SP_DONE","SP_INIT"],last:6,
  type:"line",explicitType:true,explicitLast:true}}),
  "{{CHART:TREND|TYPE=line|TAGS=SP_DONE,SP_INIT|LAST=6}}");
 assert.equal(tag({family:"chart",key:"gauge",chart:{...defaults.chart,type:"gauge",
  tags:["A","B"],explicitType:true}}),"");
 assert.equal(tag({family:"chart",key:"bar",chart:{...defaults.chart,type:"bar",last:25}}),"");
 assert.equal(tag({family:"chart",key:"bar",chart:{...defaults.chart,style:"invalid style"}}),"");
});
test("Configurator entry, docs and internationalization are present",()=>{
 const page=readFileSync("src/app/app/reports/page.tsx","utf8");
 const component=readFileSync("src/app/app/reports/office-tag-configurator.tsx","utf8");
 assert.match(page,/OfficeTagConfigurator/);
 assert.match(component,/serializeOfficeTag/);
 assert.match(component,/navigator\.clipboard\.writeText/);
 assert.match(component,/aria-modal="true"/);
 assert.match(component,/role="dialog"/);
 const fr=JSON.parse(readFileSync("src/i18n/fr.json","utf8"));
 const en=JSON.parse(readFileSync("src/i18n/en.json","utf8"));
 const frKeys=Object.keys(fr.reportsCenter).filter(x=>x.startsWith("tagBuilder")).sort();
 const enKeys=Object.keys(en.reportsCenter).filter(x=>x.startsWith("tagBuilder")).sort();
 assert.deepEqual(frKeys,enKeys);
 assert.ok(frKeys.length>=35);
 for(const key of frKeys)assert.ok(fr.reportsCenter[key]&&en.reportsCenter[key],key);
});
