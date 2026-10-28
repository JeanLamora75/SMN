import assert from "node:assert/strict";
import test from "node:test";
import {closureForMember,computeDevelopmentDay} from "../src/server/capacity/engine";
import {resolveDayAvailability} from "../src/server/members/day-availability";
const a="a",b="b";
const closures=[{member_id:a,start_on:"2026-12-24",end_on:"2026-12-31"}];
test("la fermeture d'une entreprise ne s'applique qu'à ses membres",()=>{
 assert.equal(closureForMember(closures,a,"2026-12-25",true),true);
 assert.equal(closureForMember(closures,b,"2026-12-25",true),false);
 assert.equal(closureForMember(closures,a,"2026-12-23",true),false);
});
test("union jour férié, absence et fermeture : jamais plus d'une journée",()=>{
 const absent=[{startOn:"2026-12-25",endOn:"2026-12-25",startSlot:"morning" as const,endSlot:"afternoon" as const}];
 const availability=resolveDayAvailability("2026-12-25",{morning:true,afternoon:true},true,absent,true);
 assert.equal(availability.deductedHalfDays,2);
 assert.deepEqual(availability.availableSlots,{morning:false,afternoon:false});
 assert.deepEqual(computeDevelopmentDay(0,8,100,100,100),{hours:0,jh:0});
});
test("sans entreprise ni jour férié ni absence, capacité complète",()=>{
 const availability=resolveDayAvailability("2026-12-28",{morning:true,afternoon:true},false,[],false);
 assert.equal(availability.deductedHalfDays,0);
 assert.deepEqual(computeDevelopmentDay(2,8,100,100,100),{hours:8,jh:1});
});
