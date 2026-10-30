import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const source=readFileSync(new URL("../src/server/sprints/reschedule.ts",import.meta.url),"utf8");
test("preview without BEGIN never releases a non-existent savepoint",()=>{
 const fn=source.slice(source.indexOf("async function reviewImpact("),source.indexOf("export async function ensureRescheduleSchema"));
 assert.match(fn,/inTransaction=false/);
 assert.match(fn,/if\(inTransaction\)await db\.query\("SAVEPOINT smn_reschedule_capacity_preview"\)/);
 assert.match(fn,/if\(inTransaction\)await db\.query\("ROLLBACK TO SAVEPOINT smn_reschedule_capacity_preview"\)/);
 assert.equal((fn.match(/if\(inTransaction\)await db\.query\("RELEASE SAVEPOINT smn_reschedule_capacity_preview"\)/g)||[]).length,2);
});
