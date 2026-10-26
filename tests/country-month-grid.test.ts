import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {daysInMonth,isoCivilDate,mondayFirstMonthCells,moveCalendarMonth,scopedYearHolidays} from "../src/lib/countries/month-grid";

describe("Calendrier national : calcul civil sans fuseau navigateur",()=>{
 it("commence les semaines le lundi et conserve les fins de mois",()=>{
  const c=mondayFirstMonthCells(2026,10); // 1/11/2026 est dimanche
  assert.deepEqual(c.slice(0,7),[null,null,null,null,null,null,1]);
  assert.equal(c.filter(d=>d!==null).length,30);
  assert.equal(c.length%7,0);
 });
 it("années bissextiles et dates ISO fixes",()=>{
  assert.equal(daysInMonth(2028,1),29);
  assert.equal(daysInMonth(2027,1),28);
  assert.equal(isoCivilDate(2028,1,29),"2028-02-29");
 });
 it("navigation décembre/janvier et limites 1900–2200",()=>{
  assert.deepEqual(moveCalendarMonth({year:2026,month:11},1),{year:2027,month:0});
  assert.deepEqual(moveCalendarMonth({year:2026,month:0},-1),{year:2025,month:11});
  assert.deepEqual(moveCalendarMonth({year:1900,month:0},-1),{year:1900,month:0});
  assert.deepEqual(moveCalendarMonth({year:2200,month:11},1),{year:2200,month:11});
 });
 it("refuse les données d'un autre pays ou d'une autre année",()=>{
  const payload={country:"FR",year:2026,holidays:[{date:"2026-05-01",name:"Fête"}]};
  assert.deepEqual(scopedYearHolidays(payload,"FR",2026),payload.holidays);
  assert.equal(scopedYearHolidays(payload,"FR",2027),null);
  assert.equal(scopedYearHolidays(payload,"DE",2026),null);
  assert.equal(scopedYearHolidays({country:"FR",year:2026,holidays:[
   {date:"2025-05-01",name:"Fête"}]},"FR",2026),null);
  assert.equal(scopedYearHolidays({country:"FR",year:2026,holidays:null},"FR",2026),null);
 });
 it("refuse les mois et millésimes hors du périmètre",()=>{
  assert.throws(()=>mondayFirstMonthCells(2026,12),/invalid-calendar-month/);
  assert.throws(()=>mondayFirstMonthCells(1899,0),/invalid-calendar-month/);
 });
});
