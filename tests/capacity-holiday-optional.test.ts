import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {resolveDayAvailability} from "../src/server/members/day-availability";

const onDate="2026-10-26";
const full={morning:true,afternoon:true};

describe("La disponibilité dépend du calendrier, pas du pays ou de l'import férié",()=>{
 it("calcule deux demi-journées sans calendrier national connu",()=>{
  const value=resolveDayAvailability(onDate,full,null,[]);
  assert.equal(value.status,"known");
  assert.deepEqual(value.availableSlots,full);
  assert.equal(value.deductedHalfDays,0);
 });
 it("une trame individuelle absente reste non calculable",()=>{
  const value=resolveDayAvailability(onDate,null,null,[]);
  assert.equal(value.status,"unknown");
  assert.equal(value.availableSlots,null);
  assert.equal(value.deductedHalfDays,null);
 });
 it("un jour férié effectivement déclaré déduit deux demi-journées",()=>{
  const value=resolveDayAvailability(onDate,full,true,[]);
  assert.equal(value.status,"known");
  assert.deepEqual(value.availableSlots,{morning:false,afternoon:false});
  assert.equal(value.deductedHalfDays,2);
 });
 it("les absences se déduisent même sans calendrier férié",()=>{
  const value=resolveDayAvailability(onDate,full,null,[{
   startOn:onDate,endOn:onDate,startSlot:"morning" as const,endSlot:"morning" as const
  }]);
  assert.equal(value.status,"known");
  assert.deepEqual(value.availableSlots,{morning:false,afternoon:true});
  assert.equal(value.deductedHalfDays,1);
 });
 it("l'absence, la fermeture et un férié ne sont pas déduits deux fois",()=>{
  const value=resolveDayAvailability(onDate,full,true,[{
   startOn:onDate,endOn:onDate,startSlot:"morning" as const,endSlot:"afternoon" as const
  }],true);
  assert.equal(value.status,"known");
  assert.equal(value.deductedHalfDays,2);
 });
 it("un calendrier à zéro demi-journée donne un zéro connu, même sans pays",()=>{
  const value=resolveDayAvailability(onDate,{morning:false,afternoon:false},null,[]);
  assert.equal(value.status,"known");
  assert.equal(value.deductedHalfDays,0);
  assert.deepEqual(value.availableSlots,{morning:false,afternoon:false});
 });
});
