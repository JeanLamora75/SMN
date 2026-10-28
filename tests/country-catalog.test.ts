import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {COUNTRY_SEEDS,parseCountryInput,listCountries,createCountry} from "../src/server/countries/catalog";
import {COUNTRIES_MIGRATION_SQL} from "../src/server/countries/migration";
import {canAccess} from "../src/server/access-policy";

function dbFixture(options:{existing?:boolean;fail?:boolean}={}){
 const sql:string[]=[],params:unknown[][]=[];
 const client={query:async(q:string,values:unknown[]=[])=>{
  sql.push(q);params.push(values);
  if(q.includes("to_regclass('public.smn_country_name_audit')"))
   return {rows:[{schema_version:30,ready:true}],rowCount:1};
  if(q.includes("FROM public.smn_country ORDER BY"))return {rows:COUNTRY_SEEDS.map(
   c=>({code:c.code,name:c.name,origin:"initial",created_at:"2026-10-21T12:00:00Z"})),rowCount:7};
  if(q.includes("INSERT INTO public.smn_country")){
   if(options.fail)throw new Error("db-failure");
   if(options.existing)return {rows:[],rowCount:0};
   return {rows:[{code:values[0],name:values[1],origin:"manual",
    created_at:"2026-10-21T12:00:00Z"}],rowCount:1};
  }
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 return {client,sql,params};
}
describe("Catalogue des pays initiaux",()=>{
 it("précharge exactement les sept codes différents attendus, sans fériés fictifs",()=>{
  assert.deepEqual(COUNTRY_SEEDS.map(c=>c.code),["FR","DE","GB","ES","PT","IT","CA"]);
  assert.equal(new Set(COUNTRY_SEEDS.map(c=>c.code)).size,7);
  assert.match(COUNTRIES_MIGRATION_SQL,/PRIMARY KEY/);
  assert.match(COUNTRIES_MIGRATION_SQL,/ON CONFLICT \(code\) DO NOTHING/);
  assert.match(COUNTRIES_MIGRATION_SQL,/schema_version=15/);
  assert.doesNotMatch(COUNTRIES_MIGRATION_SQL,/ON DELETE CASCADE|holiday_date|INSERT INTO public.smn_holiday/i);
 });
 it("accepte un code ISO et un nom, rejette les formes non valides",()=>{
  assert.deepEqual(parseCountryInput({code:"nl",name:"Pays-Bas"}),{code:"NL",name:"Pays-Bas"});
  for(const invalid of [
   {code:"XX",name:"Inconnu"},{code:"EU",name:"Europe"},{code:"FR",name:""},
   {code:"FRA",name:"France"},{code:"FR",name:"A".repeat(121)},
   {code:"FR",name:"France\nInjection"},{code:"FR",name:"France",admin:true}
  ])assert.equal(parseCountryInput(invalid),null);
 });
 it("les 7 pays sont consultables mais aucun calendrier national n'est considéré prêt",async()=>{
  const {client}=dbFixture();
  const rows=await listCountries(client);
  assert.equal(rows.length,7);
  assert.deepEqual(rows.map(r=>r.code),["CA","DE","ES","FR","GB","IT","PT"]);
  assert.ok(rows.every(r=>r.nationalCalendar.status==="not-configured"&&r.nationalCalendar.holidays===null));
 });
 it("écriture de référentiel interdite au rôle Utilisateur",()=>{
  const resource={type:"settings",exists:true,inScope:true};
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},
   "write",resource),false);
  assert.equal(canAccess({role:"admin",is_active:true,must_change_password:false},
   "write",resource),true);
 });
 it("création atomique sans obligation de fichier férié",async()=>{
  const f=dbFixture();
  const result=await createCountry(f.client,"admin",{code:"NL",name:"Pays-Bas"});
  assert.equal(result.ok,true);
  if(result.ok){assert.equal(result.country.code,"NL");assert.equal(result.country.nationalCalendar.status,"not-configured");}
  assert.equal(f.sql.at(-1),"COMMIT");
  assert.ok(!f.sql.some(q=>q.includes("smn_holiday")||q.includes("smn_member_location")));
 });
 it("le même code est refusé sans doublon et sans modification",async()=>{
  const f=dbFixture({existing:true});
  assert.deepEqual(await createCountry(f.client,"admin",{code:"FR",name:"France bis"}),
   {ok:false,error:"duplicate-code"});
  assert.equal(f.sql.at(-1),"ROLLBACK");
  assert.ok(!f.sql.some(q=>q.includes("UPDATE public.smn_country")));
 });
 it("rollback sur échec SQL",async()=>{
  const f=dbFixture({fail:true});
  await assert.rejects(()=>createCountry(f.client,"admin",{code:"NL",name:"Pays-Bas"}),/db-failure/);
  assert.equal(f.sql.at(-1),"ROLLBACK");
 });
});
