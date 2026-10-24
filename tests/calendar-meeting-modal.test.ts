import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {readCalendarMeeting,validCalendarMeetingRef} from "../src/server/sprints/calendar-meeting-detail";
import {resolveCalendarLocalTime} from "../src/lib/calendar-local-time";
import type {Client} from "pg";

const uuid="11111111-1111-4111-8111-111111111111";
const read=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");

describe("SMN calendrier — fiche événement en modale",()=>{
 it("valide strictement les références avant toute requête SQL",()=>{
  assert.equal(validCalendarMeetingRef("ceremony",uuid),true);
  assert.equal(validCalendarMeetingRef("template",uuid),true);
  assert.equal(validCalendarMeetingRef("exceptional",uuid),true);
  for(const kind of ["admin","foo","ceremony; DROP TABLE x",""]){
   assert.equal(validCalendarMeetingRef(kind,uuid),false);
  }
  assert.equal(validCalendarMeetingRef("ceremony","../../etc/passwd"),false);
 });
 it("charge une cérémonie de l'équipe sans mutation ni données confidentielles",async()=>{
  const queries:string[]=[];
  const fake={query:async(sql:string)=>{
   queries.push(sql);
   if(sql.includes("information_schema.columns"))return {rows:[
    "id","sprint_id","kind","starts_at","ends_at","occurrence_status",
    "revision","minutes","actual_minutes","generation_source","status_explicit"
   ].map(column_name=>({column_name}))};
   return {rows:[{id:uuid,kind:"ceremony",name:"Sprint 1 — daily",sprint_name:"Sprint 1",
    sprint_id:uuid,start_at:"2026-10-20T09:00:00+02:00",
    end_at:"2026-10-20T09:15:00+02:00",status:"scheduled",status_explicit:false,
    sprint_status:"active",time_zone:"Europe/Paris",planned_minutes:15,actual_minutes:null,
    revision:3,generation_source:"standard",ceremony_kind:"daily"}]};
  }} as unknown as Client;
  const item=await readCalendarMeeting(fake,"ceremony",uuid);
  assert.equal(item?.revision,3);
  assert.equal(item?.name,"Sprint 1 — daily");
  assert.equal(item?.status,"scheduled");
  assert.equal(item?.plannedMinutes,15);
  assert.equal(item?.timeZone,"Europe/Paris");
  assert.equal(queries.length,2);
  assert.match(queries[1],/i\.id='singleton'/);
  assert.ok(queries.every(q=>!/(INSERT |UPDATE |DELETE |ALTER |CREATE )/i.test(q)));
  assert.doesNotMatch(JSON.stringify(item),/actorId|reason|participantIds/i);
 });
 it("respecte l'heure locale de Paris et refuse les instants d'été/hiver ambigus",()=>{
  assert.equal(resolveCalendarLocalTime("2026-10-20T09:00","Europe/Paris"),"2026-10-20T07:00:00.000Z");
  assert.equal(resolveCalendarLocalTime("2026-03-29T02:30","Europe/Paris"),null);
  assert.equal(resolveCalendarLocalTime("2026-10-25T02:30","Europe/Paris"),null);
  assert.equal(resolveCalendarLocalTime("bad","Europe/Paris"),null);
 });
 it("applique les autorisations API et laisse les données personnelles hors de la fiche",()=>{
  const route=read("src/app/api/team-calendar/meetings/[kind]/[id]/route.ts");
  const modal=read("src/app/app/team-calendar/calendar-meeting-modal.tsx");
  assert.match(route,/authorizeApi\(request,"read",target\)/);
  assert.match(route,/validCalendarMeetingRef\(kind,id\)/);
  assert.match(modal,/isAdmin&&detail!==null/);
  assert.match(modal,/onSaved\(\)/);
  assert.match(modal,/attendanceKind\[detail.kind\]/);
  assert.match(modal,/role="dialog" aria-modal="true"/);
  assert.match(modal,/event.key==="Escape"/);
 });
 it("utilise le même comportement dans Cartes et Agenda, sans navigation forcée",()=>{
  const day=read("src/app/app/team-calendar/calendar-option-b.tsx");
  const parent=read("src/app/app/team-calendar/team-calendar-view.tsx");
  assert.match(day,/onOpenEvent\(m\)/);
  assert.doesNotMatch(day,/<Link href=\{m\.href\}/);
  assert.match(parent,/<CalendarMeetingModal/);
  assert.match(parent,/onOpenEvent=/);
 });
});
