import test from "node:test";
import assert from "node:assert/strict";
import {metricDescriptor,metricScale,limitedHistory} from "../src/lib/report-metric-view";
import {calculateHistorical} from "../src/server/indicators/formula/history";

test("legacy report compatibility preserves an absent metric as null",()=>{
 const v=metricDescriptor("committedSp",{});
 assert.equal(v.value,null);
});
test("capacity remains JH and is never treated as consumed effort",()=>{
 const v=metricDescriptor("plannedJh",{plannedJh:{value:32,unit:"JH",sourceId:"snapshot-1"}});
 assert.equal(v.unit,"JH");
 assert.match(v.label,/disponible/);
 assert.equal(v.source,"snapshot-1");
});
test("v33 historical formulas respect the requested window, not a legacy fixed five-cycle limit",()=>{
 const points=Array.from({length:7},(_,i)=>({cycleId:String(i),label:"S"+i,value:String(i+1)}));
 const result=calculateHistorical("LAST_VALUES",points,7);
 assert.equal(result.kind,"series");
 if(result.kind==="series")assert.equal(result.points.length,7);
});
test("legacy report view remains bounded for compatibility",()=>{assert.equal(limitedHistory([1,2,3,4,5,6,7],99).length,5);});
test("no imaginary scale for absent values",()=>{assert.equal(metricScale(null,100),null);});
