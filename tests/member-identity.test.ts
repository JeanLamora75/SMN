import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {parseIdentityInput,saveMemberIdentity} from "../src/server/members/identity";
import {MEMBER_IDENTITY_MIGRATION_SQL} from "../src/server/members/identity-migration";
const id="11111111-1111-4111-8111-111111111111";
const payload={displayName:"Alice Dupont",email:"alice@example.com",professionalFunction:"Analyste",
 revision:3,location:{countryIso2:"FR",region:"Île-de-France",city:"Paris",timeZone:"Europe/Paris",
 effectiveFrom:"2026-10-22",revision:1}};
describe("identité métier unifiée",()=>{
 it("valide fonction, contact et localisation sans accepter de propriétés inconnues",()=>{
  assert.equal(parseIdentityInput(payload)?.professionalFunction,"Analyste");
  assert.equal(parseIdentityInput({...payload,professionalFunction:"X".repeat(121)}),null);
  assert.equal(parseIdentityInput({...payload,professionalFunction:12}),null);
  assert.equal(parseIdentityInput({...payload,extra:"untrusted"}),null);
  assert.equal(parseIdentityInput({...payload,location:{...payload.location,countryIso2:"ZZ"}}),null);
 });
 it("met à jour identité et localisation dans une seule transaction puis trace l'événement",async()=>{
  const calls:string[]=[];
  const db={query:async(sql:string)=>{
   calls.push(sql);
   if(sql.includes("FROM public.smn_member WHERE"))return {rows:[{display_name:"Alice",
    email:null,professional_function:null,revision:3,is_provisional:false,archived_at:null}]};
   if(sql.includes("CURRENT_DATE::text"))return {rows:[{today:"2026-10-22"}]};
   if(sql.includes("FROM public.smn_member_location"))return {rows:[{revision:1,
    effective_from:"2026-01-01",country_iso2:"FR",region:null,city:null,time_zone:null}]};
   return {rows:[]};
  }} as unknown as Client;
  const result=await saveMemberIdentity(db,id,"actor",payload);
  assert.deepEqual(result,{ok:true,revision:4,locationRevision:2});
  assert.equal(calls[0],"BEGIN");assert.equal(calls.at(-1),"COMMIT");
  assert.ok(calls.some(x=>x.includes("INSERT INTO public.smn_member_location")));
  assert.ok(calls.some(x=>x.includes("INSERT INTO public.smn_member_identity_history")));
 });
 it("annule l'ensemble si la création de l'audit échoue",async()=>{
  const calls:string[]=[];
  const db={query:async(sql:string)=>{
   calls.push(sql);
   if(sql.includes("FROM public.smn_member WHERE"))return {rows:[{display_name:"Alice",
    email:null,professional_function:null,revision:3,is_provisional:false,archived_at:null}]};
   if(sql.includes("CURRENT_DATE::text"))return {rows:[{today:"2026-10-22"}]};
   if(sql.includes("FROM public.smn_member_location"))return {rows:[]};
   if(sql.includes("INSERT INTO public.smn_member_identity_history"))throw Error("audit unavailable");
   return {rows:[]};
  }} as unknown as Client;
  await assert.rejects(()=>saveMemberIdentity(db,id,"actor",
   {...payload,location:{...payload.location,revision:0}}),/audit unavailable/);
  assert.equal(calls.at(-1),"ROLLBACK");
 });
 it("la migration v27 est additive",()=>{
  assert.match(MEMBER_IDENTITY_MIGRATION_SQL,/ADD COLUMN professional_function/);
  assert.match(MEMBER_IDENTITY_MIGRATION_SQL,/CREATE TABLE public.smn_member_identity_history/);
  assert.match(MEMBER_IDENTITY_MIGRATION_SQL,/schema_version=27/);
  assert.doesNotMatch(MEMBER_IDENTITY_MIGRATION_SQL,/DROP TABLE|TRUNCATE|CASCADE/);
 });
});
