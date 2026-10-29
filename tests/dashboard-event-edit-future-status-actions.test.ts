import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {futureAttendanceTransitionForbidden,updateDashboardEvent}
 from "../src/server/dashboard/event-edit";

const read=(file:string)=>readFileSync(new URL("../"+file,import.meta.url),"utf8");
const id="00000000-0000-4000-8000-000000000041";
const sprintId="00000000-0000-4000-8000-000000000042";
const futureStart="2099-10-27T09:30:00.000Z";
const futureEnd="2099-10-27T09:45:00.000Z";
const now=Date.parse("2026-10-26T09:00:00Z");

test("une réunion déjà tenue dans le futur peut être éditée sans changer son statut",()=>{
 assert.equal(futureAttendanceTransitionForbidden("held",futureEnd,"held",futureEnd,now),false);
 assert.equal(futureAttendanceTransitionForbidden("not_held",futureEnd,"not_held",futureEnd,now),false);
 assert.equal(futureAttendanceTransitionForbidden("held",futureEnd,"scheduled",futureEnd,now),false);
});

test("une nouvelle déclaration tenue/non tenue dans le futur reste interdite",()=>{
 assert.equal(futureAttendanceTransitionForbidden("scheduled",futureEnd,"held",futureEnd,now),true);
 assert.equal(futureAttendanceTransitionForbidden("scheduled",futureEnd,"not_held",futureEnd,now),true);
 assert.equal(futureAttendanceTransitionForbidden("held","2026-10-25T09:45:00Z","held",futureEnd,now),true);
 assert.equal(futureAttendanceTransitionForbidden("scheduled","2026-10-25T09:45:00Z",
  "held","2026-10-25T09:45:00Z",now),false);
});

test("l'édition de la durée réelle d'un Daily déjà marqué tenu ne renvoie pas 409",async()=>{
 const statements:string[]=[];
 const columns=["id","sprint_id","starts_at","ends_at","name","status","actual_minutes"];
 const db={
  query:async(sql:string)=>{
   statements.push(sql);
   if(sql.includes("array_agg(relname)")||sql.includes("array_agg(c.relname)"))return {rows:[{present:["smn_meeting_actual_duration_audit","smn_sprint_ceremony_status_history","smn_scrum_template_occurrence_status_history","smn_sprint_exceptional_meeting_status_history"]}]};
   if(sql.includes("information_schema.columns"))return {rows:columns.map(column_name=>({column_name}))};
   if(sql.includes("SELECT e.id,e.name AS title"))return {rows:[{
    id,title:"Daily Scrum",start_at:futureStart,end_at:futureEnd,
    status:"held",duration:15,team_id:"team-1",sprint_id:sprintId,
    sprint_status:"active",sprint_start:"2099-10-26T00:00:00Z",
    sprint_end:"2099-10-30T23:59:59Z",revision:null,actual_minutes:10
   }]};
   return {rows:[],rowCount:1};
  }
 } as unknown as Client;
 const result=await updateDashboardEvent(db,"admin","template",id,{
  teamId:"team-1",sprintId,title:"Daily Scrum",startAt:futureStart,
  duration:15,status:"held",actualMinutes:11,expectedActualMinutes:10,
  expectedTitle:"Daily Scrum",expectedStartAt:futureStart,
  expectedEndAt:futureEnd,expectedStatus:"held"
 });
 assert.deepEqual(result,{ok:true,id,changed:true});
 assert.ok(statements.some(sql=>sql.startsWith("UPDATE public.smn_scrum_template_occurrence")));
 assert.ok(statements.some(sql=>sql.includes("smn_dashboard_event_edit_audit")));
 assert.equal(statements.at(-1),"COMMIT");
});

test("la sauvegarde d'une nouvelle réunion tenue à une date future est bloquée",async()=>{
 const statements:string[]=[];
 const columns=["id","sprint_id","starts_at","ends_at","name","status","actual_minutes"];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("array_agg(relname)")||sql.includes("array_agg(c.relname)"))return {rows:[{present:["smn_meeting_actual_duration_audit","smn_sprint_ceremony_status_history","smn_scrum_template_occurrence_status_history","smn_sprint_exceptional_meeting_status_history"]}]};
  if(sql.includes("information_schema.columns"))return {rows:columns.map(column_name=>({column_name}))};
  if(sql.includes("SELECT e.id,e.name AS title"))return {rows:[{
   id,title:"Daily Scrum",start_at:futureStart,end_at:futureEnd,
   status:"scheduled",duration:15,team_id:"team-1",sprint_id:sprintId,
   sprint_status:"active",sprint_start:"2099-10-26T00:00:00Z",
   sprint_end:"2099-10-30T23:59:59Z",revision:null,actual_minutes:10
  }]};
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 const result=await updateDashboardEvent(db,"admin","template",id,{
  teamId:"team-1",sprintId,title:"Daily Scrum",startAt:futureStart,
  duration:15,status:"held",actualMinutes:10,expectedActualMinutes:10,
  expectedTitle:"Daily Scrum",expectedStartAt:futureStart,
  expectedEndAt:futureEnd,expectedStatus:"scheduled"
 });
 assert.deepEqual(result,{ok:false,error:"not-yet-due"});
 assert.equal(statements.at(-1),"ROLLBACK");
 assert.ok(!statements.some(sql=>sql.startsWith("UPDATE public.smn_scrum_template_occurrence")));
});

test("les actions Enregistrer et Annuler sont côte à côte pour le formulaire réunion",()=>{
 const source=read("src/app/app/operational-edit.tsx");
 assert.match(source,/className="d-flex justify-content-end align-items-center flex-wrap gap-2"/);
 assert.match(source,/disabled=\{busy\|\|!title\.trim\(\)\|\|!status\}/);
 assert.match(source,/onClick=\{onCancel\}/);
 assert.match(source,/saved=\{saved\} onCancel=\{close\}/);
 assert.match(source,/!\(props\.kind==="event"&&props\.eventKind\)/);
 assert.match(source,/code==="not-yet-due"\?"dashboard\.operational\.edit\.notYetDue"/);
 assert.match(source,/code==="outside-sprint"\?"dashboard\.operational\.edit\.outsideSprint"/);
 assert.match(source,/code==="conflict"\?"dashboard\.operational\.edit\.eventConflict"/);
});

test("les traductions FR/EN des erreurs de réunion sont présentes",()=>{
 const fr=JSON.parse(read("src/i18n/fr.json")).dashboard.operational.edit;
 const en=JSON.parse(read("src/i18n/en.json")).dashboard.operational.edit;
 for(const key of ["notYetDue","outsideSprint","eventConflict"]){
  assert.equal(typeof fr[key],"string");
  assert.equal(typeof en[key],"string");
  assert.ok(fr[key].length>15&&en[key].length>15);
 }
});
