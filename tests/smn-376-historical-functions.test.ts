import {test} from "node:test";
import assert from "node:assert/strict";
import {calculateHistorical,type HistoricalPoint} from "../src/server/indicators/formula/history";
const history:HistoricalPoint[]=[
 {cycleId:"s1",label:"Sprint 1",value:"20"},
 {cycleId:"s2",label:"Sprint 2",value:"30"},
 {cycleId:"s3",label:"Sprint 3",value:"40"}
];
test("aggregation includes selected cycle and uses available shorter history",()=>{
 assert.deepEqual(calculateHistorical("SUM_LAST",history,5),{kind:"available",value:"90"});
 assert.deepEqual(calculateHistorical("AVG_LAST",history,2),{kind:"available",value:"35"});
 assert.deepEqual(calculateHistorical("MIN_LAST",history,3),{kind:"available",value:"20"});
 assert.deepEqual(calculateHistorical("MAX_LAST",history,2),{kind:"available",value:"40"});
});
test("previous and deltas address exact offset",()=>{
 assert.deepEqual(calculateHistorical("PREVIOUS",history,1),{kind:"available",value:"30"});
 assert.deepEqual(calculateHistorical("DELTA",history,2),{kind:"available",value:"20"});
 assert.deepEqual(calculateHistorical("DELTA_PCT",history,2),{kind:"available",value:"100"});
 assert.equal(calculateHistorical("PREVIOUS",history,3).kind,"unavailable");
});
test("series preserves labels, missing values and chronological order",()=>{
 const missing=[...history.slice(0,2),{cycleId:"s3",label:"Sprint 3",value:null}];
 assert.deepEqual(calculateHistorical("LAST_VALUES",missing,2),{kind:"series",points:missing.slice(1),requested:2,available:2});
 assert.equal(calculateHistorical("SUM_LAST",missing,2).kind,"unavailable");
});
test("zero baseline and invalid windows do not fabricate results",()=>{
 assert.equal(calculateHistorical("DELTA_PCT",[{cycleId:"a",label:"A",value:"0"},{cycleId:"b",label:"B",value:"10"}],1).kind,"unavailable");
 assert.throws(()=>calculateHistorical("SUM_LAST",history,0),RangeError);
});
