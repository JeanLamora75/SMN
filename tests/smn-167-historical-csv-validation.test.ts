import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {validateHistoricalCsv} from "../src/lib/historical-csv-validator";
const id="9ecce9f4-e830-40e6-bf42-00d87296144a";
const header="cycle_id,metric_code,value,quality\r\n";
describe("SMN-167 — validation CSV intégrale sans écriture",()=>{
 it("accepte le schéma strict et les lignes valides",()=>{
  const result=validateHistoricalCsv(header+`${id},SP_INITIAL,24,known\r\n${id},SP_DONE,22.5,estimated\r\n`,"scrum");
  assert.equal(result.valid,true);assert.equal(result.rows.length,2);
 });
 it("refuse toute colonne absente, supplémentaire ou déplacée",()=>{
  for(const h of ["cycle_id,metric_code,value","value,cycle_id,metric_code,quality","cycle_id,metric_code,value,quality,source"]){
   assert.equal(validateHistoricalCsv(h+"\n"+id+",SP_DONE,1,known","scrum").valid,false);
  }
 });
 it("invalide tout le fichier si une ligne au milieu est mauvaise",()=>{
  const r=validateHistoricalCsv(header+`${id},SP_DONE,3,known\n${id},SP_ADDED,,known\n${id},SP_INITIAL,5,estimated\n`,"scrum");
  assert.equal(r.valid,false);assert.deepEqual(r.rows,[]);
  assert.ok(r.errors.some(e=>e.line===3&&e.column==="value"));
 });
 it("rejette les qualités vides ou inconnues",()=>{
  for(const q of ["","unknown","not-supplied"]){
   const r=validateHistoricalCsv(header+`${id},SP_DONE,0,${q}\n`,"scrum");
   assert.ok(r.errors.some(e=>e.column==="quality"));
  }
 });
 it("refuse les guillemets mal formés",()=>{
  assert.equal(validateHistoricalCsv(header+`${id},SP_DONE,"12,known\n`,"scrum").valid,false);
 });
});
