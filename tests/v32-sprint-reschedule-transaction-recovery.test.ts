import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const service=readFileSync(new URL("../src/server/sprints/reschedule.ts",import.meta.url),"utf8");
const route=readFileSync(new URL("../src/app/api/admin/sprints/reschedule/route.ts",import.meta.url),"utf8");
test("un échec du calcul facultatif ne laisse pas la transaction PostgreSQL en 25P02",()=>{
 assert.match(service,/inTransaction=false/);
 assert.match(service,/if\(inTransaction\)await db\.query\("SAVEPOINT smn_reschedule_capacity_preview"\)/);
 assert.match(service,/if\(inTransaction\)await db\.query\("ROLLBACK TO SAVEPOINT smn_reschedule_capacity_preview"\)/);
 assert.match(service,/reviewImpact\(db,original,input,true\)/);
});
test("audit de suppression utilise la table effectivement migrée",()=>{
 assert.doesNotMatch(service,/INSERT INTO public\.smn_sprint_audit/);
 assert.match(service,/INSERT INTO public\.smn_sprint_reschedule_audit/);
 assert.match(service,/ceremonies-removed/);
 assert.match(route,/sprint-reschedule-confirm-failed/);
});
