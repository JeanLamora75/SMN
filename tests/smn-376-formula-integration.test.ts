import {test} from "node:test";
import assert from "node:assert/strict";
import {parseFormula,referencedTags,evaluateFormula,FormulaSyntaxError} from "../src/server/indicators/formula";
import {calculateHistorical,type HistoricalPoint} from "../src/server/indicators/formula/history";

const points:HistoricalPoint[]=[
 {cycleId:"s1",label:"S1",value:"10"},
 {cycleId:"s2",label:"S2",value:"20"},
 {cycleId:"s3",label:"S3",value:"30"}
];
test("historical syntax preserves referenced indicator dependency",()=>{
 assert.deepEqual(referencedTags(parseFormula("ROUND(AVG_LAST(SP_TERMINES,3),2)")),["SP_TERMINES"]);
 assert.deepEqual(referencedTags(parseFormula("SUM_LAST(SP_TERMINES,2)+PREVIOUS(TICKETS,1)")),["SP_TERMINES","TICKETS"]);
});
test("historical scalar functions compose with existing decimal operations",()=>{
 const resolver=(name:Parameters<typeof calculateHistorical>[0],tag:string,count:number)=>{
  assert.equal(tag,"SP_TERMINES");
  const r=calculateHistorical(name,points,count);
  assert.notEqual(r.kind,"series");
  return r as Exclude<typeof r,{kind:"series"}>;
 };
 assert.deepEqual(evaluateFormula(parseFormula("ROUND(AVG_LAST(SP_TERMINES,3)+PREVIOUS(SP_TERMINES,1),2)"),{},1000,resolver),{kind:"available",value:"40"});
 assert.deepEqual(evaluateFormula(parseFormula("DELTA_PCT(SP_TERMINES,1)"),{},1000,resolver),{kind:"available",value:"50"});
});
test("historical grammar rejects invalid tag or window",()=>{
 for(const f of ["SUM_LAST(A,0)","SUM_LAST(A,-1)","SUM_LAST(A,1.5)","SUM_LAST(2,5)","SUM_LAST(A,B)","SUM_LAST(A,1001)"])
  assert.throws(()=>parseFormula(f),FormulaSyntaxError);
});
test("historical dependencies unavailable without a cycle-scoped resolver",()=>{
 assert.deepEqual(evaluateFormula(parseFormula("SUM_LAST(A,2)"),{}),{kind:"unavailable",reason:"missing_source",sourceTag:"A"});
});
