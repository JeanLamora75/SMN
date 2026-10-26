import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {listNationalHolidays} from "../src/server/countries/catalog";

function dbFixture(rows:{code:string;date:string|null;name:string|null}[]){
 const queries:{sql:string;params:unknown[]}[]=[];
 const db={query:async(sql:string,params:unknown[])=>{
  queries.push({sql,params});return {rows};
 }} as unknown as Client;
 return {db,queries};
}
describe("Consultation annuelle des dates nationales",()=>{
 it("lit l'année demandée même hors de la plage d'installation",async()=>{
  const f=dbFixture([{code:"FR",date:"2032-01-01",name:"Jour de l'an"}]);
  assert.deepEqual(await listNationalHolidays(f.db,"FR",2032),
   [{date:"2032-01-01",name:"Jour de l'an"}]);
  assert.deepEqual(f.queries[0].params,["FR",2032]);
  assert.match(f.queries[0].sql,/make_date\(\$2,1,1\)/);
  assert.match(f.queries[0].sql,/LEFT JOIN public\.smn_national_holiday/);
 });
 it("distingue un pays inexistant d'une année vide",async()=>{
  assert.equal(await listNationalHolidays(dbFixture([]).db,"FR",2026),null);
  assert.deepEqual(await listNationalHolidays(dbFixture(
   [{code:"FR",date:null,name:null}]).db,"FR",2026),[]);
 });
 it("rejette les codes et années hors périmètre sans requête SQL",async()=>{
  const f=dbFixture([]);
  await assert.rejects(()=>listNationalHolidays(f.db,"UK",2026),/invalid-national-calendar-scope/);
  await assert.rejects(()=>listNationalHolidays(f.db,"FR",2201),/invalid-national-calendar-scope/);
  assert.equal(f.queries.length,0);
 });
});
