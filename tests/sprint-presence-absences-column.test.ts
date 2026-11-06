import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import {presenceFromCapacity,presenceFromSnapshot} from "../src/lib/sprint-presence";
import {eligibleAbsenceItems} from "../src/server/capacity/absence-projection";

const read=(path:string)=>readFileSync(new URL("../src/"+path,import.meta.url),"utf8");
const abs=(startOn:string,endOn:string,startSlot:"morning"|"afternoon",endSlot:"morning"|"afternoon",isPlanned=true)=>({
 start_on:startOn,end_on:endOn,start_slot:startSlot,end_slot:endSlot,is_planned:isPlanned,category_name:isPlanned?"Congés":"Maladie",reason:"Absence enregistrée",
});
const work={morning:true,afternoon:true};
test("absence display: half-days, assignment days, weekends and national holidays",()=>{
 const leave=[abs("2026-11-09","2026-11-13","morning","afternoon")];
 assert.deepEqual(eligibleAbsenceItems("2026-11-09",work,false,false,leave).map(x=>x.halfDays),[2]);
 assert.deepEqual(eligibleAbsenceItems("2026-11-11",work,true,false,leave),[]);
 assert.deepEqual(eligibleAbsenceItems("2026-11-14",work,false,false,leave),[]);
 assert.deepEqual(eligibleAbsenceItems("2026-11-10",{morning:false,afternoon:true},false,false,leave).map(x=>x.halfDays),[1]);
 assert.deepEqual(eligibleAbsenceItems("2026-11-12",work,false,true,leave),[]);
 assert.deepEqual(eligibleAbsenceItems("2026-11-09",work,false,false,[abs("2026-11-09","2026-11-09","afternoon","afternoon",false)]).map(x=>x.halfDays),[1]);
});
test("absence display: overlapping records never double-count available half-days",()=>{
 const list=[abs("2026-11-09","2026-11-09","morning","afternoon"),abs("2026-11-09","2026-11-09","afternoon","afternoon",false)];
 assert.equal(eligibleAbsenceItems("2026-11-09",work,false,false,list).reduce((s,x)=>s+x.halfDays,0),2);
});
test("absence display: total and tooltip details use same capacity dates",()=>{
 const report=presenceFromCapacity({hoursPerJh:7,members:[{memberId:"m",displayName:"M",totalJh:4,
  days:[{date:"2026-11-09",status:"calculated",availableHalfDays:0,absenceItems:eligibleAbsenceItems("2026-11-09",work,false,false,[abs("2026-11-09","2026-11-09","morning","afternoon")])},
        {date:"2026-11-10",status:"calculated",availableHalfDays:1,absenceItems:eligibleAbsenceItems("2026-11-10",work,false,false,[abs("2026-11-10","2026-11-10","morning","morning",false)])},
        {date:"2026-11-11",status:"calculated",availableHalfDays:0,absenceItems:[]}]}]});
 assert.equal(report.members[0].absenceJh,1.5);
 assert.deepEqual(report.members[0].absences?.map(x=>[x.date,x.halfDays]),[["2026-11-09",2],["2026-11-10",1]]);
 assert.equal(report.members[0].presenceJh,1.5);
});
test("absence display: legacy snapshots are unknown, never zero",()=>{
 const snapshot=presenceFromSnapshot({state:"available",hoursPerJh:7,totalPresenceJh:1,members:[{memberId:"m",displayName:"M",presenceJh:1,developmentJh:1,daysCount:1,unknownDays:0}]},1);
 assert.equal(snapshot.state,"available");
 if(snapshot.state==="available")assert.equal(snapshot.members[0].absenceJh,undefined);
});
test("absence display: unknown capacity days cannot produce a false zero",()=>{
 const report=presenceFromCapacity({hoursPerJh:7,members:[{memberId:"m",displayName:"M",totalJh:null,
  days:[{date:"2026-11-09",status:"not-calculable",availableHalfDays:null,absenceItems:undefined}]}]});
 assert.equal(report.members[0].absenceJh,null);
});
test("absence display: detail column is between presence and development",()=>{
 const c=read("app/app/admin/sprints/[sprintId]/sprint-capacity-panel.tsx");
 const a=c.indexOf('t("sprintDetail.presenceJh")');
 const b=c.indexOf('Absences (J/H)');
 const d=c.indexOf('t("sprintDetail.presenceDevelopmentJh")');
 assert.ok(a>=0&&b>a&&d>b);
 assert.match(c,/title=\{absenceTooltip/);
 assert.match(c,/tabIndex=\{0\}/);
 const producer=read("server/capacity/engine.ts");
 assert.match(producer,/eligibleAbsenceItems/);
});
