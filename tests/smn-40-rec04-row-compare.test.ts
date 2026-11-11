import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {compareFingerprints} from "../src/server/backup/restore-row-fingerprint";

const one={tables:[
 {table:"smn_a",rows:2,sha256:"a".repeat(64)},
 {table:"smn_b",rows:0,sha256:"b".repeat(64)}
],digest:"c".repeat(64)};
test("matching table and row hashes are consistent but not a live deployment approval",()=>{
 const result=compareFingerprints(one,structuredClone(one));
 assert.equal(result.equivalent,true);
 assert.deepEqual(result.differences,[]);
});
test("missing tables, changed values or counts fail comparison",()=>{
 assert.deepEqual(compareFingerprints(one,{
  tables:[{table:"smn_a",rows:2,sha256:"d".repeat(64)}],
  digest:"e".repeat(64)
 }).differences,["smn_a","smn_b"]);
 assert.equal(compareFingerprints(one,{...one,digest:"0".repeat(64)}).equivalent,false);
});
test("row comparison is read only, scope limited and hashes values inside Postgres",()=>{
 const script=readFileSync(new URL("../scripts/smn-40-rec04-row-compare.ts",import.meta.url),"utf8");
 const algorithm=readFileSync(new URL("../src/server/backup/restore-row-fingerprint.ts",import.meta.url),"utf8");
 assert.match(script,/BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY/);
 assert.match(script,/SMN40_SECOND_RESTORE_URL/);
 assert.match(algorithm,/sha256\(convert_to\(to_jsonb\(t\)::text/);
 assert.match(algorithm,/fingerprint-table-too-large/);
 assert.doesNotMatch(script,/DROP DATABASE|CREATE DATABASE|pg_restore|ALTER DATABASE/);
});
