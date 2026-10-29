import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {resolveDayAvailability,readMemberDayAvailability} from
 "../src/server/members/day-availability";
import {parseAbsenceChange,absenceOnDate,type AbsenceItem} from "../src/server/members/absence";
import {canAccess} from "../src/server/access-policy";

const memberId="11111111-1111-4111-8111-111111111111";
const national="2026-05-01";
const allDay={startOn:national,endOn:national,startSlot:"morning" as const,endSlot:"afternoon" as const};
const afternoon={...allDay,startSlot:"afternoon" as const};
const morning={...allDay,endSlot:"morning" as const};
const working={morning:true,afternoon:true};
const regional=(name:string)=>({
 action:"create",revision:0,categoryId:"other",startOn:national,endOn:national,
 startSlot:"morning",endSlot:"afternoon",isPlanned:true,reason:name
});
const item=(values:typeof allDay,reason="Fête régionale"):AbsenceItem=>({
 ...values,id:"22222222-2222-4222-8222-222222222222",memberId,
 revision:1,categoryId:"other",categoryName:"Autre",categoryColor:"#6B7280",
 isPlanned:true,reason,createdAt:"2026-04-01",updatedAt:"2026-04-01",deleted:false
});
function dbFor(options:{country?:string|null;status?:string|null;holiday?:string|null;
 week?:boolean;exception?:boolean;assignment?:boolean;closure?:boolean}={}){
 const calls:string[]=[];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  calls.push(sql);
  // A closure query also joins smn_member_assignment. Match the specific
  // statement first so the fake database mirrors the SQL result type.
  if(sql.includes("SELECT schema_version FROM public.smn_installation"))return {rowCount:1,rows:[{schema_version:30}]};
  if(sql.includes("FROM public.smn_company_closure c")){
   const rows=options.closure?[{name:"Fermeture collective"}]:[];
   return {rowCount:rows.length,rows};
  }
  if(sql.includes("SELECT count(DISTINCT a.team_id)::integer AS team_count")){
   return {rowCount:1,rows:[{team_count:options.assignment===false?0:1}]};
  }
  if(sql.includes("smn_member_calendar_week"))return {
   rowCount:options.week===false?0:1,
   rows:options.week===false?[]:[{revision:1,effective_from:"2026-01-01",
    days:Array.from({length:7},(_,i)=>({weekday:i+1,
     morning:i<5,afternoon:i<5})),created_at:"2026-01-01"}]
  };
  if(sql.includes("smn_member_calendar_exception"))return {
   rowCount:options.exception?1:0,
   rows:options.exception?[{revision:1,on_date:national,morning:true,
    afternoon:false,note:null,created_at:"2026-02-01"}]:[]
  };
  if(sql.includes("smn_member_location"))return{
   rowCount:options.country===null?0:1,rows:options.country===null?[]:[{country_iso2:options.country??"FR"}]
  };
  if(sql.includes("smn_national_holiday"))return{
   rowCount:1,rows:[{name:options.holiday===undefined?"Fête du Travail":options.holiday,
    status:options.status??"configured"}]
  };
  throw Error("unexpected SQL "+sql);
 }} as unknown as Client;
 return {db,calls};
}
describe("jour régional traité comme absence individuelle",()=>{
 it("utilise la validation SMN-53 : date, catégorie et motif obligatoires, pas de nouvelle entité régionale",()=>{
  assert.equal(parseAbsenceChange(regional("Fête locale")).ok,true);
  assert.deepEqual(parseAbsenceChange(regional(" ")),{ok:false,error:"reason-required"});
  assert.deepEqual(parseAbsenceChange({...regional("Fête locale"),categoryId:""}),
   {ok:false,error:"category-required"});
  assert.deepEqual(parseAbsenceChange({...regional("Fête locale"),startOn:"2026-05-05"}),
   {ok:false,error:"invalid-period"});
  assert.deepEqual(absenceOnDate(allDay,national),working);
 });
 it("ne déduit qu'une fois deux demi-journées pour férié national + absence régionale",()=>{
  const resolved=resolveDayAvailability(national,working,true,[allDay]);
  assert.equal(resolved.status,"known");
  assert.deepEqual(resolved.unavailableSlots,{morning:true,afternoon:true});
  assert.deepEqual(resolved.availableSlots,{morning:false,afternoon:false});
  assert.equal(resolved.deductedHalfDays,2);
  assert.equal(resolved.nationalOverlap,true);
 });
 it("évite la double déduction si jour national + absence régionale limitée à un après-midi",()=>{
  const result=resolveDayAvailability(national,working,true,[afternoon]);
  assert.equal(result.deductedHalfDays,2);
  assert.deepEqual(result.absenceSlots,{morning:false,afternoon:true});
  assert.equal(result.nationalOverlap,true);
 });
 it("additionne par union de créneaux deux absences enregistrées sur demi-journées distinctes",()=>{
  const result=resolveDayAvailability(national,working,false,[morning,afternoon]);
  assert.equal(result.deductedHalfDays,2);
  assert.deepEqual(result.unavailableSlots,working);
  const dup=resolveDayAvailability(national,working,false,[morning,morning]);
  assert.equal(dup.deductedHalfDays,1);
 });
 it("respecte un samedi non travaillé et une exception de calendrier en demi-journée",()=>{
  assert.equal(resolveDayAvailability(national,{morning:false,afternoon:false},true,[allDay]).deductedHalfDays,0);
  assert.equal(resolveDayAvailability(national,{morning:true,afternoon:false},true,[allDay]).deductedHalfDays,1);
  assert.deepEqual(resolveDayAvailability(national,working,false,[afternoon]).availableSlots,
   {morning:true,afternoon:false});
 });
 it("ne suppose aucun jour travaillé ni calendrier national complet lorsque les références manquent",()=>{
  const scheduleUnknown=resolveDayAvailability(national,null,true,[allDay]);
  assert.equal(scheduleUnknown.status,"unknown");
  assert.equal(scheduleUnknown.deductedHalfDays,null);
  assert.equal(scheduleUnknown.availableSlots,null);
  const nationalUnknown=resolveDayAvailability(national,working,null,[afternoon]);
  assert.equal(nationalUnknown.status,"known");
  assert.equal(nationalUnknown.deductedHalfDays,1);
  assert.deepEqual(nationalUnknown.absenceSlots,{morning:false,afternoon:true});
 });
 it("récupère calendrier, localisation effective et jour férié sans dédupliquer par équipe",async()=>{
  const fixture=dbFor();
  const state=await readMemberDayAvailability(fixture.db,memberId,national,[item(allDay)]);
  assert.equal(state.countryIso2,"FR");
  assert.equal(state.nationalHoliday,true);
  assert.equal(state.assignmentApplicable,true);
  assert.equal(state.nationalHolidayName,"Fête du Travail");
  assert.equal(state.deductedHalfDays,2);
  assert.equal(state.nationalOverlap,true);
  assert.equal(state.status,"known");
  // Member/day availability is read-only, but must query the applicable
  // assignment and team to avoid inventing availability or a second team.
  assert.equal(fixture.calls.some(q=>/\b(?:INSERT|UPDATE|DELETE|TRUNCATE|ALTER)\b/i.test(q)),false);
  assert.equal(fixture.calls.filter(q=>q.includes("SELECT count(DISTINCT a.team_id)::integer AS team_count")).length,1);
  assert.equal(fixture.calls.filter(q=>q.includes("FROM public.smn_company_closure c")).length,1);
 });
 it("n'invente aucun férié lorsque le pays est inconnu ou le calendrier incomplet",async()=>{
  const noCountry=await readMemberDayAvailability(dbFor({country:null}).db,memberId,national,[item(allDay)]);
  assert.equal(noCountry.nationalHoliday,null);
  assert.equal(noCountry.status,"known");
  const partial=await readMemberDayAvailability(dbFor({status:"partial",holiday:null}).db,
   memberId,national,[item(allDay)]);
  assert.equal(partial.nationalHoliday,null);
  assert.equal(partial.status,"known");
  const holidayInPartial=await readMemberDayAvailability(dbFor({status:"partial"}).db,
   memberId,national,[item(allDay)]);
  assert.equal(holidayInPartial.nationalHoliday,true);
  assert.equal(holidayInPartial.deductedHalfDays,2);
  const withoutWeek=await readMemberDayAvailability(dbFor({week:false}).db,
   memberId,national,[item(allDay)]);
  assert.equal(withoutWeek.deductedHalfDays,null);
 });
 it("identifie une absence sans affectation applicable sans inventer une deuxième équipe",async()=>{
  const state=await readMemberDayAvailability(dbFor({assignment:false}).db,
   memberId,national,[item(allDay)]);
  assert.equal(state.assignmentApplicable,false);
  assert.equal(state.nationalOverlap,true);
 });
 it("ajoute la fermeture collective à la disponibilité individuelle sans double compte",async()=>{
  const state=await readMemberDayAvailability(dbFor({
   closure:true,holiday:null,status:"partial"
  }).db,memberId,national,[item(allDay)]);
  assert.equal(state.companyClosureName,"Fermeture collective");
  assert.equal(state.deductedHalfDays,2);
  assert.equal(state.status,"known");
 });
 it("respecte les exceptions individuelles pour décompter seulement les créneaux travaillés",async()=>{
  const fixture=dbFor({exception:true});
  const state=await readMemberDayAvailability(fixture.db,memberId,national,[item(allDay)]);
  assert.deepEqual(state.workingSlots,{morning:true,afternoon:false});
  assert.equal(state.deductedHalfDays,1);
 });
 it("ne produit ni suppression de Daily, ni écriture collective, ni duplication d'absence par équipe",()=>{
  const access={type:"members",exists:true,inScope:true};
  assert.equal(canAccess({role:"admin",is_active:true,must_change_password:false},"read",access),true);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},"read",access),false);
  const result=resolveDayAvailability(national,working,false,[allDay]);
  assert.equal(result.deductedHalfDays,2);
  assert.equal("teamId" in result,false);
  assert.equal("alerts" in result,false);
 });
});
