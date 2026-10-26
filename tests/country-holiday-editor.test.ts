import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {isCivilDate,parseYearSnapshot,affectedYears} from "../src/lib/countries/holiday-editor";

const annual={country:"FR",year:2026,revision:1,status:"partial",
 administrativeValidated:false,fingerprint:"a".repeat(64),
 holidays:[{date:"2026-05-01",name:"Fête du Travail"}]};

describe("Editeur jours fériés nationaux",()=>{
 it("valide les jours civils y compris années bissextiles et bornes",()=>{
  assert.equal(isCivilDate("2028-02-29"),true);
  assert.equal(isCivilDate("2027-02-29"),false);
  assert.equal(isCivilDate("2026-02-30"),false);
  assert.equal(isCivilDate("2026-05-01"),true);
  assert.equal(isCivilDate("2201-01-01"),false);
 });
 it("ne réutilise pas de dates d'une autre année",()=>{
  assert.deepEqual(parseYearSnapshot(annual,"FR",2026),annual);
  assert.equal(parseYearSnapshot(annual,"FR",2027),null);
  assert.equal(parseYearSnapshot(annual,"DE",2026),null);
  assert.equal(parseYearSnapshot({...annual,holidays:[{date:"2027-01-01",name:"Erreur"}]},"FR",2026),null);
 });
 it("exige une empreinte serveur, une révision et un état administrativement authentifié",()=>{
  assert.equal(parseYearSnapshot({...annual,fingerprint:"x"},"FR",2026),null);
  assert.equal(parseYearSnapshot({...annual,revision:-1},"FR",2026),null);
  assert.equal(parseYearSnapshot({...annual,administrativeValidated:"true"},"FR",2026),null);
 });
 it("reconnaît exactement les années modifiées",()=>{
  assert.deepEqual(affectedYears(null,"2026-05-01"),[2026]);
  assert.deepEqual(affectedYears("2026-12-31","2027-01-01"),[2026,2027]);
  assert.deepEqual(affectedYears("2026-01-01",null),[2026]);
 });
});
