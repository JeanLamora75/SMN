import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {parseBatchRequest} from "../src/server/kanban/batch-create";
import {batchPreview} from "../src/server/kanban/batch-preview";
describe("SMN-139 — contrat de confirmation du lot",()=>{
 it("AC1 — n'accepte que les lots de 2 à 6 avec révision de prévisualisation",()=>{
  assert.deepEqual(parseBatchRequest({startOn:"2026-11-01",quantity:2,cadenceRevision:1}),{startOn:"2026-11-01",quantity:2,cadenceRevision:1});
  for(const quantity of [0,1,7,2.5])assert.equal(parseBatchRequest({startOn:"2026-11-01",quantity,cadenceRevision:1}),null);
  assert.equal(parseBatchRequest({startOn:"2026-11-01",quantity:2}),null);
 });
 it("AC2/AC5 — chevauchement bloqué, dates contiguës autorisées",()=>{
  const existing=[{id:"old",startOn:"2026-10-01",endOn:"2026-10-31"}];
  const ok=batchPreview("2026-11-01",2,"monthly",existing);
  assert.equal(ok.canConfirm,true);
  const conflict=batchPreview("2026-10-01",2,"monthly",existing);
  assert.equal(conflict.canConfirm,false);
  assert.deepEqual(conflict.items[0].conflicts,["old"]);
 });
});
