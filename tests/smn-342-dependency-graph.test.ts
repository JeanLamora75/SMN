import {test} from "node:test";
import assert from "node:assert/strict";
import {buildDependencyGraph,impactedIndicatorIds,evaluateDependencies,isCalendarSourceTag,DependencyGraphError,loadDependencyGraph,type IndicatorDefinition,type DependencyRow} from "../src/server/indicators/dependencies";
const defs:IndicatorDefinition[]=[
 {id:"a",tag:"A",formula:null},{id:"b",tag:"B",formula:"A+1"},
 {id:"c",tag:"C",formula:"B*2+CAL_WORKING_DAYS"},{id:"d",tag:"D",formula:"A+3"}
];
const edges:DependencyRow[]=[
 {indicator_id:"b",source_type:"indicator",source_indicator_id:"a",source_calendar_tag:null},
 {indicator_id:"c",source_type:"indicator",source_indicator_id:"b",source_calendar_tag:null},
 {indicator_id:"c",source_type:"calendar",source_indicator_id:null,source_calendar_tag:"CAL_WORKING_DAYS"},
 {indicator_id:"d",source_type:"indicator",source_indicator_id:"a",source_calendar_tag:null}
];
test("topologie Kahn déterministe, sources masquées toujours calculées",()=>{
 const graph=buildDependencyGraph(defs,edges);
 assert.deepEqual(graph.order,["a","b","c","d"]);
 assert.deepEqual(impactedIndicatorIds(graph,["a"]),["a","b","c","d"]);
 assert.deepEqual(impactedIndicatorIds(graph,[],["CAL_WORKING_DAYS"]),["c"]);
 const results=evaluateDependencies({graph,indicators:{a:"2"},calendar:{CAL_WORKING_DAYS:"3"}});
 assert.deepEqual(results.get("b"),{kind:"available",value:"3"});
 assert.deepEqual(results.get("c"),{kind:"available",value:"9"});
 assert.deepEqual(results.get("d"),{kind:"available",value:"5"});
});
test("NULL non assimilé à zéro et indisponibilité directe propagée",()=>{
 const graph=buildDependencyGraph(defs,edges);
 const r=evaluateDependencies({graph,indicators:{a:null},calendar:{CAL_WORKING_DAYS:"0"}});
 assert.deepEqual(r.get("b"),{kind:"unavailable",reason:"missing_source",sourceTag:"A"});
 assert.deepEqual(r.get("c"),{kind:"unavailable",reason:"dependency_unavailable",sourceTag:"B"});
});
test("cycles, sources inconnues et divergence formule/SQL refusés",()=>{
 assert.throws(()=>buildDependencyGraph([{id:"a",tag:"A",formula:"B"},{id:"b",tag:"B",formula:"A"}],[
  {indicator_id:"a",source_type:"indicator",source_indicator_id:"b",source_calendar_tag:null},
  {indicator_id:"b",source_type:"indicator",source_indicator_id:"a",source_calendar_tag:null}
 ]),e=>e instanceof DependencyGraphError&&e.code==="cycle");
 assert.throws(()=>buildDependencyGraph(defs,edges.slice(1)),e=>e instanceof DependencyGraphError&&e.code==="formula_mismatch");
 assert.throws(()=>buildDependencyGraph(defs,[...edges,{indicator_id:"c",source_type:"calendar",source_indicator_id:null,source_calendar_tag:"CAL_UNKNOWN"}]),e=>e instanceof DependencyGraphError&&e.code==="unknown_source");
 assert.equal(isCalendarSourceTag("CAL_WORKING_DAYS"),true);
 assert.equal(isCalendarSourceTag("CAL_UNKNOWN"),false);
});
test("grands graphes itératifs et impacts transitifs",()=>{
 const n=1500;
 const nodes:IndicatorDefinition[]=Array.from({length:n},(_,i)=>({id:String(i),tag:"TAG_"+String(i),formula:i===0?null:"TAG_"+String(i-1)+"+1"}));
 const rows:DependencyRow[]=Array.from({length:n-1},(_,i)=>({indicator_id:String(i+1),source_type:"indicator",source_indicator_id:String(i),source_calendar_tag:null}));
 const graph=buildDependencyGraph(nodes,rows);
 assert.equal(graph.order.length,n);
 assert.equal(impactedIndicatorIds(graph,["0"]).length,n);
});
test("chargement SQL et isolation des données sans cache global",async()=>{
 const query=async <T>(sql:string):Promise<{rows:T[]}>=>({rows:(sql.includes("smn_indicator_definition")?defs:edges) as T[]});
 const graph=await loadDependencyGraph({query});
 assert.equal(graph.order.length,4);
 const another=buildDependencyGraph([{id:"x",tag:"X",formula:null}],[]);
 assert.deepEqual(another.order,["x"]);
});
