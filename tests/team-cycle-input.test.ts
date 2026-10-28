import assert from "node:assert/strict";
import {test} from "node:test";
import {isValidCycleStartDate} from "../src/lib/cycle-input";

test("cycles : dates civiles valides, y compris année bissextile",()=>{
 assert.equal(isValidCycleStartDate("2028-02-29"),true);
 assert.equal(isValidCycleStartDate("2026-10-28"),true);
});
test("cycles : dates invalides refusées sans normalisation",()=>{
 for(const value of ["2026-02-29","2026-13-01","2026-00-01","2026-04-31",
  "2026-1-01","2026-01-1","2026-01-01T00:00:00Z","",null,42,{}]){
  assert.equal(isValidCycleStartDate(value),false,String(value));
 }
});
