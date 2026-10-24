import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {HISTORICAL_CSV_COLUMNS,HISTORICAL_CSV_CATALOG,historicalCsvCodeAllowed,historicalCsvTemplate} from "../src/lib/historical-csv-contract";
describe("SMN-166 — contrat CSV historique",()=>{
 it("impose quatre colonnes strictes dans l'ordre",()=>{
  assert.deepEqual(HISTORICAL_CSV_COLUMNS,["cycle_id","metric_code","value","quality"]);
  assert.equal(historicalCsvTemplate(),"cycle_id,metric_code,value,quality\r\n");
 });
 it("propose quatre sources Scrum et cinq sources Kanban",()=>{
  assert.equal(HISTORICAL_CSV_CATALOG.scrum.length,4);
  assert.equal(HISTORICAL_CSV_CATALOG.kanban.length,5);
 });
 it("exclut les capacités et les métriques dérivées",()=>{
  for(const mode of ["scrum","kanban"] as const){
   for(const code of ["CAPACITY_JH","VELOCITY","SP_FINAL","FLOW_EFFICIENCY","CYCLE_AVG_DERIVED"]){
    assert.equal(historicalCsvCodeAllowed(mode,code),false);
   }
  }
 });
});
