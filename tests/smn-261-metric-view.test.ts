import test from "node:test";
import assert from "node:assert/strict";
import {metricDescriptor,metricScale,limitedHistory} from "../src/lib/report-metric-view";
test("missing value stays null, not fabricated zero",()=>{const v=metricDescriptor("committedSp",{});assert.equal(v.value,null);});
test("capacity remains JH and is not interpreted as effort consumed",()=>{const v=metricDescriptor("plannedJh",{plannedJh:{value:32,unit:"JH",sourceId:"snapshot-1"}});assert.equal(v.unit,"JH");assert.match(v.label,/disponible/);assert.equal(v.source,"snapshot-1");});
test("history window never exceeds five cycles",()=>{assert.equal(limitedHistory([1,2,3,4,5,6,7],99).length,5);});
test("no imaginary scale for absent values",()=>{assert.equal(metricScale(null,100),null);});
