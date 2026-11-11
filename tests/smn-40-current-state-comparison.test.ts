import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {validComparisonTarget} from "../scripts/smn-40-current-state-comparison";

const source="postgresql://smn_live:opaque@127.0.0.1:5432/smn";
const good="postgresql://smn_test:opaque@127.0.0.1:57190/smn_restore_test_newpc_abcdef12";
test("comparison accepts only a distinct isolated new-PC PostgreSQL instance",()=>{
 assert.equal(validComparisonTarget(source,good),true);
 assert.equal(validComparisonTarget(source,source),false);
 assert.equal(validComparisonTarget(source,good.replace(":57190",":57186")),false);
 assert.equal(validComparisonTarget(source,good.replace("smn_test","smn_live")),false);
 assert.equal(validComparisonTarget(source,good.replace("newpc_abcdef12","rec04_abcdef12")),false);
 assert.equal(validComparisonTarget(source,good.replace("127.0.0.1","external.example")),false);
});
test("current-state comparison returns hashes only and refuses production writes",()=>{
 const script=readFileSync(new URL("../scripts/smn-40-current-state-comparison.ts",import.meta.url),"utf8");
 assert.match(script,/fingerprintPublicTables\(a\)/);
 assert.match(script,/fingerprintPublicTables\(b\)/);
 assert.match(script,/READ ONLY/);
 assert.match(script,/sourceFreezeAttested:false/);
 assert.match(script,/restorationAuthorized:false/);
 assert.doesNotMatch(script,/ALTER DATABASE|DROP DATABASE|CREATE DATABASE|\bDELETE FROM\b|pg_restore|writeFile\(/i);
});
