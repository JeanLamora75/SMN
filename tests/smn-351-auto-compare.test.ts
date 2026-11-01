import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assertSafeSource} from "../scripts/smn-351-auto-compare";
test("SMN-351 auto: reject remote DB and non-SMN source",()=>{
 for(const url of ["postgresql://me:pw@example.org:5432/smn","postgresql://me:pw@127.0.0.1:5432/postgres"])assert.throws(()=>assertSafeSource(url));
 assert.equal(assertSafeSource("postgresql://me:pw@127.0.0.1:5432/smn").pathname,"/smn");
});
test("SMN-351 auto: isolated unique scratch databases and no cleanup approval",()=>{
 const source=readFileSync("scripts/smn-351-auto-compare.ts","utf8");
 assert.match(source,/smn_351_fresh_/);
 assert.match(source,/smn_351_migrated_/);
 assert.match(source,/cleanupAuthorized:false/);
 assert.match(source,/DROP DATABASE/);
 assert.doesNotMatch(source,/DROP TABLE|TRUNCATE TABLE/);
 assert.match(source,/applyV33\(db,true\)/);
 assert.match(source,/installExpress/);
});

test("SMN-351 auto: migrated v33 applies native additive palette and team grants",()=>{
 const source=readFileSync("scripts/smn-351-auto-compare.ts","utf8");
 assert.match(source,/paletteMigrationBody\(paletteSql\)/);
 assert.match(source,/20261031_red_purple_palette\/migration\.sql/);
 assert.match(source,/20261101_smn347_team_grants\/migration\.sql/);
 assert.match(source,/await db\.query\(grantsSql\)/);
 assert.match(source,/await db\.query\("COMMIT"\)/);
});
