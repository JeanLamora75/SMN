import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {ensureCountryNameSchema} from "../src/server/countries/name-migration";
import {ensureCountryArchiveSchema} from "../src/server/countries/archive-migration";
import {ensureManualHolidaySchema} from "../src/server/holidays/manual-migration";
import {ensureAnnualValidationSchema} from "../src/server/holidays/validation-migration";
import {CountrySchemaUnavailableError} from "../src/server/countries/schema-guard";

describe("Pays — aucune migration DDL dans les services",()=>{
 const functions=[ensureCountryNameSchema,ensureCountryArchiveSchema,
  ensureManualHolidaySchema,ensureAnnualValidationSchema];
 it("utilise uniquement une requête SELECT pour chacun des quatre points d'entrée",async()=>{
  for(const ensure of functions){
   const sqls:string[]=[];
   const db={query:async(sql:string)=>{sqls.push(sql);return {rows:[{schema_version:30,ready:true}]};}};
   await ensure(db as never);
   assert.equal(sqls.length,1);
   assert.ok(sqls[0].trimStart().startsWith("SELECT "));
  }
 });
 it("refuse un schéma v29 sans tentative de réparation",async()=>{
  for(const ensure of functions){
   const sqls:string[]=[];
   const db={query:async(sql:string)=>{sqls.push(sql);return {rows:[{schema_version:29,ready:false}]};}};
   await assert.rejects(()=>ensure(db as never),CountrySchemaUnavailableError);
   assert.equal(sqls.length,1);
   assert.ok(sqls[0].trimStart().startsWith("SELECT "));
  }
 });
});
