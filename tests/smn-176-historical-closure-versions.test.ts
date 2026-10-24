import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
describe("SMN-176 — versions de clôture historique",()=>{
 const closure=readFileSync("src/server/sprints/closure.ts","utf8");
 it("crée une version supérieure après réouverture, sans modifier les clichés précédents",()=>{
  assert.match(closure,/COALESCE\(MAX\(version\),0\)\+1/);
  assert.match(closure,/INSERT INTO public\.smn_sprint_closure_snapshot/);
  assert.doesNotMatch(closure,/(?:UPDATE|DELETE FROM) public\.smn_sprint_closure_snapshot/);
 });
 it("conserve la réouverture dans l'audit et revient à Terminé",()=>{
  assert.match(closure,/v\.action==="reopen"&&s\.status!=="closed"/);
  assert.match(closure,/const target=v\.action==="close"\?"closed":"finished"/);
  assert.match(closure,/smn_sprint_closure_audit/);
 });
 it("inclut le numéro et l'horodatage réel de chaque clôture rétrospective",()=>{
  assert.match(closure,/clock_timestamp\(\)/);
  assert.match(closure,/priorVersions:version-1/);
  assert.match(closure,/historicRegistryState:"historical-unavailable"/);
 });
 it("ne recalcule pas les registres actuels dans le cliché historique",()=>{
  assert.match(closure,/historical\?\{state:"historical-unavailable"/);
 });
});
