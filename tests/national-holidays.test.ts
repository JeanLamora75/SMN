import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import FR from "../src/server/holidays/data/FR.json";
import DE from "../src/server/holidays/data/DE.json";
import GB from "../src/server/holidays/data/GB.json";
import {validateNationalYear,preloadNationalCalendar} from "../src/server/holidays/preload";
import {HOLIDAYS_MIGRATION_SQL} from "../src/server/holidays/migration";

function fakeDb(countryExists=true){
 const holidays=new Map<string,string>(),coverage=new Map<string,string>();
 const statements:string[]=[];
 const client={query:async(sql:string,args:unknown[]=[])=>{
  statements.push(sql);
  if(sql==="BEGIN"||sql==="COMMIT"||sql==="ROLLBACK"||
    sql.includes("pg_advisory_xact_lock"))return {rows:[],rowCount:0};
  if(sql.includes("FROM public.smn_country WHERE code=$1 FOR UPDATE"))
   return {rows:countryExists?[{code:args[0],archived_at:null}]:[],rowCount:countryExists?1:0};
  if(sql.includes("SELECT code FROM public.smn_country"))
   return {rows:countryExists?[{code:args[0]}]:[],rowCount:countryExists?1:0};
  if(sql.includes("INSERT INTO public.smn_national_holiday")){
   const key=args[0]+":"+args[1];if(!holidays.has(key))holidays.set(key,String(args[2]));
   return {rows:[],rowCount:1};
  }
  if(sql.includes("SELECT count(*)::text AS total")){
   const total=[...holidays.keys()].filter(k=>k.startsWith(args[0]+":"+args[1])).length;
   return {rows:[{total:String(total)}],rowCount:1};
  }
  if(sql.includes("INSERT INTO public.smn_national_calendar_coverage")){
   coverage.set(args[0]+":"+args[1],String(args[2]));
   return {rows:[],rowCount:1};
  }
  throw Error("Unexpected SQL: "+sql);
 }} as unknown as Client;
 return {client,holidays,coverage,statements};
}

describe("Calendriers nationaux intégrés",()=>{
 it("livre les quatre années 2024–2027 pour une installation 2026, avec noms et dates valides",()=>{
  for(const [code,bundle,count] of [["FR",FR,11],["DE",DE,9],["GB",GB,6]] as const){
   for(const y of [2024,2025,2026,2027]){
    const result=validateNationalYear(bundle,code,y);
    assert.equal(result.ok,true);
    if(result.ok){
     assert.equal(result.holidays.length,count);
     assert.equal(result.holidays.every(x=>x.name.length>0&&x.date.startsWith(String(y))),true);
    }
   }
  }
 });
 it("interdit dates impossible, doublon et libellé vide, sans résultat partiel",()=>{
  for(const entries of [
   [{date:"2026-02-30",name:"jour"}],
   [{date:"2026-05-01",name:"Jour"},{date:"2026-05-01",name:"Double"}],
   [{date:"2026-05-01",name:"  "}],
   [{date:"2025-05-01",name:"Année erronée"}],
  ]){
   const result=validateNationalYear({country:"FR",years:{"2026":entries}},"FR",2026);
   assert.equal(result.ok,false);
   if(!result.ok)assert.ok(result.diagnostic.length>0);
  }
 });
 it("l'import et le réimport sont idempotents",async()=>{
  const f=fakeDb();
  const first=await preloadNationalCalendar(f.client,"FR",2026);
  const original=f.holidays.size;
  const second=await preloadNationalCalendar(f.client,"FR",2026);
  assert.deepEqual(second,first);
  assert.equal(original,44);
  assert.equal(f.holidays.size,original);
  assert.equal(f.coverage.size,4);
  assert.equal(first.every(x=>x.status==="configured"),true);
  assert.ok(f.statements.some(s=>s.includes("ON CONFLICT (country_code,holiday_date) DO NOTHING")));
 });
 it("pays et année absents : non configuré sans blocage",async()=>{
  const f=fakeDb();
  const rows=await preloadNationalCalendar(f.client,"ES",2026);
  assert.equal(rows.length,4);
  assert.equal(rows.every(x=>x.status==="not-configured"),true);
  assert.equal(f.holidays.size,0);
  const missing=await preloadNationalCalendar(f.client,"FR",2040);
  assert.equal(missing.every(x=>x.status==="not-configured"),true);
  assert.equal(f.holidays.size,0);
 });
 it("pays non présent au catalogue : aucune écriture fériée",async()=>{
  const f=fakeDb(false);
  const result=await preloadNationalCalendar(f.client,"FR",2026);
  assert.equal(result.every(x=>x.status==="not-configured"),true);
  assert.equal(f.holidays.size,0);
  assert.equal(f.coverage.size,0);
 });
 it("unicité garantie en base et statut explicite",()=>{
  assert.match(HOLIDAYS_MIGRATION_SQL,/PRIMARY KEY\(country_code,holiday_date\)/);
  assert.match(HOLIDAYS_MIGRATION_SQL,/PRIMARY KEY\(country_code,calendar_year\)/);
  assert.match(HOLIDAYS_MIGRATION_SQL,/schema_version=16/);
  assert.match(HOLIDAYS_MIGRATION_SQL,/not-configured/);
  assert.doesNotMatch(HOLIDAYS_MIGRATION_SQL,/ON DELETE CASCADE/);
 });
});
