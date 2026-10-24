import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {periodFromStart,normalizePeriodName,defaultPeriodName} from "../src/server/kanban/dates";

describe("SMN-140 — nommage Kanban",()=>{
 it("AC1 — nom mensuel par mois calculé",()=>{
  assert.equal(periodFromStart("2026-11-01","monthly").name,"Période Kanban — novembre 2026");
  assert.equal(defaultPeriodName("2028-02-01","2028-02-29","monthly"),"Période Kanban — février 2028");
 });
 it("AC2 — le nom de 7 ou 14 jours suit les bornes",()=>{
  assert.equal(periodFromStart("2026-11-02","weekly").name,"Période Kanban — 2026-11-02 au 2026-11-08");
  assert.equal(periodFromStart("2026-11-02","biweekly").name,"Période Kanban — 2026-11-02 au 2026-11-15");
 });
 it("AC3 — refus des noms vides et conservation des accents/chiffres",()=>{
  assert.equal(normalizePeriodName("  \t  "),null);
  assert.equal(normalizePeriodName("  Équipe 42 — été  "), "Équipe 42 — été");
  assert.equal(normalizePeriodName(123),null);
  assert.equal(normalizePeriodName("a".repeat(201)),null);
 });
});
