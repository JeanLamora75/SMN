import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {parseLocationChange,resolveMemberLocation,formatMemberEvent,readMemberLocation,saveMemberLocation,
 isValidCountry,isValidIanaZone} from "../src/server/members/location";
import {MEMBER_LOCATION_MIGRATION_SQL} from "../src/server/members/location-migration";

const id=randomUUID();
const base={countryIso2:"FR",region:"Île-de-France",city:"Paris",timeZone:"Europe/Paris",
 effectiveFrom:"2026-10-21",revision:0};
const first={revision:1,effective_from:"2026-10-21",country_iso2:"FR",
 region:"Île-de-France",city:"Paris",time_zone:"Europe/Paris",source:"manual",
 created_at:"2026-10-21T10:00:00Z"};
function mock(options:{versions?:typeof first[];reference?:string|null;archived?:boolean;fail?:boolean}={}){
 const sql:string[]=[],parameters:unknown[][]=[];
 const db={query:async(q:string,p:unknown[]=[])=>{
  sql.push(q);parameters.push(p);
  if(q.includes("CURRENT_DATE::text AS today"))return {rows:[{today:"2026-10-21"}],rowCount:1};
  if(q.includes("FROM public.smn_member m")&&q.includes("JOIN public.smn_member_batch"))
   return {rows:[{id,archived_at:options.archived?"2026-10-20T10:00:00Z":null,team_id:"team"}],rowCount:1};
  if(q.includes("SELECT reference_country FROM public.smn_general_settings"))
   return {rows:[{reference_country:options.reference===undefined?"DE":options.reference}],rowCount:1};
  if(q.includes("FROM public.smn_member_location WHERE member_id=$1"))
   return {rows:options.versions??[],rowCount:(options.versions??[]).length};
  if(q.includes("INSERT INTO public.smn_member_location")&&options.fail)throw Error("sql-write-failed");
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 return {db,sql,parameters};
}
describe("Localisation individuelle historisée et zones IANA",()=>{
 it("vérifie les codes pays ISO-3166 alpha-2 et zones IANA sans déduire un fuseau d'un pays",()=>{
  assert.equal(isValidCountry("FR"),true);
  assert.equal(isValidCountry("CA"),true);
  assert.equal(isValidCountry("XX"),false);
  assert.equal(isValidCountry("EU"),false);
  assert.equal(isValidCountry("FRAN"),false);
  assert.equal(isValidIanaZone("Europe/Paris"),true);
  assert.equal(isValidIanaZone("America/New_York"),true);
  assert.equal(isValidIanaZone("UTC"),true);
  assert.equal(isValidIanaZone("Mars/Olympus_Mons"),false);
  assert.equal(isValidIanaZone("France/Paris"),false);
 });
 it("accepte champs facultatifs, refuse injection, autres propriétés et dates impossibles",()=>{
  assert.deepEqual(parseLocationChange(base),base);
  assert.deepEqual(parseLocationChange({...base,region:" ",city:"",timeZone:""}),{
   ...base,region:null,city:null,timeZone:null});
  for(const bad of [
   {...base,countryIso2:"XYZ"},{...base,countryIso2:"ZZ"},
   {...base,timeZone:"France/Paris"},{...base,region:"X".repeat(121)},
   {...base,city:"Paris\nInvalid"},{...base,effectiveFrom:"2026-02-30"},
   {...base,revision:-1},{...base,locale:"de"},
   {...base,timeZone:17},{...base,countryIso2:"France"}
  ])assert.equal(parseLocationChange(bad),null);
 });
 it("conserve un défaut seulement proposé pour une identité déjà créée sans historique",async()=>{
  const m=mock({reference:"DE"});
  const s=await readMemberLocation(m.db,id,"2026-10-21");
  assert.equal(s.configured,false);
  assert.equal(s.suggestedCountryIso2,"DE");
  assert.equal(s.current,null);
  assert.equal(s.effective,null);
  assert.equal(s.display,null);
  assert.ok(!m.sql.some(q=>q.includes("INSERT INTO public.smn_member_location")));
 });
 it("applique le pays et le fuseau valables à une date passée, pas les valeurs futures",()=>{
  const old={...first,effective_from:"2026-03-01"};
  const changed={...first,revision:2,effective_from:"2026-11-01",country_iso2:"CA",
   region:"Québec",city:"Montréal",time_zone:"America/Toronto"};
  assert.equal(resolveMemberLocation([old,changed],"2026-04-02")?.countryIso2,"FR");
  assert.equal(resolveMemberLocation([old,changed],"2026-12-02")?.countryIso2,"CA");
  assert.equal(resolveMemberLocation([changed],"2026-04-02"),null);
 });
 it("affiche deux instants invariants au changement d'heure de Paris et de New York",()=>{
  const before=formatMemberEvent("2026-03-29T00:30:00Z","Europe/Paris");
  const after=formatMemberEvent("2026-03-29T01:30:00Z","Europe/Paris");
  assert.equal(before.utc,"2026-03-29T00:30:00.000Z");
  assert.equal(after.utc,"2026-03-29T01:30:00.000Z");
  assert.equal(before.parts.hour,"01");
  assert.equal(after.parts.hour,"03");
  assert.equal(before.timeZone,"Europe/Paris");
  const nyBefore=formatMemberEvent("2026-03-08T06:30:00Z","America/New_York");
  const nyAfter=formatMemberEvent("2026-03-08T07:30:00Z","America/New_York");
  assert.equal(nyBefore.parts.hour,"01");
  assert.equal(nyAfter.parts.hour,"03");
  assert.throws(()=>formatMemberEvent("2026-02-30T12:00:00Z","Europe/Paris"),
   /member-event-invalid-input/);
  assert.throws(()=>formatMemberEvent("2026-03-29T01:30:00Z","Mars/Olympus_Mons"),
   /member-event-invalid-input/);
 });
 it("insère une version dans une transaction sans mettre à jour les comptes, la langue ni les affectations",async()=>{
  const m=mock();
  const result=await saveMemberLocation(m.db,id,"admin",base);
  assert.deepEqual(result,{ok:true,revision:1});
  assert.equal(m.sql.at(-1),"COMMIT");
  const index=m.sql.findIndex(q=>q.includes("INSERT INTO public.smn_member_location"));
  assert.ok(index>=0);
  assert.equal(m.parameters[index][3],"FR");
  assert.ok(m.sql.every(q=>!q.includes("UPDATE public.smn_general_settings")&&
   !q.includes("UPDATE public.smn_member_assignment")&&
   !q.includes("UPDATE public.smn_account")));
 });
 it("ne réécrit pas les périodes anciennes et refuse les révisions obsolètes",async()=>{
  const m=mock({versions:[first]});
  assert.deepEqual(await saveMemberLocation(m.db,id,"admin",{...base,revision:0}),
   {ok:false,error:"conflict"});
  const old=mock({versions:[first]});
  assert.deepEqual(await saveMemberLocation(old.db,id,"admin",{...base,revision:1,effectiveFrom:"2026-10-20"}),
   {ok:false,error:"date-in-past"});
  const future=mock({versions:[{...first,effective_from:"2026-11-01"}]});
  assert.deepEqual(await saveMemberLocation(future.db,id,"admin",{...base,revision:1}),
   {ok:false,error:"date-before-latest"});
 });
 it("lecture d'une fiche archivée possible, écriture refusée et rollback sur erreur SQL",async()=>{
  const archived=mock({versions:[first],archived:true});
  assert.equal((await readMemberLocation(archived.db,id)).archived,true);
  assert.deepEqual(await saveMemberLocation(archived.db,id,"admin",base),{ok:false,error:"archived"});
  const fail=mock({fail:true});
  await assert.rejects(()=>saveMemberLocation(fail.db,id,"admin",base),/sql-write-failed/);
  assert.equal(fail.sql.at(-1),"ROLLBACK");
 });
 it("migration additive v14, historique protégé et aucun calendrier régional ajouté",()=>{
  assert.match(MEMBER_LOCATION_MIGRATION_SQL,/CREATE TABLE public.smn_member_location/);
  assert.match(MEMBER_LOCATION_MIGRATION_SQL,/ON DELETE RESTRICT/);
  assert.match(MEMBER_LOCATION_MIGRATION_SQL,/schema_version=14/);
  assert.doesNotMatch(MEMBER_LOCATION_MIGRATION_SQL,/DROP TABLE|ON DELETE CASCADE|regional_calendar/i);
 });
});
