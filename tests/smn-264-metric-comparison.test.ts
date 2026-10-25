import test from "node:test";
import assert from "node:assert/strict";
import {compareReportMetrics} from "../src/server/reports/report-data-refresh";
test("different values with the same units are comparable",()=>{
 const r=compareReportMetrics({committedSp:{value:21,unit:"SP"}},{committedSp:{value:24,unit:"SP"}})[0];
 assert.equal(r.changed,true);assert.equal(r.comparable,true);
});
test("missing metrics never become zero and mismatched units are identified",()=>{
 const changes=compareReportMetrics({committedSp:{value:null,unit:"SP"}},{committedSp:{value:0,unit:"SP"}});
 assert.equal(changes[0].oldValue,null);assert.equal(changes[0].newValue,0);
 const mismatch=compareReportMetrics({committedSp:{value:2,unit:"SP"}},{committedSp:{value:2,unit:"tickets"}})[0];
 assert.equal(mismatch.comparable,false);
});
