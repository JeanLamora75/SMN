import test from "node:test";
import assert from "node:assert/strict";
import {validWorkSlots,workingIntervals,occupiedMinutes,resolveLocalMinute} from "./work-slots";
const slots={morningStart:"09:00",morningEnd:"13:00",afternoonStart:"14:00",afternoonEnd:"18:00"};
test("aucun horaire implicite et ordre strict",()=>{
 assert.equal(validWorkSlots(slots),true);
 assert.equal(validWorkSlots({...slots,afternoonStart:"12:00"}),false);
});
test("créneaux calculés en heure locale et absence prise en compte",()=>{
 const work=workingIntervals("2026-07-01","Europe/Paris",slots,{morning:true,afternoon:false});
 assert.ok(work);assert.equal(work.length,1);
 const meeting=[{start:Date.parse("2026-07-01T09:00:00Z"),end:Date.parse("2026-07-01T12:00:00Z")}];
 assert.equal(occupiedMinutes(meeting,work),120);
});
test("heure inexistante au changement d'heure refusée",()=>{
 assert.equal(resolveLocalMinute("2026-03-29","02:30","Europe/Paris"),null);
});
test("union des réunions sans double déduction",()=>{
 const work=workingIntervals("2026-07-01","Europe/Paris",slots,{morning:true,afternoon:true})!;
 const meetings=[{start:Date.parse("2026-07-01T07:00:00Z"),end:Date.parse("2026-07-01T08:00:00Z")},{start:Date.parse("2026-07-01T07:30:00Z"),end:Date.parse("2026-07-01T08:30:00Z")}];
 assert.equal(occupiedMinutes(meetings,work),90);
});
