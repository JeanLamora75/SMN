import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
describe("SMN-175 — clôture historique partielle",()=>{
 const source=readFileSync("src/server/sprints/closure.ts","utf8");
 it("détecte explicitement une création historique",()=>{
  assert.match(source,/action='historical-created'/);
  assert.match(source,/historicalClosure/);
 });
 it("n'assimile pas les registres actuels à une photographie passée",()=>{
  assert.match(source,/state:"historical-unavailable"/);
  assert.match(source,/historical\?\{state:"historical-unavailable"/);
  assert.match(source,/memberPresenceProvenance:historical\?"retrospective-calendar-estimate":"closure-calendar-estimate"/);
 });
 it("restitue les capacités qualifiées sans extrapoler les données actuelles",()=>{
  assert.match(source,/to_regclass\('public\.smn_sprint_historical_capacity'\)/);
  assert.match(source,/initialQuality/);
  assert.match(source,/actualQuality/);
 });
 it("préserve la transaction versionnée et le rollback",()=>{
  assert.match(source,/INSERT INTO public\.smn_sprint_closure_snapshot/);
  assert.match(source,/await db\.query\("COMMIT"\)/);
  assert.match(source,/await db\.query\("ROLLBACK"\)/);
 });
});
