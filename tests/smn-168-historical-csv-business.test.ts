import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {validateCsvBatchRules} from "../src/server/historical-csv/business-validation";
import type {CsvRow} from "../src/lib/historical-csv-validator";
const id="9ecce9f4-e830-40e6-bf42-00d87296144a",other="9ecce9f4-e830-40e6-bf42-00d87296144b";
const row=(line:number,metric_code:string,value:number,cycle_id=id):CsvRow=>({line,cycle_id,metric_code,value,quality:"known"});
describe("SMN-168 — validation métier du CSV",()=>{
 it("accepte des sources distinctes sur un cycle de l'installation",()=>{
  assert.deepEqual(validateCsvBatchRules([row(2,"SP_INITIAL",24),row(3,"SP_DONE",18)],"scrum",new Set([id])),[]);
 });
 it("signale les cycles étrangers sans les créer",()=>{
  const errors=validateCsvBatchRules([row(2,"SP_INITIAL",24,other)],"scrum",new Set([id]));
  assert.equal(errors[0]?.column,"cycle_id");assert.equal(errors[0]?.line,2);
 });
 it("signale les deux lignes même si la valeur est identique",()=>{
  const errors=validateCsvBatchRules([row(2,"SP_DONE",10),row(5,"SP_DONE",10)],"scrum",new Set([id]));
  assert.deepEqual(errors.filter(e=>e.code==="duplicate").map(e=>e.line),[2,5]);
 });
 it("refuse les décimales sur les décomptes SP et flux",()=>{
  assert.equal(validateCsvBatchRules([row(2,"SP_INITIAL",2.5)],"scrum",new Set([id]))[0]?.code,"unit");
  assert.equal(validateCsvBatchRules([row(2,"THROUGHPUT",2.5)],"kanban",new Set([id]))[0]?.code,"unit");
  assert.deepEqual(validateCsvBatchRules([row(2,"CYCLE_TIME_AVG",2.5)],"kanban",new Set([id])),[]);
 });
});
