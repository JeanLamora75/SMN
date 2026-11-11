import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {deleteDashboardNote} from "../src/server/dashboard/notes";
import {deleteCalendarMeeting} from "../src/server/sprints/calendar-meeting-delete";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const id="11111111-1111-4111-8111-111111111111";
const sprint="22222222-2222-4222-8222-222222222222";
const team="team-one";

describe("SMN — suppressions individuelles depuis les modales",()=>{
 it("présente les actions dans le bon ordre, en français et en anglais",()=>{
  const section=read("src/app/app/admin/registries/registry-section-dialog.tsx");
  assert.ok(section.indexOf("{deleteAction}")>section.indexOf('form={submitFormId}'));
  assert.ok(section.indexOf("{deleteAction}")<section.lastIndexOf('onClick={close}'));
  const registry=read("src/app/app/admin/registries/registry-edit-modal.tsx");
  assert.match(registry,/<RegistryDeleteAction/);
  const dashboard=read("src/app/app/dashboard-builder/dashboard-record-editor.tsx");
  assert.match(dashboard,/method:"DELETE"/);
  assert.match(dashboard,/deleteAction=\{note\?/);
  const calendar=read("src/app/app/team-calendar/calendar-meeting-modal.tsx");
  assert.match(calendar,/fetch\(scopedApi,\{method:"DELETE"\}\)/);
  for(const locale of ["fr","en"]){
   const labels=JSON.parse(read("src/i18n/"+locale+".json")).dashboardRecordDelete;
   for(const field of ["button","deleting","confirm","failed","closed","conflict","linked"])
    assert.ok(typeof labels[field]==="string"&&labels[field].trim());
  }
 });
 it("ne supprime pas une note d'un sprint clôturé",async()=>{
  const sql:string[]=[];
  const db={query:async(query:string)=>{
   sql.push(query);
   if(query.includes("SELECT n.body,n.status"))return {rows:[{body:"Note",status:"open",sprint_status:"closed"}]};
   return {rows:[],rowCount:0};
  }} as unknown as Client;
  const result=await deleteDashboardNote(db,"admin",id,
   {teamId:team,sprintId:sprint,expectedBody:"Note",expectedStatus:"open"});
  assert.deepEqual(result,{ok:false,error:"closed-period"});
  assert.ok(sql.some(x=>x==="ROLLBACK"));
  assert.ok(!sql.some(x=>x.includes("DELETE FROM public.smn_dashboard_note ")));
 });
 it("refuse la suppression d'une note modifiée depuis son affichage",async()=>{
  const sql:string[]=[];
  const db={query:async(query:string)=>{
   sql.push(query);
   if(query.includes("SELECT n.body,n.status"))return {rows:[{body:"Nouvelle note",status:"open",sprint_status:"active"}]};
   return {rows:[],rowCount:0};
  }} as unknown as Client;
  const result=await deleteDashboardNote(db,"admin",id,
   {teamId:team,sprintId:sprint,expectedBody:"Ancienne note",expectedStatus:"open"});
  assert.deepEqual(result,{ok:false,error:"conflict"});
  assert.ok(!sql.some(x=>x.includes("DELETE FROM public.smn_dashboard_note ")));
 });
 it("cible une seule cérémonie et bloque la suppression en sprint clôturé",async()=>{
  const sql:string[]=[];
  const db={query:async(query:string)=>{
   sql.push(query);
   if(query.includes("SELECT m.id,m.sprint_id"))return {rows:[{id,sprint_id:sprint,sprint_status:"closed"}]};
   return {rows:[],rowCount:0};
  }} as unknown as Client;
  const result=await deleteCalendarMeeting(db,team,"ceremony",id);
  assert.deepEqual(result,{ok:false,error:"closed-period"});
  assert.ok(!sql.some(x=>x.includes("DELETE FROM public.smn_sprint_ceremony WHERE")));
 });
 it("ne supprime jamais toutes les occurrences d'un même type",()=>{
  const server=read("src/server/sprints/calendar-meeting-delete.ts");
  assert.match(server,/WHERE id=\$1 AND sprint_id=\$2 RETURNING id/);
  assert.doesNotMatch(server,/kind=ANY/);
  assert.match(server,/await db.query\("ROLLBACK"\)/);
  assert.match(server,/smn_calendar_meeting_outcome_link/);
  assert.match(server,/smn_calendar_meeting_schedule_history/);
 });
});
