import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {describe,it} from "node:test";
import {annualDisplayStatus,normalizeCountrySearch} from "../src/lib/countries/year-status";
import {isoCivilDate,mondayFirstMonthCells,scopedYearHolidays}
 from "../src/lib/countries/month-grid";
import {visibilityAfterLifecycle} from "../src/lib/countries/lifecycle-ux";

const root=new URL("../",import.meta.url);
const read=(path:string)=>readFileSync(new URL(path,root),"utf8");
function flatten(value:unknown,prefix="",out=new Map<string,string>()):Map<string,string>{
 assert.ok(value&&typeof value==="object"&&!Array.isArray(value));
 for(const [key,item] of Object.entries(value)){
  const path=prefix?prefix+"."+key:key;
  if(typeof item==="string"){
   assert.ok(item.trim(),path+" must not be blank");
   out.set(path,item);
  }else flatten(item,path,out);
 }
 return out;
}
const placeholders=(input:string)=>[...input.matchAll(/\{([A-Za-z][\w]*)\}/g)]
 .map(x=>x[1]).sort();

describe("Recette transverse pays — contrats vérifiables sans accès base",()=>{
 it("assure parité complète FR/EN et interpolation sur tout le catalogue",()=>{
  const fr=flatten(JSON.parse(read("src/i18n/fr.json")));
  const en=flatten(JSON.parse(read("src/i18n/en.json")));
  assert.ok(fr.size>3000,"Missing expected application translations");
  assert.deepEqual([...fr.keys()].sort(),[...en.keys()].sort());
  for(const [key,value] of fr)
   assert.deepEqual(placeholders(value),placeholders(en.get(key)!),key);
 });
 it("ne confond pas absence de couverture et année réellement vide",()=>{
  assert.equal(annualDisplayStatus(undefined),"unknown");
  assert.equal(annualDisplayStatus({
   year:2026,status:"not-configured",count:0,diagnostic:null}),"not-configured");
  assert.equal(annualDisplayStatus({
   year:2026,status:"configured",count:11,diagnostic:null}),"review");
  assert.equal(annualDisplayStatus({
   year:2026,status:"configured",count:11,diagnostic:null,administrativeValidated:true}),"configured");
  assert.equal(annualDisplayStatus({
   year:2026,status:"invalid",count:11,diagnostic:"invalid",administrativeValidated:true}),"invalid");
 });
 it("conserve les jours civils aux changements d'heure d'Europe/Paris",()=>{
  assert.equal(isoCivilDate(2026,2,29),"2026-03-29");
  assert.equal(isoCivilDate(2026,9,25),"2026-10-25");
  assert.equal(isoCivilDate(2028,1,29),"2028-02-29");
  assert.equal(mondayFirstMonthCells(2028,1).filter(x=>x!==null).length,29);
 });
 it("refuse une réponse de calendrier d'un autre pays ou millésime",()=>{
  const year={country:"FR",year:2026,holidays:[{date:"2026-05-01",name:"Travail"}]};
  assert.deepEqual(scopedYearHolidays(year,"FR",2026),year.holidays);
  assert.equal(scopedYearHolidays(year,"DE",2026),null);
  assert.equal(scopedYearHolidays(year,"FR",2027),null);
  assert.equal(scopedYearHolidays({...year,holidays:[
   {date:"2027-01-01",name:"Wrong year"}]},"FR",2026),null);
 });
 it("garde le pays visible après une action qui changerait son filtre",()=>{
  assert.equal(visibilityAfterLifecycle("active","archive"),"all");
  assert.equal(visibilityAfterLifecycle("archived","reactivate"),"all");
  assert.equal(visibilityAfterLifecycle("all","archive"),"all");
 });
 it("conserve les routes publiques d'administration existantes avec contrôle serveur",()=>{
  const routes=[
   "src/app/api/admin/countries/route.ts",
   "src/app/api/admin/countries/[code]/route.ts",
   "src/app/api/admin/countries/calendar/route.ts",
   "src/app/api/admin/countries/[code]/holidays/route.ts",
   "src/app/api/admin/countries/[code]/calendar/validate/route.ts",
   "src/app/api/admin/countries/[code]/lifecycle/route.ts",
   "src/app/api/admin/countries/import-csv/route.ts",
   "src/app/api/admin/countries/import-ics/route.ts"
  ];
  for(const path of routes){
   assert.ok(existsSync(new URL(path,root)),path+" route missing");
   assert.match(read(path),/authorizeApi\(/,path+" missing server authorization call");
  }
 });
 it("recherche les pays sans dépendre des accents",()=>{
  assert.equal(normalizeCountrySearch("  Côte D'IVOIRE  "),"cote d'ivoire");
 });
});
