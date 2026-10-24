import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {cadenceChangeProposal} from "../src/server/kanban/cadence-change";

describe("SMN-143 — adapter seulement les périodes futures",()=>{
 const periods=[
  {id:"old",name:"Clôturée",status:"closed",startOn:"2026-09-01",endOn:"2026-09-30",timeZone:"Europe/Paris"},
  {id:"active",name:"En cours",status:"active",startOn:"2026-10-01",endOn:"2026-10-31",timeZone:"Europe/Paris"},
  {id:"future1",name:"Période A",status:"planned",startOn:"2026-11-01",endOn:"2026-11-30",timeZone:"Europe/Paris"},
  {id:"future2",name:"Période B",status:"planned",startOn:"2026-12-01",endOn:"2026-12-31",timeZone:"Europe/Paris"}
 ];
 it("AC1/AC2 — calcule à nouvelle cadence sans modifier les originaux",()=>{
  const before=JSON.stringify(periods);
  const result=cadenceChangeProposal(periods,"weekly","2026-10-24");
  assert.equal(result.canConfirm,true);
  assert.equal(result.changes.length,2);
  assert.equal(result.changes[0].proposed.endOn,"2026-11-07");
  assert.equal(result.changes[1].proposed.startOn,"2026-11-08");
  assert.equal(JSON.stringify(periods),before);
 });
 it("AC3/AC4 — exclut toute période passée, active ou clôturée",()=>{
  const result=cadenceChangeProposal(periods,"biweekly","2026-10-24");
  assert.deepEqual(result.changes.map(c=>c.id),["future1","future2"]);
  assert.equal(result.changes[0].proposed.name,"Période A");
 });
 it("AC5 — refuse les adaptations qui chevauchent une période protégée",()=>{
  const overlap=[...periods,{id:"locked",name:"Terminé",status:"finished",startOn:"2026-11-06",endOn:"2026-11-10",timeZone:"Europe/Paris"}];
  const result=cadenceChangeProposal(overlap,"weekly","2026-10-24");
  assert.equal(result.canConfirm,false);
  assert.deepEqual(result.changes[0].conflicts,["locked"]);
 });
 it("AC1 — aligne une future cadence mensuelle sur un mois civil complet",()=>{
  const sample=[{id:"a",name:"a",status:"planned",startOn:"2026-11-17",endOn:"2026-11-30",timeZone:"Europe/Paris"}];
  const result=cadenceChangeProposal(sample,"monthly","2026-10-24");
  assert.equal(result.changes[0].proposed.startOn,"2026-12-01");
  assert.equal(result.changes[0].proposed.endOn,"2026-12-31");
 });
});
