import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {qualityFromSnapshot,readReportDataQuality} from "../src/server/reports/data-quality";
test("V2 preserves closure date and does not infer absent capacity",()=>{
 const q=qualityFromSnapshot({capacity:{initial_jh:"30",actual_jh:null,provenance:{initial:"calculated"}}},2,"2026-10-24");
 assert.equal(q.snapshotVersion,2);assert.equal(q.capacity.initial.source,"calculated");
 assert.equal(q.capacity.actual.quality,"unavailable");
});
test("nonclosed report provisional without querying historical tables",async()=>{
 const client={query:async()=>{throw Error("must not query");}} as unknown as Client;
 const q=await readReportDataQuality(client,"cycle","finished");
 assert.equal(q.state,"provisional");assert.equal(q.capacity.initial.quality,"unavailable");
});
test("missing historic table means missing history not live reconstruction",async()=>{
 const client={query:async()=>({rows:[{exists:false}]})} as unknown as Client;
 const q=await readReportDataQuality(client,"cycle","closed");
 assert.equal(q.state,"history-missing");assert.equal(q.snapshotVersion,null);
});
