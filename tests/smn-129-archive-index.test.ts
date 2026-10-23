import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {listCyclePdfArchives,verifyArchiveIntegrity} from "../src/server/reports/archive-index";
test("No table yields empty archive listing, never a synthetic PDF",async()=>{
 const db={query:async()=>({rows:[{present:false}]})} as unknown as Client;
 assert.deepEqual(await listCyclePdfArchives(db,"11111111-1111-4111-8111-111111111111","team"),[]);
});
test("Missing archive table reported unavailable",async()=>{
 const db={query:async()=>({rows:[{present:false}]})} as unknown as Client;
 assert.equal(await verifyArchiveIntegrity(db,"11111111-1111-4111-8111-111111111111"),"unavailable");
});
test("Invalid archive ids rejected before filesystem lookup",async()=>{
 const db={query:async()=>{throw Error("should not query");}} as unknown as Client;
 assert.equal(await verifyArchiveIntegrity(db,"../../secret"),"unavailable");
});
