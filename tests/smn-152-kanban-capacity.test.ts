import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {safeKanbanGap,parseFrozenKanbanCapacity} from "../src/server/kanban/capacity-view";
describe("SMN-152 — écarts fiables de capacité Kanban",()=>{
 it("AC2 — un écart n'est pas calculé pour une période future",()=>{
  assert.equal(safeKanbanGap(5,7,"planned"),null);
  assert.equal(safeKanbanGap(5,7,"active"),null);
 });
 it("AC3 — seuls les écarts de cycles terminés ou clôturés sont consolidés",()=>{
  assert.equal(safeKanbanGap(5,7,"finished"),2);
  assert.equal(safeKanbanGap(8,5.5,"closed"),-2.5);
 });
 it("AC4 — les valeurs absentes ne deviennent jamais zéro",()=>{
  assert.equal(safeKanbanGap(null,0,"finished"),null);
  assert.equal(safeKanbanGap(0,null,"finished"),null);
  assert.equal(safeKanbanGap(0,0,"finished"),0);
 });
});


const file=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const frozen={
 initialJh:8,initialProvenance:"calculated",actualOpenedAt:"2026-10-01T09:00:00+02:00",
 actualReferenceJh:6,actualManualJh:5,actualRetainedJh:5,
 actualSource:"Saisie",gapJh:-3,observedThrough:"2026-10-31",realStatus:"finished",
 missingSources:[] as string[]
};
describe("SMN-152 — validation de l'ouverture et des snapshots Vn",()=>{
 it("AC1 — capture une fois sur l'ouverture réelle, avec provenance et contrainte d'unicité",()=>{
  const src=file("src/server/kanban/states.ts")+"\n"+file("prisma/migrations/20261029_kanban_runtime_ddl/migration.sql");
  assert.match(src,/DO \$\$ BEGIN/);
  assert.match(src,/END; \$\$;/);
  assert.match(src,/period_id text PRIMARY KEY REFERENCES public\.smn_kanban_period/);
  assert.match(src,/ON CONFLICT\(period_id\) DO NOTHING/);
  assert.match(src,/openingWasMissed\?"recovered":"on-time"/);
  assert.match(src,/openingProvenance="historical-unavailable"/);
 });
 it("AC5 — capacité clôturée relue depuis le dernier snapshot Vn, pas du moteur actuel",()=>{
  const raw={period:{status:"closed"},capacity:frozen};
  const observed=parseFrozenKanbanCapacity(raw);
  assert.deepEqual(observed,frozen);
  // After closure, later corrections to live availability cannot alter this frozen payload.
  const recalculated={...frozen,actualRetainedJh:13,gapJh:5};
  assert.deepEqual(parseFrozenKanbanCapacity(raw),frozen);
  assert.notDeepEqual(observed,recalculated);
  const read=file("src/server/kanban/report.ts");
  assert.match(read,/p\.status==="closed"\?/);
  assert.match(read,/ORDER BY version DESC LIMIT 1/);
  assert.match(read,/parseFrozenKanbanCapacity\(archived\?\.rows\[0\]\?\.snapshot\)/);
  const closure=file("src/server/kanban/closure.ts");
  assert.match(closure,/readKanbanCapacityView\(db,period\.team_id,period\.start_on,period\.end_on,"finished",period\.id\)/);
 });
 it("AC4/5 — un snapshot absent ou invalide reste indisponible",()=>{
  assert.equal(parseFrozenKanbanCapacity(null),null);
  assert.equal(parseFrozenKanbanCapacity({}),null);
  assert.equal(parseFrozenKanbanCapacity({capacity:{...frozen,gapJh:NaN}}),null);
  assert.equal(parseFrozenKanbanCapacity({capacity:{...frozen,realStatus:"active"}}),null);
  assert.equal(parseFrozenKanbanCapacity({capacity:{...frozen,missingSources:[{source:"missing"}]}}),null);
  assert.deepEqual(parseFrozenKanbanCapacity({capacity:{...frozen,initialJh:null,
   actualManualJh:null,actualRetainedJh:null,gapJh:null}})?.gapJh,null);
 });
});
