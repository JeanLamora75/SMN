import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {TeamCalendarResponse} from "../src/server/members/team-calendar";
import {calendarDates,parseTeamCalendarQuery} from "../src/server/members/team-calendar";
import {projectCentralCalendar,filterCentralCalendar} from "../src/server/members/central-calendar";
import {formatMemberEvent} from "../src/server/members/location";
import {canAccess} from "../src/server/access-policy";

const memberId="11111111-1111-4111-8111-111111111111";
const absenceId="22222222-2222-4222-8222-222222222222";
function sample(admin=true,start="2026-10-19"):TeamCalendarResponse{
 const dates=calendarDates(start,7);
 return {
  team:{id:"team-main",name:"Equipe A",mode:"scrum"},
  start,end:dates[6],days:7,kind:"all",
  collective:dates.map((date,i)=>({
   date,assigned:3,reportedUnavailable:i===0?1:0,
   declaredAbsentMemberCount:i===0?1:0,hasNationalHoliday:false,
   known:i===0?2:3,unknown:i===0?1:0,availableMembers:2
  })),
  closures:[{id:"closed-1",name:"Journée entreprise",startOn:dates[1],endOn:dates[1]}],
  ...(admin?{admin:{
   categories:[{id:"other",name:"Autre"}],
   members:[{id:memberId,displayName:"Membre privé",memberNumber:1,days:[{
    date:dates[0],assignmentApplicable:true,hasDeclaredAbsence:true,
    workingSlots:{morning:true,afternoon:true},
    availableSlots:{morning:false,afternoon:false},
    deductedHalfDays:2,status:"known",nationalHolidayName:"Fête locale",
    companyClosureName:null,
    absences:[{
     id:absenceId,revision:1,categoryId:"other",categoryName:"Autre",
     categoryColor:"#6B7280",startOn:dates[0],endOn:dates[0],
     startSlot:"morning",endSlot:"afternoon",isPlanned:false,
     reason:"Motif privé confidentiel"
    }]
   }]}]
  }}:{})
 };
}
describe("SMN-64 — agenda collectif en lecture seule",()=>{
 it("AC1 : réutilise les absences et fermetures réellement connues, avec légende et sources",()=>{
  const base=sample(true);
  const result=projectCentralCalendar(base,true);
  const absence=result.items.find(x=>x.id===absenceId);
  assert.ok(absence);
  assert.equal(absence.date,base.start);
  assert.equal(absence.memberId,memberId);
  assert.equal(absence.categoryName,"Autre");
  assert.equal(absence.categoryColor,"#6B7280");
  assert.equal(absence.sourceHref,"/app/admin/members");
  assert.equal(absence.planned,false);
  assert.equal(Object.hasOwn(absence,"reason"),false);
  assert.ok(result.types.includes("absence"));
  assert.ok(result.types.includes("meeting"));
  assert.deepEqual(result.items.filter(x=>x.type==="closure").map(x=>x.title),
   ["Journée entreprise"]);
  assert.equal(result.cyclesAvailable,false);
  assert.equal(result.meetingsAvailable,false);
  assert.equal(result.items.some(x=>x.type==="cycle"||x.type==="meeting"),false);
 });
 it("AC1/AC5 : un utilisateur ne reçoit aucun identifiant ni motif individuel",()=>{
  const ordinary=projectCentralCalendar(sample(false),false);
  const serialized=JSON.stringify(ordinary);
  assert.equal(serialized.includes(memberId),false);
  assert.equal(serialized.includes(absenceId),false);
  assert.equal(serialized.includes("Membre privé"),false);
  assert.equal(serialized.includes("Motif privé"),false);
  assert.equal(serialized.includes("Fête locale"),false);
  const collective=ordinary.items.find(x=>x.type==="absence");
  assert.ok(collective);
  assert.equal(collective.aggregateCount,1);
  assert.equal(collective.sourceHref,"#team-calendar-collective");
  assert.equal(collective.memberId,undefined);
  assert.equal(ordinary.items.some(x=>x.type==="holiday"),false);
 });
 it("propage l'information fériée agrégée sans exposer la localisation d'un membre",()=>{
  const base=sample(false);
  base.collective[0].hasNationalHoliday=true;
  const items=projectCentralCalendar(base,false).items;
  assert.equal(items.filter(x=>x.type==="holiday").length,1);
  assert.equal(items.find(x=>x.type==="holiday")?.title,"");
  assert.equal(JSON.stringify(items).includes("Membre privé"),false);
 });
 it("AC2 : statut de réunion passé inconnu reste inconnu, pas tenu automatiquement",()=>{
  const base=sample(true);
  const meeting={id:"meeting1",name:"Rétrospective réelle",
   startsAtUtc:"2026-10-19T09:30:00Z",timeZone:"Europe/Paris",
   status:null,sourceHref:"/app/events/meeting1"} as const;
  const output=projectCentralCalendar(base,true,[],[meeting]);
  const found=output.items.find(x=>x.type==="meeting");
  assert.ok(found);
  assert.equal(found.meetingStatus,"unknown");
  assert.equal(new Date(found.utcInstant).getTime(),new Date(meeting.startsAtUtc).getTime());
  assert.equal(found.ianaZone,"Europe/Paris");
  assert.equal(found.date,"2026-10-19");
  assert.equal(output.meetingsAvailable,true);
  const changed=projectCentralCalendar(base,true,[],[{...meeting,status:"held" as const}]);
  assert.equal(changed.items.find(x=>x.type==="meeting")?.meetingStatus,"held");
  assert.equal(projectCentralCalendar(base,true).items.some(x=>x.type==="meeting"),false);
 });
 it("AC3 : filtres par type/membre en mémoire, sans altérer les données sources",()=>{
  const base=sample(true);
  const before=JSON.stringify(base);
  const result=projectCentralCalendar(base,true);
  assert.equal(filterCentralCalendar(result.items,"closure").length,1);
  assert.equal(filterCentralCalendar(result.items,"absence",memberId).length,1);
  assert.equal(filterCentralCalendar(result.items,"absence",
   "33333333-3333-4333-8333-333333333333").length,0);
  assert.equal(filterCentralCalendar(result.items,"meeting").length,0);
  assert.equal(JSON.stringify(base),before);
  const query=new URLSearchParams({start:"2026-10-19",days:"7",teamId:"team-main"});
  assert.equal(parseTeamCalendarQuery(query,false)?.teamId,"team-main");
  assert.equal(parseTeamCalendarQuery(new URLSearchParams({
   start:"2026-10-19",memberId
  }),false),null);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},
   "read",{type:"collective",exists:true,inScope:true}),true);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},
   "write",{type:"collective",exists:true,inScope:true}),false);
 });
 it("AC4 : dates calendaires inchangées malgré les transitions d'heure",()=>{
  const day=sample(true,"2026-10-24");
  const meetings=[
   {id:"m1",name:"Avant bascule",startsAtUtc:"2026-10-25T00:30:00Z",
    timeZone:"Europe/Paris",status:"scheduled" as const,
    sourceHref:"/app/events/m1"},
   {id:"m2",name:"Après bascule",startsAtUtc:"2026-10-25T01:30:00Z",
    timeZone:"Europe/Paris",status:"scheduled" as const,
    sourceHref:"/app/events/m2"},
   {id:"m3",name:"Minuit côté Paris",startsAtUtc:"2026-10-25T23:30:00Z",
    timeZone:"Europe/Paris",status:null,sourceHref:"/app/events/m3"}
  ];
  const output=projectCentralCalendar(day,true,[],meetings).items
   .filter(x=>x.type==="meeting");
  assert.equal(output.length,3);
  assert.equal(output.find(x=>x.id==="m1")?.date,"2026-10-25");
  assert.equal(output.find(x=>x.id==="m2")?.date,"2026-10-25");
  assert.equal(output.find(x=>x.id==="m3")?.date,"2026-10-26");
  assert.match(output.find(x=>x.id==="m1")?.localTime??"",/02:30/);
  assert.match(output.find(x=>x.id==="m2")?.localTime??"",/02:30/);
  assert.notEqual(output.find(x=>x.id==="m1")?.utcInstant,
   output.find(x=>x.id==="m2")?.utcInstant);
  const raw=formatMemberEvent("2026-03-29T01:30:00Z","Europe/Paris");
  assert.equal(raw.parts.hour,"03");
  assert.equal(calendarDates("2026-10-24",7)[2],"2026-10-26");
 });
 it("AC5 : cycles seulement sur source réelle, aucun faux événement ni déplacement",()=>{
  const base=sample(true);
  const unchanged=JSON.stringify(base);
  const cycles=[{id:"c1",name:"Cycle existant",
   startOn:"2026-10-20",endOn:"2026-10-21",
   sourceHref:"/app/cycles/c1"}];
  const output=projectCentralCalendar(base,true,cycles);
  assert.deepEqual(output.items.filter(x=>x.type==="cycle").map(x=>x.date),
   ["2026-10-20","2026-10-21"]);
  assert.equal(output.cyclesAvailable,true);
  assert.equal(JSON.stringify(base),unchanged);
  const noLink=projectCentralCalendar(base,true,[{
   ...cycles[0],sourceHref:"https://invalid.example"
  }]);
  assert.equal(noLink.items.find(x=>x.type==="cycle")?.sourceHref,null);
 });
});
