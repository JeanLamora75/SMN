import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import {createElement} from "react";
import type {Client} from "pg";
import SprintCeremoniesPanel from "../src/app/app/admin/sprints/[sprintId]/sprint-ceremonies-panel";
import {readDashboardEvent,updateDashboardEvent} from "../src/server/dashboard/event-edit";
import {formatDashboardEventPeriod} from "../src/lib/dashboard-card-format";
import type {SprintCeremony} from "../src/lib/sprint-ceremony-detail";
import {translate,type TranslationKey} from "../src/i18n/catalog";

const uuid="123e4567-e89b-42d3-a456-426614174001",sprintId="123e4567-e89b-42d3-a456-426614174002";
const text=(key:TranslationKey,args?:Readonly<Record<string,string|number>>)=>translate("fr",key,args);
const item=(source:SprintCeremony["source"],kind:string|null,title:string):SprintCeremony=>({
 id:uuid,source,kind,title,
 startsAt:"2026-10-26T08:30:00.000Z",endsAt:"2026-10-26T10:30:00.000Z",
 plannedMinutes:120,actualMinutes:null,status:"scheduled",
 statusEvidence:"confirmed",reconstructed:false
});
const data=(items:readonly SprintCeremony[],source:"recorded-events"|"closure-snapshot"="recorded-events")=>({
 state:"available" as const,source,items,total:items.length,page:1,pageCount:1,
 pageSize:25,snapshotVersion:source==="closure-snapshot"?2:null,missingSources:[]
});
const render=(items:readonly SprintCeremony[],canManage=true,source:"recorded-events"|"closure-snapshot"="recorded-events")=>
 renderToStaticMarkup(createElement(SprintCeremoniesPanel,{
  sprintId,teamId:"team-1",timeZone:"Europe/Paris",locale:"fr",canManage,
  data:data(items,source),t:text
 }));

describe("SMN-234 — densification de l'onglet Cérémonies",()=>{
 it("date localisée sur un même jour sans répétition (et deux dates si nécessaire)",()=>{
  assert.equal(formatDashboardEventPeriod("2026-10-26T08:30:00Z","2026-10-26T10:30:00Z","fr","Europe/Paris"),
   "Lun. 26 oct. : 09:30 — 11:30");
  assert.match(formatDashboardEventPeriod("2026-10-26T22:30:00Z","2026-10-27T00:30:00Z","fr","Europe/Paris"),/Mar\. 27 oct/);
  assert.match(formatDashboardEventPeriod("2026-10-26T08:30:00Z","2026-10-26T10:30:00Z","en","Europe/Paris"),/Mon 26 Oct : 09:30 — 11:30/);
 });
 it("une ligne compacte groupe titre, date, durées, badge et pictogramme associé",()=>{
  const html=render([item("custom",null,"Sprint Planning"),item("standard","daily","daily"),
   item("standard","review","review"),item("standard","retrospective","retrospective")]);
  assert.equal((html.match(/smn-sprint-ceremony-row smn-sprint-ceremony-/g)??[]).length,4);
  assert.match(html,/Lun\. 26 oct\. : 09:30 — 11:30/);
  for(const icon of ["calendar-check","people-fill","bar-chart-line","chat-dots"])
   assert.match(html,new RegExp("bi-"+icon));
  assert.match(html,/smn-sprint-ceremony-icon/);
  assert.match(html,/120 min/);
  assert.match(html,/Non renseignée/);
  assert.match(html,/aria-haspopup="dialog"/);
  assert.doesNotMatch(html,/>Voir la réunion</);
 });
 it("le crayon n'apparaît pas sans droits et les snapshots restent immuables",()=>{
  assert.doesNotMatch(render([item("custom",null,"Sprint Planning")],false),/aria-haspopup="dialog"/);
  assert.doesNotMatch(render([item("custom",null,"Sprint Planning")],true,"closure-snapshot"),/aria-haspopup="dialog"/);
  assert.match(render([item("custom",null,"Sprint Planning")],false),/bi-calendar-check/);
 });
 it("les trois sources pointent sur les mêmes routes d'édition que le dashboard",()=>{
  const html=render([item("standard","planning","planning"),
   item("custom",null,"Sprint Review"),item("exceptional",null,"Atelier")]);
  assert.equal((html.match(/aria-haspopup="dialog"/g)??[]).length,3);
  assert.match(html,/bi-pencil-square/);
 });
 it("l'édition récupère la durée réelle persistée sans mutation de lecture",async()=>{
  const queries:string[]=[];
  const db={query:async(q:string)=>{
   queries.push(q);
   if(q.includes("information_schema.columns"))return {rows:[
    "id","sprint_id","name","starts_at","ends_at","status","actual_minutes"
   ].map(column_name=>({column_name}))};
   return {rows:[{id:uuid,title:"Sprint Planning",
    start_at:"2026-10-26T08:30:00.000Z",end_at:"2026-10-26T10:30:00.000Z",
    status:"scheduled",duration:120,actual_minutes:125,team_id:"team-1",
    sprint_id:sprintId,sprint_status:"active",sprint_start:"2026-10-26T08:00:00.000Z",
    sprint_end:"2026-11-08T23:00:00.000Z",revision:null}]};
  }} as unknown as Client;
  const result=await readDashboardEvent(db,"template",uuid,"team-1",sprintId);
  assert.equal(result?.actualMinutes,125);
  assert.ok(queries.some(q=>q.includes("actual_minutes")));
  assert.ok(queries.every(q=>!/\b(?:INSERT|CREATE|ALTER|DELETE|UPDATE)\b/i.test(q)));
 });

 it("une durée réelle modifiée est enregistrée avec audit dans la même transaction",async()=>{
  const statements:string[]=[];
  const db={query:async(sql:string)=>{
   statements.push(sql);
   if(sql.includes("array_agg(relname)")||sql.includes("array_agg(c.relname)"))return {rows:[{present:["smn_meeting_actual_duration_audit","smn_sprint_ceremony_status_history","smn_scrum_template_occurrence_status_history","smn_sprint_exceptional_meeting_status_history","smn_sprint_ceremony_history","smn_scrum_template_occurrence","smn_sprint_exceptional_meeting","smn_sprint_exceptional_meeting_history","smn_scrum_ceremony_template","smn_scrum_ceremony_template_history"]}]};
   if(sql.includes("to_regclass"))return {rows:[{ready:true}]};
   if(sql.includes("information_schema.columns"))return {rows:[
    "id","sprint_id","name","starts_at","ends_at","status","actual_minutes"
   ].map(column_name=>({column_name}))};
   if(sql.includes("SELECT e.id"))return {rows:[{
    id:uuid,title:"Sprint Planning",
    start_at:"2026-10-26T08:30:00.000Z",end_at:"2026-10-26T10:30:00.000Z",
    status:"scheduled",duration:120,actual_minutes:110,team_id:"team-1",
    sprint_id:sprintId,sprint_status:"active",
    sprint_start:"2026-10-26T08:00:00.000Z",
    sprint_end:"2026-11-08T23:00:00.000Z",revision:null
   }]};
   return {rows:[]};
  }} as unknown as Client;
  const payload={
   teamId:"team-1",sprintId,title:"Sprint Planning",
   startAt:"2026-10-26T08:30:00.000Z",duration:120,status:"scheduled",
   actualMinutes:125,expectedActualMinutes:110,
   expectedTitle:"Sprint Planning",expectedStartAt:"2026-10-26T08:30:00.000Z",
   expectedEndAt:"2026-10-26T10:30:00.000Z",expectedStatus:"scheduled"
  };
  const result=await updateDashboardEvent(db,"admin","template",uuid,payload);
  assert.equal(result.ok,true);
  assert.equal(statements.at(-1),"COMMIT");
  assert.equal(statements.filter(q=>q==="BEGIN").length,1);
  assert.match(statements.join("\n"),/UPDATE public\.smn_scrum_template_occurrence SET/);
  assert.match(statements.join("\n"),/INSERT INTO public\.smn_meeting_actual_duration_audit/);
  assert.match(statements.join("\n"),/INSERT INTO public\.smn_dashboard_event_edit_audit/);
 });
 it("une durée réelle modifiée ailleurs déclenche un conflit et ne modifie pas l'événement",async()=>{
  const statements:string[]=[];
  const db={query:async(sql:string)=>{
   statements.push(sql);
   if(sql.includes("array_agg(relname)")||sql.includes("array_agg(c.relname)"))return {rows:[{present:["smn_meeting_actual_duration_audit","smn_sprint_ceremony_status_history","smn_scrum_template_occurrence_status_history","smn_sprint_exceptional_meeting_status_history","smn_sprint_ceremony_history","smn_scrum_template_occurrence","smn_sprint_exceptional_meeting","smn_sprint_exceptional_meeting_history","smn_scrum_ceremony_template","smn_scrum_ceremony_template_history"]}]};
   if(sql.includes("information_schema.columns"))return {rows:[
    "id","sprint_id","name","starts_at","ends_at","status","actual_minutes"
   ].map(column_name=>({column_name}))};
   if(sql.includes("SELECT e.id"))return {rows:[{
    id:uuid,title:"Sprint Planning",
    start_at:"2026-10-26T08:30:00.000Z",end_at:"2026-10-26T10:30:00.000Z",
    status:"scheduled",duration:120,actual_minutes:130,team_id:"team-1",
    sprint_id:sprintId,sprint_status:"active",
    sprint_start:"2026-10-26T08:00:00.000Z",
    sprint_end:"2026-11-08T23:00:00.000Z",revision:null
   }]};
   return {rows:[]};
  }} as unknown as Client;
  const result=await updateDashboardEvent(db,"admin","template",uuid,{
   teamId:"team-1",sprintId,title:"Sprint Planning",
   startAt:"2026-10-26T08:30:00.000Z",duration:120,status:"scheduled",
   actualMinutes:125,expectedActualMinutes:110,
   expectedTitle:"Sprint Planning",expectedStartAt:"2026-10-26T08:30:00.000Z",
   expectedEndAt:"2026-10-26T10:30:00.000Z",expectedStatus:"scheduled"
  });
  assert.deepEqual(result,{ok:false,error:"conflict"});
  assert.ok(statements.includes("ROLLBACK"));
  assert.doesNotMatch(statements.join("\n"),/UPDATE public\.smn_scrum_template_occurrence SET/);
 });
 it("le formulaire de la modale conserve la sauvegarde unique et son rafraîchissement",()=>{
  const src=readFileSync(new URL("../src/app/app/operational-edit.tsx",import.meta.url),"utf8");
  assert.match(src,/actualMinutes/);
  assert.match(src,/expectedActualMinutes/);
  assert.match(src,/router\.refresh\(\)/);
  assert.match(src,/actionIcon/);
 });
});
