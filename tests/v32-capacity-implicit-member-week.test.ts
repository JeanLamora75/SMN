import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const engine=readFileSync(new URL("../src/server/capacity/engine.ts",import.meta.url),"utf8");
const calendar=readFileSync(new URL("../src/server/members/calendar.ts",import.meta.url),"utf8");
test("capacity uses the same default workweek as the member calendar editor",()=>{
 assert.match(engine,/resolveCalendarDay,DEFAULT_WEEK/);
 assert.match(engine,/memberWeeks\.some\(w=>w\.effective_from<=date\)/);
 assert.match(engine,/effective_from:"1900-01-01",days:DEFAULT_WEEK/);
 assert.match(engine,/resolveCalendarDay\(effectiveWeeks,memberExceptions,date\)/);
 assert.match(calendar,/export const DEFAULT_WEEK/);
});
test("assignment, absences, holidays and company closures remain applied",()=>{
 for(const marker of ["if(active.length===0)continue","resolveDayAvailability(date,calendar.slots,national,","memberAbsences.map(","closureForMember(","computeDevelopmentDay(availableHalfDays"])
  assert.ok(engine.includes(marker),marker);
});
