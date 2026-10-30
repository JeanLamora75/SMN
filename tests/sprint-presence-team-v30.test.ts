import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

test("Présence Sprint : contexte équipe explicite et lecture v28-v31",()=>{
 const presence=readFileSync(new URL("../src/server/sprints/presence-detail-read.ts",import.meta.url),"utf8");
 const engine=readFileSync(new URL("../src/server/capacity/engine.ts",import.meta.url),"utf8");
 assert.match(presence,/externalTransaction:true,includeExceptionalImpact:false,teamId/);
 assert.match(engine,/i\\.schema_version BETWEEN 28 AND 32/);
 assert.match(engine,/AND t\.id=\$1 LIMIT 2/);
 assert.match(engine,/i\.schema_version<=27/);
 assert.match(presence,/capacity\.team\.id!==teamId/);
});
