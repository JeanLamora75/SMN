import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {batchPreview} from "../src/server/kanban/batch-preview";
describe("SMN-138 — aperçu lot Kanban",()=>{
 it("AC1/AC2 — produit deux à six périodes sans écriture",()=>{
  const result=batchPreview("2026-10-26",3,"weekly",[]);
  assert.equal(result.items.length,3);
  assert.equal(result.items[2].endOn,"2026-11-15");
  assert.equal(result.canConfirm,true);
  assert.throws(()=>batchPreview("2026-10-26",7,"weekly",[]));
  assert.throws(()=>batchPreview("2026-10-26",1.5,"weekly",[]));
 });
 it("AC3 — identifie les conflits avec les périodes enregistrées",()=>{
  const result=batchPreview("2026-10-26",3,"weekly",[{id:"existing",startOn:"2026-11-02",endOn:"2026-11-08"}]);
  assert.equal(result.canConfirm,false);
  assert.deepEqual(result.items[1].conflicts,["existing"]);
  assert.equal(result.items[0].conflicts.length,0);
 });
 it("AC4 — recalcule entièrement le lot depuis une autre date",()=>{
  const a=batchPreview("2026-10-26",2,"biweekly",[]);
  const b=batchPreview("2026-11-09",2,"biweekly",[]);
  assert.notEqual(a.items[0].startOn,b.items[0].startOn);
  assert.equal(b.items[1].startOn,"2026-11-23");
 });
 it("AC5 — calcul pur sans mutation des cycles existants",()=>{
  const existing=[{id:"x",startOn:"2026-10-01",endOn:"2026-10-31"}];
  batchPreview("2026-10-01",2,"monthly",existing);
  assert.deepEqual(existing,[{id:"x",startOn:"2026-10-01",endOn:"2026-10-31"}]);
 });
});
