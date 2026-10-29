import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import type {Client} from "pg";
import {updateCalendarMeetingSchedule} from "../src/server/sprints/calendar-meeting-reschedule";
import {durationBetweenLocal} from "../src/lib/calendar-local-time";

const id="11111111-1111-4111-8111-111111111111";
const schedule={kind:"template" as const,id,startAt:"2026-11-20T14:00:00.000Z",
 endAt:"2026-11-20T15:00:00.000Z",revision:2};
function fake(overrides:{kind?:string;status?:string;sprintStatus?:string;
 revision?:number;started?:string;closed?:boolean}={}){
 const history:Array<{sql:string;args:unknown[]}>= [];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  history.push({sql,args});
  if(sql.includes("array_agg(relname)")||sql.includes("array_agg(c.relname)"))return {rows:[{present:["smn_sprint_ceremony_history","smn_scrum_template_occurrence","smn_sprint_exceptional_meeting","smn_sprint_exceptional_meeting_history","smn_scrum_ceremony_template","smn_scrum_ceremony_template_history","smn_calendar_meeting_schedule_history"]}]};
  if(sql.includes("FOR UPDATE OF m,s")){
   if(overrides.closed)return {rows:[]};
   return {rows:[{id,sprint_id:"sprint-1",starts_at:overrides.started??"2026-11-22T14:00:00Z",
     ends_at:"2026-11-22T15:00:00Z",revision:overrides.revision??2,
     sprint_start:"2026-11-09T08:00:00Z",sprint_end:"2026-11-22T22:00:00Z",
     sprint_status:overrides.sprintStatus??"planned",status:overrides.status??"scheduled"}]};
  }
  if(sql.includes("AS count"))return {rows:[{count:"1"}]};
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 return {db,history};
}
describe("Réunion décalée : dates début et fin",()=>{
 it("calcule la durée depuis les deux instants locaux",()=>{
  assert.equal(durationBetweenLocal("2026-11-20T15:00","2026-11-20T16:30","Europe/Paris"),90);
  assert.equal(durationBetweenLocal("2026-11-20T16:30","2026-11-20T15:00","Europe/Paris"),null);
  assert.equal(durationBetweenLocal("2026-03-29T02:30","2026-03-29T03:30","Europe/Paris"),null);
 });
 it("reprogramme une occurrence récurrente avec contrôle de révision et audit",async()=>{
  const {db,history}=fake();
  const r=await updateCalendarMeetingSchedule(db,"actor",schedule);
  assert.equal(r.ok,true);
  assert.ok(history.some(x=>x.sql.includes("UPDATE public.smn_scrum_template_occurrence")));
  assert.ok(history.some(x=>x.sql.includes("smn_calendar_meeting_schedule_history")));
  assert.ok(history.some(x=>x.sql==="COMMIT"));
  assert.ok(history.some(x=>x.sql.includes("COUNT")||x.sql.includes("count")));
 });
 it("rejette la concurrence sans écrire les horaires",async()=>{
  const {db,history}=fake({revision:3});
  assert.deepEqual(await updateCalendarMeetingSchedule(db,"actor",schedule),{ok:false,error:"conflict"});
  assert.ok(!history.some(x=>x.sql.includes("UPDATE public.smn_scrum_template_occurrence")));
 });
 it("refuse dates hors Sprint et Sprint clôturé",async()=>{
  const closed=fake({sprintStatus:"closed"});
  assert.deepEqual(await updateCalendarMeetingSchedule(closed.db,"actor",schedule),{ok:false,error:"closed-period"});
  const outside=fake();
  assert.deepEqual(await updateCalendarMeetingSchedule(outside.db,"actor",{
   ...schedule,startAt:"2026-11-22T21:30:00.000Z",endAt:"2026-11-22T22:30:00.000Z"
  }),{ok:false,error:"outside-sprint"});
 });
 it("refuse un événement annulé et une durée invalide",async()=>{
  assert.deepEqual(await updateCalendarMeetingSchedule(fake({status:"cancelled"}).db,"actor",schedule),
   {ok:false,error:"protected"});
  assert.deepEqual(await updateCalendarMeetingSchedule(fake().db,"actor",{
   ...schedule,endAt:schedule.startAt
  }),{ok:false,error:"invalid-input"});
 });
 it("refuse un type arbitraire ou un identifiant malformé",async()=>{
  assert.deepEqual(await updateCalendarMeetingSchedule(fake().db,"actor",{
   ...schedule,kind:"foreign" as "template"
  }),{ok:false,error:"invalid-input"});
  assert.deepEqual(await updateCalendarMeetingSchedule(fake().db,"actor",{
   ...schedule,id:"not-an-id"
  }),{ok:false,error:"invalid-input"});
 });
 it("valide la route en écriture et le formulaire indépendant Début / Fin",()=>{
  const modal=readFileSync(fileURLToPath(new URL("../src/app/app/team-calendar/calendar-meeting-modal.tsx",import.meta.url)),"utf8");
  const route=readFileSync(fileURLToPath(new URL("../src/app/api/team-calendar/meetings/[kind]/[id]/route.ts",import.meta.url)),"utf8");
  assert.match(modal,/setEnd\(e\.target\.value\)/);
  assert.match(modal,/durationBetweenLocal\(start,end,detail\.timeZone\)/);
  assert.match(modal,/void patch\(api,\{startAt:iso,endAt:isoEnd,revision:detail\.revision\}\)/);
  assert.match(route,/authorizeApi\(request,"write"/);
 });
 it("préserve le calcul autonome pour cérémonie et réunion exceptionnelle",async()=>{
  for(const kind of ["ceremony","exceptional"] as const){
   const {db,history}=fake();
   const r=await updateCalendarMeetingSchedule(db,"actor",{...schedule,kind});
   assert.equal(r.ok,true);
   assert.ok(history.some(x=>x.sql.includes(
    kind==="ceremony"?"UPDATE public.smn_sprint_ceremony":"UPDATE public.smn_sprint_exceptional_meeting"
   )));
  }
 });
});