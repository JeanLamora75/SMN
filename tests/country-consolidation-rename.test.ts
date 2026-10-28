import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {parseRenameCountryInput,renameCountry} from "../src/server/countries/catalog";
import {CountrySchemaUnavailableError} from "../src/server/countries/schema-guard";

describe("Pays — renommage sous garde v30",()=>{
 it("valide les données et refuse les révisions incorrectes",()=>{
  assert.deepEqual(parseRenameCountryInput({name:"France métropolitaine",revision:2}),
   {name:"France métropolitaine",revision:2});
  for(const input of [{name:"",revision:0},{name:"France",revision:-1},
   {name:"France",revision:1.5},{name:"France",revision:0,extra:true},null])
   assert.equal(parseRenameCountryInput(input),null);
 });
 it("n'entame aucune transaction de renommage si la version v30 est absente",async()=>{
  const sqls:string[]=[];
  const db={query:async(sql:string)=>{
   sqls.push(sql);
   return {rows:[{schema_version:29,ready:false}]};
  }};
  await assert.rejects(
   ()=>renameCountry(db as never,"FR","actor",{name:"France nouvelle",revision:0}),
   CountrySchemaUnavailableError
  );
  assert.equal(sqls.length,1);
  assert.match(sqls[0],/^\s*SELECT\s/i);
 });
});
