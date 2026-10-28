import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {diagnoseNationalYear,parseAnnualValidationRequest,certifyNationalYear}
 from "../src/server/holidays/annual-validation";

const base={country:"FR",year:2026,revision:2,status:"partial",
 fingerprint:"a".repeat(64),administrativeValidated:false,
 holidays:[{date:"2026-05-01",name:"Fête du Travail"}]};
const coverage={status:"partial",entries_count:1,diagnostic:null,source_file:"FR.csv",
 revision:2,validated_revision:null,administrative_validated_at:null};
const request=(fingerprint:string)=>({year:2026,fingerprint,confirmComplete:true,source:"manual-review"});

function dbFixture(opts:{empty?:boolean;invalid?:boolean;archived?:boolean;auditFails?:boolean}={}){
 const queries:string[]=[], params:unknown[][]=[];
 const holidays=opts.empty?[]:base.holidays;
 let status=opts.invalid?"invalid":"partial", validated=false, revision=2;
 const client={query:async(query:string,args:unknown[]=[])=>{
  queries.push(query);params.push(args);
  if(query.includes("to_regclass('public.smn_country_name_audit')"))
   return {rows:[{schema_version:30,ready:true}],rowCount:1};
  if(["BEGIN","COMMIT","ROLLBACK"].includes(query)||
     query.includes("pg_advisory_xact_lock")||query.includes("ALTER TABLE")||
     query.includes("CREATE TABLE")||query.includes("CREATE INDEX"))
   return {rows:[],rowCount:0};
  if(query.includes("WHERE code=$1 FOR UPDATE"))
   return {rows:[{code:"FR"}],rowCount:1};
  if(query.includes("FROM public.smn_country WHERE code=$1")||
    query.includes("FROM public.smn_country WHERE code=$1 FOR UPDATE"))
   return {rows:[{archived_at:opts.archived?"2026-10-26":null}],rowCount:1};
  if(query.includes("SELECT c.code,to_char(h.holiday_date")){
   return {rows:holidays.length?holidays.map(item=>({
    code:"FR",date:item.date,name:item.name,revision,status,
    administrative_validated:validated
   })):[{code:"FR",date:null,name:null,revision,status,
    administrative_validated:validated}],rowCount:Math.max(holidays.length,1)};
  }
  if(query.includes("FROM public.smn_national_calendar_coverage")&&
    query.includes("SELECT status,entries_count"))
   return {rows:[{...coverage,status,revision,entries_count:holidays.length,
    validated_revision:validated?revision:null,
    administrative_validated_at:validated?"2026-10-26":null}],rowCount:1};
  if(query.includes("INSERT INTO public.smn_national_calendar_coverage")){
   status="configured";validated=true;
   return {rows:[{revision}],rowCount:1};
  }
  if(query.includes("INSERT INTO public.smn_national_calendar_validation_audit")){
   if(opts.auditFails)throw Error("audit-failure");
   return {rows:[],rowCount:1};
  }
  throw Error("Unexpected SQL: "+query);
 }} as unknown as Client;
 return {client,queries,params};
}

describe("SMN-275 — certification nationale",()=>{
 it("impose confirmation explicite et source contrôlée",()=>{
  assert.deepEqual(parseAnnualValidationRequest(request("a".repeat(64))),
   {year:2026,fingerprint:"a".repeat(64)});
  assert.equal(parseAnnualValidationRequest({...request("a".repeat(64)),confirmComplete:false}),null);
  assert.equal(parseAnnualValidationRequest({...request("a".repeat(64)),source:"automatic"}),null);
  assert.equal(parseAnnualValidationRequest({...request("a".repeat(64)),admin:true}),null);
  assert.equal(parseAnnualValidationRequest(request("bad")),null);
 });
 it("ne déduit jamais automatiquement la complétude de la seule liste",()=>{
  const d=diagnoseNationalYear(base,coverage,false);
  assert.deepEqual(d.blocking,[]);
  assert.ok(d.warnings.some(i=>i.code==="national-completeness-unverified"));
  assert.ok(d.warnings.some(i=>i.code==="national-only"));
 });
 it("bloque une année vide, des anomalies critiques et un pays archivé",()=>{
  const empty=diagnoseNationalYear({...base,holidays:[]},null,false);
  assert.ok(empty.blocking.some(x=>x.code==="empty-year"));
  const invalid=diagnoseNationalYear(base,{...coverage,status:"invalid"},false);
  assert.ok(invalid.blocking.some(x=>x.code==="invalid-coverage"));
  const mismatch=diagnoseNationalYear(base,{...coverage,entries_count:9},false);
  assert.ok(mismatch.blocking.some(x=>x.code==="count-mismatch"));
  const archived=diagnoseNationalYear(base,coverage,true);
  assert.ok(archived.blocking.some(x=>x.code==="country-archived"));
 });
 it("refuse une empreinte périmée avec diagnostic, sans écrire",async()=>{
  const f=dbFixture();
  const result=await certifyNationalYear(f.client,"FR","admin",request("f".repeat(64)));
  assert.equal(result.ok,false);
  if(!result.ok)assert.equal(result.error,"conflict");
  assert.equal(f.queries.at(-1),"ROLLBACK");
  assert.ok(!f.queries.some(x=>x.includes("INSERT INTO public.smn_national_calendar_validation_audit")));
 });
 it("refuse une liste vide sans attestation",async()=>{
  const f=dbFixture({empty:true});
  const {readAnnualHolidaySnapshot}=await import("../src/server/holidays/manual");
  const snapshot=await readAnnualHolidaySnapshot(f.client,"FR",2026);
  assert.ok(snapshot);
  const result=await certifyNationalYear(f.client,"FR","admin",request(snapshot.fingerprint));
  assert.equal(result.ok,false);
  if(!result.ok)assert.equal(result.error,"diagnostic-blocked");
 });
 it("atteste en transaction et audite la révision sans toucher aux snapshots",async()=>{
  const f=dbFixture();
  // Compute actual fingerprint from the same snapshot algorithm as production.
  const {readAnnualHolidaySnapshot}=await import("../src/server/holidays/manual");
  const snapshot=await readAnnualHolidaySnapshot(f.client,"FR",2026);
  assert.ok(snapshot);
  const result=await certifyNationalYear(f.client,"FR","admin",request(snapshot.fingerprint));
  assert.equal(result.ok,true);
  assert.equal(f.queries.at(-1),"COMMIT");
  assert.equal(f.queries.filter(q=>q.includes("INSERT INTO public.smn_national_calendar_validation_audit")).length,1);
  assert.ok(!f.queries.some(q=>q.includes("UPDATE public.smn_capacity")||q.includes("UPDATE public.smn_sprint")));
 });
 it("erreur d'audit entraîne le rollback",async()=>{
  const f=dbFixture({auditFails:true});
  const {readAnnualHolidaySnapshot}=await import("../src/server/holidays/manual");
  const snapshot=await readAnnualHolidaySnapshot(f.client,"FR",2026);
  assert.ok(snapshot);
  await assert.rejects(()=>certifyNationalYear(f.client,"FR","admin",request(snapshot.fingerprint)),
   /audit-failure/);
  assert.equal(f.queries.at(-1),"ROLLBACK");
 });
});
