import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {
 createMeetingOutcome,parseMeetingOutcome,meetingOutcomeDate,readMeetingOutcomes
} from "../src/server/sprints/calendar-meeting-outcomes";

const id="123e4567-e89b-42d3-a456-426614174000";
const sprintId="123e4567-e89b-42d3-a456-426614174001";
const teamId="team-1";
const source=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const found={id,kind:"ceremony",name:"Sprint 1 — planning",sprint_id:sprintId,
 sprint_name:"Sprint 1",sprint_status:"active",time_zone:"Europe/Paris",
 start_at:"2026-10-12T07:00:00.000Z",end_at:"2026-10-12T12:00:00.000Z",
 status:"held",status_explicit:true,generation_source:"standard",
 planned_minutes:300,actual_minutes:240,revision:1,ceremony_kind:"planning"};
function fixture(sprintStatus="active",present=true){
 const calls:Array<{sql:string;args?:unknown[]}>= [];
 const db={query:async(sql:string,args?:unknown[])=>{
  calls.push({sql,args});
  if(sql.includes("relname AS name FROM pg_class"))return {rows:["smn_registry_item","smn_registry_item_audit","smn_calendar_meeting_outcome_link"].map(name=>({name}))};
  if(sql.includes("information_schema.columns"))return {rows:[
   "id","sprint_id","kind","starts_at","ends_at","occurrence_status",
   "revision","minutes","actual_minutes","generation_source","status_explicit"
  ].map(column_name=>({column_name}))};
  if(sql.includes("FROM public.smn_sprint_ceremony c"))return {rows:[found]};
  if(sql.includes("FOR UPDATE OF s"))return {rows:[{status:sprintStatus,team_id:teamId}]};
  if(sql.includes("to_regclass"))return {rows:[{present}]};
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 return {db,calls};
}
test("texte de compte rendu et catégorie stricts : pas d'injection ou fiche vide",()=>{
 assert.deepEqual(parseMeetingOutcome({type:"decision",text:"  Trancher sur MVP  "}),
  {type:"decision",text:"Trancher sur MVP"});
 for(const type of ["action","highlight"] as const)
  assert.equal(parseMeetingOutcome({type,text:"Compte rendu"} )?.type,type);
 for(const raw of [
  {type:"risk",text:"Risque"}, {type:"decision",text:" "},
  {type:"action",text:"x".repeat(2001)},
  {type:"highlight",text:"texte",teamId:"other"},
  {type:"action",text:"\u0000"}
 ])assert.equal(parseMeetingOutcome(raw),null);
 assert.equal(meetingOutcomeDate(found.start_at,found.time_zone),"2026-10-12");
});
test("l'action créée pour une réunion est une vraie fiche registre, liée et auditée dans une transaction",async()=>{
 const f=fixture();
 const result=await createMeetingOutcome(f.db,"admin","ceremony",id,{
  type:"action",text:"Faire la démonstration\nPréparer les captures"
 });
 assert.equal(result.ok,true);
 assert.ok(f.calls.some(c=>c.sql.includes("INSERT INTO public.smn_registry_item\n")));
 assert.ok(f.calls.some(c=>c.sql.includes("INSERT INTO public.smn_registry_item_audit")));
 const relation=f.calls.find(c=>c.sql.includes("INSERT INTO public.smn_calendar_meeting_outcome_link"));
 assert.ok(relation);
 assert.equal(relation?.args?.[1],sprintId);
 assert.equal(relation?.args?.[2],teamId);
 assert.equal(relation?.args?.[3],"ceremony");
 assert.equal(relation?.args?.[4],id);
 assert.equal(f.calls.filter(c=>c.sql==="BEGIN").length,1);
 assert.equal(f.calls.filter(c=>c.sql==="COMMIT").length,1);
 assert.ok(f.calls.some(c=>c.args?.includes("todo")));
});
test("clôture : refus sans création de table, lien ou commentaire",async()=>{
 const f=fixture("closed");
 const r=await createMeetingOutcome(f.db,"admin","ceremony",id,{
  type:"highlight",text:"Fait marquant"
 });
 assert.deepEqual(r,{ok:false,error:"closed-period"});
 assert.ok(f.calls.some(c=>c.sql==="ROLLBACK"));
 assert.ok(f.calls.every(c=>!c.sql.includes("CREATE TABLE")));
 assert.ok(f.calls.every(c=>!c.sql.includes("INSERT INTO")));
});
test("type de réunion et identifiants invalides refusés sans accès SQL",async()=>{
 const f=fixture();
 assert.deepEqual(await createMeetingOutcome(f.db,"admin","absences",id,{
  type:"decision",text:"Décision"
 }),{ok:false,error:"invalid-input"});
 assert.deepEqual(await createMeetingOutcome(f.db,"admin","ceremony","../wrong",{
  type:"decision",text:"Décision"
 }),{ok:false,error:"invalid-input"});
 assert.equal(f.calls.length,0);
});
test("lecture d'une réunion sans table des comptes rendus : retour vide et aucune écriture",async()=>{
 const f=fixture("active",false);
 const r=await readMeetingOutcomes(f.db,"ceremony",id);
 assert.deepEqual(r,[]);
 assert.ok(f.calls.every(c=>!c.sql.match(/\b(INSERT|UPDATE|CREATE|ALTER|DELETE)\b/u)));
});
test("la modale compacte regroupe horaires, durée, statut et sauvegardes accessibles",()=>{
 const modal=source("src/app/app/team-calendar/calendar-meeting-modal.tsx");
 const css=source("src/app/globals.css");
 const icon=source("src/app/app/bootstrap-icon.tsx");
 assert.match(modal,/smn-cal-identity-grid/);
 assert.match(modal,/smn-cal-inline-fields/g);
 assert.match(modal,/smn-cal-outcome-form/);
 assert.match(modal,/BootstrapIcon name="floppy"/);
 assert.match(modal,/aria-label=\{name\} title=\{name\}/);
 assert.doesNotMatch(modal,/>\{t\("calendarMeeting.saveSchedule"\)\}/);
 assert.match(modal,/outcomeType/);
 assert.match(modal,/outcomeText/);
 assert.match(modal,/onSaved\(\)/);
 assert.match(modal,/outcomeApi/);
 assert.match(css,/\.smn-cal-detail-compact/);
 assert.match(icon,/case "floppy"/);
 for(const lang of ["fr","en"]){
  const json=JSON.parse(source("src/i18n/"+lang+".json"));
  for(const key of ["outcomes","outcomeType","outcomeText","outcomeSave",
   "outcomeDecision","outcomeAction","outcomeHighlight","outcomeSaved"]){
   assert.equal(typeof json.calendarMeeting[key],"string",lang+" "+key);
  }
 }
});
test("route et diagnostic : contrôle RBAC et table de liaison explicitement autorisée",()=>{
 const api=source("src/app/api/team-calendar/meetings/[kind]/[id]/outcomes/route.ts");
 const contract=source("src/server/installation/contract.ts");
 assert.match(api,/authorizeApi\(request,"read",\{type:"collective"/);
 assert.match(api,/authorizeApi\(request,"write",\{type:"settings"/);
 assert.match(api,/createMeetingOutcome/);
 assert.match(contract,/public\.smn_calendar_meeting_outcome_link:r/);
});
