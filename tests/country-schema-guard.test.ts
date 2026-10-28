import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {CountrySchemaUnavailableError,requireCountrySchemaV30} from "../src/server/countries/schema-guard";

describe("Pays — prérequis schéma v30 sans DDL",()=>{
 it("accepte un schéma déclaré prêt",async()=>{
  let calls=0;
  const db={query:async(sql:string)=>{calls++;assert.match(sql,/to_regclass/);
   assert.ok(sql.trimStart().startsWith("SELECT "));
   return {rows:[{schema_version:30,ready:true}]};}};
  await requireCountrySchemaV30(db as never);
  assert.equal(calls,1);
 });
 it("refuse explicitement un schéma absent ou incomplet",async()=>{
  for(const rows of [[],[{schema_version:29,ready:false}],[{schema_version:30,ready:false}]]){
   const db={query:async()=>({rows})};
   await assert.rejects(()=>requireCountrySchemaV30(db as never),CountrySchemaUnavailableError);
  }
 });
});
