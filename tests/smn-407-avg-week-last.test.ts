import {test} from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {parseFormula,referencedTags,evaluateFormula,FormulaSyntaxError} from "../src/server/indicators/formula";
import {calculateHistorical,type HistoricalPoint} from "../src/server/indicators/formula/history";
import {loadHistoricalResolver} from "../src/server/indicators/formula/historical-context";

const history:HistoricalPoint[]=[
 {cycleId:"s101",label:"Sprint 101",value:"40",durationDays:14},
 {cycleId:"s102",label:"Sprint 102",value:"45",durationDays:21},
 {cycleId:"s103",label:"Sprint 103",value:"35",durationDays:14}
];

test("AVG_WEEK_LAST parses and depends on the referenced tag",()=>{
 const expression=parseFormula("ROUND(AVG_WEEK_LAST(SP_TERMINES, 3), 2)");
 assert.deepEqual(referencedTags(expression),["SP_TERMINES"]);
 for(const invalid of ["AVG_WEEK_LAST(A,0)","AVG_WEEK_LAST(A,-1)","AVG_WEEK_LAST(A,2.5)","AVG_WEEK_LAST(2,3)","AVG_WEEK_LAST(A,1001)"])
  assert.throws(()=>parseFormula(invalid),FormulaSyntaxError);
});

test("AVG_WEEK_LAST divides total values by summed prorated calendar weeks",()=>{
 assert.deepEqual(calculateHistorical("AVG_WEEK_LAST",history,3),
  {kind:"available",value:"17.142857142857142857142857"});
 // Ten calendar days count as 10/7, never as two whole weeks.
 assert.deepEqual(calculateHistorical("AVG_WEEK_LAST",[
  {cycleId:"ten",label:"Ten days",value:"20",durationDays:10}],1),
  {kind:"available",value:"14"});
 assert.deepEqual(calculateHistorical("AVG_WEEK_LAST",history,2),
  {kind:"available",value:"16"});
});

test("AVG_WEEK_LAST includes selected cycle and uses existing shorter windows",()=>{
 assert.deepEqual(calculateHistorical("AVG_WEEK_LAST",history.slice(0,1),5),
  {kind:"available",value:"20"});
 const result=evaluateFormula(parseFormula("ROUND(AVG_WEEK_LAST(SP_TERMINES,3),2)"),{},1000,
  (name,tag,count)=>{
   assert.equal(tag,"SP_TERMINES");
   const value=calculateHistorical(name,history,count);
   assert.notEqual(value.kind,"series");
   return value as Exclude<typeof value,{kind:"series"}>;
  });
 assert.deepEqual(result,{kind:"available",value:"17.14"});
});

test("AVG_WEEK_LAST handles null values, zero, and invalid duration distinctly",()=>{
 assert.deepEqual(calculateHistorical("AVG_WEEK_LAST",[
  {...history[0],value:null},history[1]],2),{kind:"unavailable",reason:"missing_source"});
 for(const days of [undefined,null,0,-1,1.5]){
  const input:HistoricalPoint[]=[{...history[0],durationDays:days}];
  assert.deepEqual(calculateHistorical("AVG_WEEK_LAST",input,1),
   {kind:"unavailable",reason:"invalid_domain",detail:"historical-cycle-duration"});
 }
 assert.deepEqual(calculateHistorical("AVG_WEEK_LAST",[
  {...history[0],value:"0"}],1),{kind:"available",value:"0"});
});

type FakeCycle={id:string;name:string;status:string;start_date:string;end_date:string};
function fakeDatabase(cycles:FakeCycle[],options:{closed?:boolean}={}){
 const queries:{sql:string;params:unknown[]|undefined}[]=[];
 const rows=cycles.map((c,i)=>({cycle_id:c.id,indicator_id:"tag-id",value:String((i+1)*14)}));
 const db={query:async(sql:string,params?:unknown[])=>{
  queries.push({sql,params});
  if(sql.includes("AS start_date"))return {rows:cycles};
  if(sql.includes("smn_indicator_manual_value"))return {rows};
  if(sql.includes("smn_indicator_computed_result"))return {rows:[]};
  if(sql.includes("smn_sprint_closure_snapshot"))return {rows:options.closed?[{
   sprint_id:cycles[0].id,snapshot:{indicatorsV33:[{id:"tag-id",value:"28"}]}
  }]:[]};
  throw Error("unexpected SQL: "+sql);
 }} as unknown as Client;
 return {db,queries};
}

test("Scrum historical resolver reads team-scoped dates, frozen snapshots, and excludes future cycles",async()=>{
 const cycles=[
  {id:"s1",name:"S1",status:"closed",start_date:"2026-01-01",end_date:"2026-01-15"},
  {id:"s2",name:"S2",status:"active",start_date:"2026-02-01",end_date:"2026-02-11"},
  {id:"future",name:"Future",status:"planned",start_date:"2026-03-01",end_date:"2026-03-15"}
 ];
 const {db,queries}=fakeDatabase(cycles,{closed:true});
 const historical=await loadHistoricalResolver(db,{teamId:"team-1",cycleType:"scrum",cycleId:"s2"},new Map([["SP_TERMINES","tag-id"]]));
 assert.deepEqual(historical("AVG_WEEK_LAST","SP_TERMINES",2,"21"),
  {kind:"available",value:"14.291666666666666666666667"});
 assert.ok(queries.some(q=>q.sql.includes("smn_sprint")&&q.sql.includes("start_at::date::text")));
 assert.ok(queries.every(q=>!q.params||q.params[0]==="team-1"));
 assert.ok(!JSON.stringify(queries).includes('"future"'));
});

test("Kanban historical resolver uses period dates without sprint snapshots",async()=>{
 const {db,queries}=fakeDatabase([
  {id:"k1",name:"K1",status:"active",start_date:"2026-01-01",end_date:"2026-01-11"}
 ]);
 const historical=await loadHistoricalResolver(db,{teamId:"team-1",cycleType:"kanban",cycleId:"k1"},new Map([["SP_TERMINES","tag-id"]]));
 assert.deepEqual(historical("AVG_WEEK_LAST","SP_TERMINES",1,"20"),{kind:"available",value:"14"});
 assert.ok(queries.some(q=>q.sql.includes("smn_kanban_period")&&q.sql.includes("end_on::date::text")));
 assert.ok(!queries.some(q=>q.sql.includes("smn_sprint_closure_snapshot")));
});
