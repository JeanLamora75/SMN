import {test} from "node:test";
import assert from "node:assert/strict";
import {FormulaBudgetError} from "../src/server/indicators/formula";
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
 const query=async (sql:string):Promise<{rows:unknown[]}>=>({rows:sql.trimStart().startsWith("SELECT id,tag,formula")?defs:edges});
 const graph=await loadDependencyGraph({query});
 assert.equal(graph.order.length,4);
 const another=buildDependencyGraph([{id:"x",tag:"X",formula:null}],[]);
 assert.deepEqual(another.order,["x"]);
});

test("source calendaire cachée : impact transitif et motif de manque conservé",()=>{
 const graph=buildDependencyGraph([
  {id:"base",tag:"BASE",formula:"CAL_WORKING_DAYS*2",isActive:false},
  {id:"final",tag:"FINAL",formula:"BASE+1"},
  {id:"alone",tag:"ALONE",formula:"4"}
 ],[
  {indicator_id:"base",source_type:"calendar",source_indicator_id:null,source_calendar_tag:"CAL_WORKING_DAYS"},
  {indicator_id:"final",source_type:"indicator",source_indicator_id:"base",source_calendar_tag:null}
 ]);
 assert.deepEqual(impactedIndicatorIds(graph,[],["CAL_WORKING_DAYS"]),["base","final"]);
 const missing=evaluateDependencies({graph,indicators:{},calendar:{CAL_WORKING_DAYS:null}});
 assert.deepEqual(missing.get("base"),{kind:"unavailable",reason:"missing_source",sourceTag:"CAL_WORKING_DAYS"});
 assert.deepEqual(missing.get("final"),{kind:"unavailable",reason:"dependency_unavailable",sourceTag:"BASE"});
 const subset=evaluateDependencies({graph,indicators:{},calendar:{CAL_WORKING_DAYS:"3"},changedCalendarTags:["CAL_WORKING_DAYS"]});
 assert.equal(subset.has("alone"),false);
 assert.deepEqual(subset.get("final"),{kind:"available",value:"7"});
});
test("budgets DAG et expressions manuelles sans arêtes",()=>{
 const large=Array.from({length:10001},(_,i)=>({id:String(i),tag:"TAG_"+i,formula:null}));
 assert.throws(()=>buildDependencyGraph(large,[]),e=>e instanceof DependencyGraphError&&e.code==="budget");
 assert.throws(()=>buildDependencyGraph([{id:"m",tag:"MANUAL",formula:null}],[
  {indicator_id:"m",source_type:"calendar",source_indicator_id:null,source_calendar_tag:"CAL_WORKING_DAYS"}
 ]),e=>e instanceof DependencyGraphError&&e.code==="formula_mismatch");
});

test("une cascade de formules bornées individuellement respecte un budget global",()=>{
 const formula="MIN("+Array.from({length:200},()=>"1").join(",")+")";
 const definitions=Array.from({length:550},(_,i)=>({id:String(i),tag:"K_"+i,formula}));
 const graph=buildDependencyGraph(definitions,[]);
 assert.throws(()=>evaluateDependencies({graph,indicators:{},calendar:{}}),FormulaBudgetError);
});
