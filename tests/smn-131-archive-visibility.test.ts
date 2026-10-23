import test from "node:test";
import assert from "node:assert/strict";
import type {Client} from "pg";
import {authorizeExceptionalArchiveDeletion,hidePdfArchive} from "../src/server/reports/archive-visibility";
test("exceptional deletion is disabled until an audited deletion policy exists",()=>{assert.equal(authorizeExceptionalArchiveDeletion(),false);});
test("invalid hiding requests cannot access database",async()=>{
 const db={query:async()=>{throw Error("unexpected");}} as unknown as Client;
 assert.deepEqual(await hidePdfArchive(db,"invalid","admin","legal"),{ok:false,error:"invalid-input"});
 assert.deepEqual(await hidePdfArchive(db,"11111111-1111-4111-8111-111111111111","admin"," "),{ok:false,error:"invalid-input"});
});
