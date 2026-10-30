import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import type {Client} from "pg";
import OperationalOverview from "../src/app/app/operational-overview";
import {readDashboardNote,updateDashboardNote} from "../src/server/dashboard/notes";
import {readDashboardEvent,updateDashboardEvent} from "../src/server/dashboard/event-edit";
import {collectionAvailable,collectionUnavailable,metricNotRecorded,
 type CollectiveCycleProjection,type DashboardAttention,type DashboardEvent}
 from "../src/lib/dashboard-data-contract";
import {dashboardLocalValue,dashboardLocalToIso} from "../src/lib/dashboard-local-datetime";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const u=(n:number)=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const absent=collectionUnavailable("producer-not-ready");
const list=<T,>(items:readonly T[])=>collectionAvailable(items,items.length,{source:"manual"});
function projection():CollectiveCycleProjection{
 const metric=metricNotRecorded();
 const attention:DashboardAttention[]=[
  {id:u(1),title:"Blocage",description:"Indisponibilité du banc",kind:"obstacle",
   status:"in_progress",href:"/app/admin/registries/"+u(1)},
  {id:u(2),title:"Risque externe",kind:"risk",status:"open",priority:"high",
   href:"/app/admin/registries/"+u(2)}
 ];
 const notes:DashboardAttention[]=[
  {id:u(3),title:"Une note saisie",kind:"note",status:"open"},
  {id:"configuration:reference-country",title:"reference-country",
   kind:"alert",status:"todo",configurationKey:"reference-country"}
 ];
 const events:DashboardEvent[]=[{id:u(4),kind:"template",title:"Daily Scrum",
  startsAt:"2026-10-23T07:00:00.000Z",endsAt:"2026-10-23T07:15:00.000Z",
  status:"scheduled",generationSource:null}];
 return {teamId:"team-1",cycleId:u(5),cycleStatus:"active",snapshotVersion:null,
  goals:absent,capacity:{initialJh:metric,actualJh:metric},
  storyPoints:{initial:metric,done:metric},tickets:{initial:metric,done:metric},
  scores:{confidence:metric,clarity:metric},
  workingDaysRemaining:metric,events:list(events),obstacles:list([attention[0]]),
  risks:list([attention[1]]),notesAndAlerts:list(notes)};
}
test("les titres des quatre familles sont des boutons accessibles, sans quitter le tableau de bord",()=>{
 const html=renderToStaticMarkup(createElement(OperationalOverview,{
  locale:"fr",projection:projection(),timeZone:"Europe/Paris",canManage:true
 }));
 assert.equal((html.match(/aria-haspopup="dialog"/g)??[]).length,5);
 assert.match(html,/Blocage/);
 assert.match(html,/Une note saisie/);
 assert.match(html,/Définir le pays de référence/);
 assert.match(html,/bi-arrow-right/);
 assert.match(html,/meeting\/template\//);
 assert.match(html,/registries\/00000000-0000-4000-8000-000000000001/);
 assert.equal((html.match(/class="smn-operational-create-link"/g)??[]).length,4);
 assert.doesNotMatch(html,/<dialog\b/);
});
test("le tableau de bord n'a plus de bloc configuration dupliqué",()=>{
 const page=read("src/app/app/page.tsx");
 assert.doesNotMatch(page,/ConfigurationChecklist|readConfigurationChecklist|\{configuration&&/);
 assert.match(page,/<OperationalOverview/);
});
test("les formulaires utilisent les services réels et actualisent l'écran après succès",()=>{
 const editor=read("src/app/app/operational-edit.tsx");
 assert.match(editor,/RegistryCreate/);
 assert.match(editor,/onSaved=\{saved\}/);
 assert.match(editor,/router\.refresh\(\)/);
 assert.match(editor,/\/api\/admin\/dashboard\/notes\//);
 assert.match(editor,/\/api\/admin\/dashboard\/events\//);
 assert.match(editor,/\/api\/admin\/configuration-tasks/);
 assert.match(editor,/createPortal\(<dialog/);
 assert.match(editor,/disabled=\{readonly\|\|busy\}/);
 const registry=read("src/app/app/admin/registries/registry-create.tsx");
 assert.match(registry,/onSaved\?\.\(\)/);
 const eventApi=read("src/app/api/admin/dashboard/events/[kind]/[id]/route.ts");
 assert.match(eventApi,/authorizeApi\(req,"write"/);
 const noteApi=read("src/app/api/admin/dashboard/notes/[id]/route.ts");
 assert.match(noteApi,/authorizeApi\(req,"write"/);
});
test("date locale : valeurs Paris, heure inexistante au changement DST refusée",()=>{
 assert.equal(dashboardLocalValue("2026-10-23T07:00:00Z","Europe/Paris"),"2026-10-23T09:00");
 assert.equal(dashboardLocalToIso("2026-10-23T09:00","Europe/Paris"),"2026-10-23T07:00:00.000Z");
 assert.equal(dashboardLocalToIso("2026-03-29T02:30","Europe/Paris"),null);
 assert.equal(dashboardLocalToIso("2026-10-25T02:30","Europe/Paris"),null);
});
test("lecture des notes bornée à l'équipe et au sprint, sans mutation",async()=>{
 const sql:string[]=[];
 const db={query:async(query:string,args:unknown[])=>{
  sql.push(query);
  assert.deepEqual(args,[u(1),"team-1",u(5)]);
  return {rows:[{id:u(1),body:"Persisté",status:"open"}]};
 }} as unknown as Client;
 const note=await readDashboardNote(db,u(1),"team-1",u(5));
 assert.equal(note?.body,"Persisté");
 assert.match(sql[0],/n\.sprint_id=\$3/);
 assert.match(sql[0],/n\.team_id=\$2/);
});
test("la modification des notes refuse les données invalides avant le premier SQL",async()=>{
 let called=false;
 const db={query:async()=>{called=true;return {rows:[]};}} as unknown as Client;
 const result=await updateDashboardNote(db,"admin",u(1),{text:"",teamId:"team-1"});
 assert.deepEqual(result,{ok:false,error:"invalid-input"});
 assert.equal(called,false);
});
test("événement GET pure lecture, isolé par équipe/sprint",async()=>{
 const sql:string[]=[];
 const db={query:async(query:string)=>{
  sql.push(query);
  if(query.includes("information_schema.columns"))return {rows:[
   "id","sprint_id","starts_at","ends_at","name","status"
  ].map(column_name=>({column_name}))};
  return {rows:[{id:u(4),title:"Daily Scrum",start_at:"2026-10-23T07:00:00Z",
   end_at:"2026-10-23T07:15:00Z",status:"scheduled",duration:15,
   team_id:"team-1",sprint_id:u(5),sprint_status:"active",
   sprint_start:"2026-10-19T07:00:00Z",sprint_end:"2026-10-30T18:00:00Z",
   revision:null}]};
 }} as unknown as Client;
 assert.equal((await readDashboardEvent(db,"template",u(4),"wrong-team",u(5))),null);
 const event=await readDashboardEvent(db,"template",u(4),"team-1",u(5));
 assert.equal(event?.title,"Daily Scrum");
 assert.equal(event?.editable,true);
 assert.ok(sql.every(query=>!/\b(?:UPDATE|INSERT|CREATE|ALTER|DELETE)\b/i.test(query)));
});
test("édition événement invalide : aucun write ni génération",async()=>{
 let used=false;
 const db={query:async()=>{used=true;return {rows:[]};}} as unknown as Client;
 const result=await updateDashboardEvent(db,"admin","template",u(4),{title:"Test"});
 assert.equal(result.ok,false);
 assert.equal(used,false);
});
test("contrat d'installation : nouveaux audits autorisés",()=>{
 const file=read("src/server/installation/contract.ts");
 for(const table of ["smn_dashboard_note_edit_audit","smn_dashboard_event_edit_audit"]){
  assert.ok(file.includes("public."+table+":r"));
 }
});


test("les sous-formulaires risques propagent un succès sans modifier les autres écrans",()=>{
 const registry=read("src/app/app/admin/registries/registry-create.tsx");
 for(const name of ["RiskRoam","RiskAssessment","RegistryCycles","RegistryRelations"]){
  assert.ok(registry.includes("<"+name));
  const dash=read("src/app/app/admin/registries/"+
   (name==="RiskRoam"?"risk-roam":name==="RiskAssessment"?"risk-assessment":
    name==="RegistryCycles"?"registry-cycles":"registry-relations")+".tsx");
  assert.match(dash,/onSaved\?\.\(\)/);
 }
});
test("une modification de note valide est enregistrée et auditée en transaction",async()=>{
 const statements:string[]=[];
 const db={query:async(sql:string)=>{
  statements.push(sql);
  if(sql.includes("to_regclass"))return {rows:[{ready:true}]};
  if(sql.includes("SELECT n.id,n.body,n.status,s.status"))return {rows:[{
   id:u(3),body:"Avant",status:"open",sprint_status:"active"}]};
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 const result=await updateDashboardNote(db,"admin",u(3),{
  teamId:"team-1",sprintId:u(5),text:"Après",status:"done",
  expectedBody:"Avant",expectedStatus:"open"
 });
 assert.equal(result.ok,true);
 assert.equal(statements[0],"BEGIN");
 assert.equal(statements.at(-1),"COMMIT");
 assert.ok(statements.some(x=>x.includes("smn_dashboard_note_edit_audit")));
 assert.ok(statements.some(x=>x.includes("UPDATE public.smn_dashboard_note")));
});
