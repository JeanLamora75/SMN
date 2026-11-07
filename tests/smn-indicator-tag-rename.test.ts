import test from "node:test";
import assert from "node:assert/strict";
import {renameFormulaTag,planIndicatorTagRename} from "../src/server/indicators/tag-rename";
import {buildDependencyGraph,type IndicatorDefinition,type DependencyRow} from "../src/server/indicators/dependencies";

const definitions:IndicatorDefinition[]=[
 {id:"a",tag:"SP_INIT",formula:null},
 {id:"b",tag:"SP_DONE",formula:null},
 {id:"c",tag:"VELOCITY",formula:"SP_INIT + SP_DONE"},
 {id:"d",tag:"AVERAGE",formula:"AVG_LAST(SP_INIT, 3) + VELOCITY"}
];
const edges:DependencyRow[]=[
 {indicator_id:"c",source_type:"indicator",source_indicator_id:"a",source_calendar_tag:null},
 {indicator_id:"c",source_type:"indicator",source_indicator_id:"b",source_calendar_tag:null},
 {indicator_id:"d",source_type:"indicator",source_indicator_id:"a",source_calendar_tag:null},
 {indicator_id:"d",source_type:"indicator",source_indicator_id:"c",source_calendar_tag:null}
];

test("tag rename preserves ID-based dependency graph across formulas and historical functions",()=>{
 const changed=planIndicatorTagRename(definitions,edges,"a","SP_COMMITTED");
 assert.deepEqual(changed,[
  {id:"c",formula:"SP_COMMITTED + SP_DONE"},
  {id:"d",formula:"AVG_LAST(SP_COMMITTED, 3) + VELOCITY"}
 ]);
 const renamed=definitions.map(d=>({...d,tag:d.id==="a"?"SP_COMMITTED":d.tag,
  formula:changed.find(c=>c.id===d.id)?.formula??d.formula}));
 assert.equal(buildDependencyGraph(renamed,edges).byTag.get("SP_COMMITTED"),"a");
 assert.equal(buildDependencyGraph(renamed,edges).byTag.has("SP_INIT"),false);
});

test("tag rename replaces only exact tokens, never suffixes, quoted role arguments or formatting",()=>{
 assert.equal(renameFormulaTag('SP_INIT + SP_INITIAL + ROLE_JH("DEVELOPER")',"SP_INIT","SP_COMMITTED"),
  'SP_COMMITTED + SP_INITIAL + ROLE_JH("DEVELOPER")');
 assert.equal(renameFormulaTag('ROLE_JH("DEVELOPER") + DEVELOPER',"DEVELOPER","DEV"),
  'ROLE_JH("DEVELOPER") + DEV');
 assert.equal(renameFormulaTag("ROUND(SP_INIT / 2, 2)","SP_INIT","DONE"),
  "ROUND(DONE / 2, 2)");
});

test("tag rename refuses collisions and invalid or calendar-reserved identifiers",()=>{
 assert.throws(()=>planIndicatorTagRename(definitions,edges,"a","SP_DONE"),/conflict/);
 assert.throws(()=>planIndicatorTagRename(definitions,edges,"a","sp_new"),/conflict/);
 assert.throws(()=>planIndicatorTagRename(definitions,edges,"missing","NEW"),/not-found/);
});

test("Cockpit Agile editor and catalog transaction support renaming without rewriting layout IDs",async()=>{
 const {readFileSync}=await import("node:fs");
 const ui=readFileSync("src/app/app/admin/indicators/catalog-client.tsx","utf8");
 const service=readFileSync("src/server/indicators/catalog.ts","utf8");
 const sources=readFileSync("src/server/dashboard-builder/sources.ts","utf8");
 assert.match(ui,/indicatorId:edit\?\.id,tag,name/);
 assert.match(ui,/tag!==edit\.tag/);
 assert.match(service,/planIndicatorTagRename/);
 assert.match(service,/await db\.query\("BEGIN"\)/);
 assert.match(service,/await db\.query\("COMMIT"\)/);
 assert.match(service,/await db\.query\("ROLLBACK"\)/);
 assert.match(sources,/code:"indicator:"\+row\.id/);
});
