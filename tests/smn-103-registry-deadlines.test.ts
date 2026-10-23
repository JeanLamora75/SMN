import test from "node:test";
import assert from "node:assert/strict";
import {deadlineState} from "../src/lib/registry-deadlines";
test("trois jours calendaires par défaut et échéance dépassée",()=>{
 assert.equal(deadlineState("action","todo","2026-10-26","2026-10-23"),"upcoming");
 assert.equal(deadlineState("dependency","open","2026-10-24","2026-10-23"),"upcoming");
 assert.equal(deadlineState("action","in_progress","2026-10-22","2026-10-23"),"overdue");
 assert.equal(deadlineState("dependency","in_progress","2026-10-27","2026-10-23"),null);
});
test("une fiche inactive ou sans échéance ne produit aucune alerte",()=>{
 for(const [type,status] of [["action","completed"],["action","cancelled"],["dependency","satisfied"],["dependency","cancelled"]]){
  assert.equal(deadlineState(type,status,"2026-10-01","2026-10-23"),null);
 }
 assert.equal(deadlineState("action","todo",null,"2026-10-23"),null);
 assert.equal(deadlineState("dependency","open",null,"2026-10-23"),null);
});
test("modification du seuil ne change que la projection",()=>{
 assert.equal(deadlineState("action","todo","2026-10-28","2026-10-23",3),null);
 assert.equal(deadlineState("action","todo","2026-10-28","2026-10-23",5),"upcoming");
});
