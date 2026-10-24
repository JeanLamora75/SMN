import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {parseTiming,comparableTiming,formatTiming} from "../src/server/kanban/timing";
const base={cycle:{days:2.345678,convention:"calendar",source:"mesure interne"},lead:{days:null,convention:"unknown",source:""}};
describe("SMN-150 — moyennes de flux Kanban",()=>{
 it("AC1 — moyennes indépendantes et facultatives",()=>{
  assert.equal(parseTiming(base)?.lead.days,null);
  assert.equal(parseTiming(base)?.cycle.days,2.345678);
 });
 it("AC4 — jours ouvrés ou convention inconnue non comparables",()=>{
  assert.equal(comparableTiming({days:3,convention:"business",source:"outil externe"}),false);
  assert.equal(comparableTiming({days:3,convention:"unknown",source:"outil externe"}),false);
  assert.equal(comparableTiming({days:3,convention:"calendar",source:"confirmée"}),true);
 });
 it("AC5 — une décimale d'affichage sans perdre la source",()=>{
  assert.equal(formatTiming(2.345678,"fr"),"2,3");
  assert.equal(formatTiming(2.345678,"en"),"2.3");
  assert.equal(parseTiming(base)?.cycle.days,2.345678);
 });
 it("AC1 — rejette valeurs négatives et conventions non reconnues",()=>{
  assert.equal(parseTiming({...base,cycle:{...base.cycle,days:-1}}),null);
  assert.equal(parseTiming({...base,cycle:{...base.cycle,convention:"hours"}}),null);
 });
});
