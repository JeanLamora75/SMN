import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import type {Client} from "pg";
import {readCurrentSprintEvents,eventsFromClosureSnapshot,classifyEventStatus}
 from "../src/server/dashboard/events-reader";
import OperationalOverview from "../src/app/app/operational-overview";
import type {CollectiveCycleProjection,DashboardEvent} from "../src/lib/dashboard-data-contract";

const now=new Date("2026-10-23T12:00:00.000Z"),sprintId="sprint-1";
function fake(handler:(sql:string,params?:unknown[])=>{rows:unknown[]}){
 const statements:{sql:string;params?:unknown[]}[]=[];
 const db={query:async(sql:string,params?:unknown[])=>{
  statements.push({sql,params});
  assert.doesNotMatch(sql,/\b(?:CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|TRUNCATE)\b/i);
  return handler(sql,params);
 }} as unknown as Client;
 return {db,statements};
}
const row=(id:string,kind:"template"|"ceremony"|"exceptional",hour:number)=>{
 const start=new Date(Date.UTC(2026,9,23,hour));
 return {id,kind,title:kind+" "+id,starts_at:start.toISOString(),
  ends_at:new Date(start.getTime()+3600000).toISOString(),
  status:"scheduled",generation_source:"standard"};
};
const projection=(events:CollectiveCycleProjection["events"]):CollectiveCycleProjection=>{
 const missing={state:"unavailable",reason:"producer-not-ready"} as const;
 return {
  teamId:"team-1",cycleId:sprintId,cycleStatus:"active",snapshotVersion:null,
  goals:missing,capacity:{initialJh:missing,actualJh:missing},
  storyPoints:{initial:missing,done:missing},tickets:{initial:missing,done:missing},
  scores:{confidence:missing,clarity:missing},
  workingDaysRemaining:missing,events,
  obstacles:missing,risks:missing,notesAndAlerts:missing
 };
};

describe("SMN-237 — colonne événements du Sprint",()=>{
 it("restitue les prochaines réunions en priorité, avec un compteur exact et max cinq",async()=>{
  const fixture=[row("a","template",14),row("b","exceptional",15),row("c","ceremony",16),
   row("d","template",17),row("e","template",18)];
  const fixtureDb=fake((sql,params)=>{
   if(sql.includes("information_schema.tables"))return {rows:[
    {table_name:"smn_sprint_ceremony"},
    {table_name:"smn_scrum_template_occurrence"},
    {table_name:"smn_sprint_exceptional_meeting"}
   ]};
   if(sql.includes("count(*)::text"))return {rows:[{total:"7"}]};
   if(sql.includes("ORDER BY"))return {rows:fixture};
   throw Error("SQL unexpected "+sql);
  });
  const result=await readCurrentSprintEvents(fixtureDb.db,sprintId,now,false);
  assert.equal(result.state,"available");
  if(result.state==="available"){
   assert.equal(result.total,7);
   assert.equal(result.items.length,5);
   assert.deepEqual(result.items.map(x=>x.kind),["template","exceptional","ceremony","template","template"]);
  }
  const ordered=fixtureDb.statements.find(x=>x.sql.includes("ORDER BY"));
  assert.match(ordered!.sql,/LIMIT 5/);
  assert.match(ordered!.sql,/CASE WHEN starts_at >= \$2::timestamptz/);
  assert.equal(ordered!.params?.[0],sprintId);
  assert.ok(fixtureDb.statements.every(x=>!x.sql.includes("JOIN public.smn_account")));
 });
 it("sur un Sprint terminé, place les réunions récentes en premier",async()=>{
  const f=fake(sql=>sql.includes("information_schema.tables")?
   {rows:[{table_name:"smn_scrum_template_occurrence"}]}:
   sql.includes("count(*)::text")?{rows:[{total:"0"}]}:{rows:[]});
  const result=await readCurrentSprintEvents(f.db,sprintId,now,true);
  assert.equal(result.state,"available");
  if(result.state==="available")assert.equal(result.total,0);
  assert.match(f.statements.find(x=>x.sql.includes("ORDER BY"))!.sql,
   /ORDER BY starts_at DESC,id ASC LIMIT 5/);
 });
 it("une installation sans aucun producteur ne doit pas produire un zéro fictif",async()=>{
  const f=fake(()=>({rows:[]}));
  const result=await readCurrentSprintEvents(f.db,sprintId,now);
  assert.deepEqual(result,{state:"unavailable",reason:"schema-missing"});
  assert.equal(f.statements.length,1);
 });
 it("permet une source de réunions exceptionnelles seule sans créer d'autres tables",async()=>{
  const f=fake(sql=>sql.includes("information_schema.tables")?
   {rows:[{table_name:"smn_sprint_exceptional_meeting"}]}:
   sql.includes("count(*)::text")?{rows:[{total:"1"}]}:
   {rows:[row("meeting","exceptional",14)]});
  const result=await readCurrentSprintEvents(f.db,sprintId,now);
  assert.equal(result.state,"available");
  if(result.state==="available")assert.equal(result.items[0].kind,"exceptional");
  assert.ok(f.statements.slice(1).every(x=>!x.sql.includes("smn_sprint_ceremony ")));
 });
 it("lit uniquement les tableaux V2 enregistrés à la clôture",()=>{
  const data={
   ceremonies:[{id:"old",kind:"planning",starts_at:"2026-10-19T08:00:00Z",
    ends_at:"2026-10-19T09:00:00Z",status:"unknown"}],
   customMeetings:[{id:"new",name:"Rétro V2",starts_at:"2026-10-23T13:00:00Z",
    ends_at:"2026-10-23T14:00:00Z",status:"scheduled",
    generation_source:"reconstructed"}],
   exceptionalMeetings:[{id:"extra",name:"Atelier",starts_at:"2026-10-23T11:00:00Z",
    ends_at:"2026-10-23T12:00:00Z",status:"cancelled"}]
  };
  const result=eventsFromClosureSnapshot(data,2,now);
  assert.equal(result.state,"available");
  if(result.state==="available"){
   assert.equal(result.total,3);
   assert.equal(result.snapshotVersion,2);
   assert.equal(result.source,"closure-snapshot");
   assert.equal(result.items[0].title,"Rétro V2");
   assert.equal(result.items[0].generationSource,"reconstructed");
   assert.equal(result.items[0].status,"scheduled");
   assert.equal(result.items[2].status,"unknown");
  }
  assert.deepEqual(eventsFromClosureSnapshot({customMeetings:[]},2,now),
   {state:"unavailable",reason:"history-missing"});
 });
 it("ne confond jamais reconstituée et tenue",()=>{
  assert.equal(classifyEventStatus("scheduled"),"scheduled");
  assert.equal(classifyEventStatus("held"),"held");
  assert.equal(classifyEventStatus("cancelled"),"cancelled");
  assert.equal(classifyEventStatus("status-not-known"),"unknown");
 });
 it("affiche cinq événements, compte sept et conserve le contexte dans les liens FR/EN",()=>{
  const events:DashboardEvent[]=Array.from({length:5},(_,i)=>({
   id:"event-"+i,title:i===0?"Sprint Review":"Daily "+i,
   kind:"template",startsAt:"2026-10-23T14:00:00Z",
   endsAt:"2026-10-23T15:00:00Z",status:i===1?"cancelled":"scheduled",
   generationSource:i===0?"reconstructed":"standard"
  }));
  const collection={state:"available" as const,items:events,total:7,
   source:"manual" as const,snapshotVersion:null};
  const fr=renderToStaticMarkup(createElement(OperationalOverview,{
   locale:"fr",projection:projection(collection),timeZone:"Europe/Paris"
  }));
  assert.match(fr,/Sprint Review/);
  assert.match(fr,/Reconstituée \(non attestée\)/);
  assert.match(fr,/Annulée/);
  assert.match(fr,/teamId=team-1(?:&amp;|&)cycleId=sprint-1/);
  assert.match(fr,/meeting\/template\/event-0/);
  assert.match(fr,/\b7\b/);
  assert.equal((fr.match(/class="smn-dashboard-event"/g)||[]).length,5);
  const en=renderToStaticMarkup(createElement(OperationalOverview,{
   locale:"en",projection:projection(collection),timeZone:"Europe/Paris"
  }));
  assert.match(en,/Reconstructed \(not verified\)/);
  assert.match(en,/>View all<\/a>/);
  assert.match(en,/Cancelled/);
 });
 it("un producteur indisponible n'annonce ni zéro ni liste fiable vide",()=>{
  const html=renderToStaticMarkup(createElement(OperationalOverview,{
   locale:"fr",projection:projection({state:"unavailable",reason:"read-failed"}),
   timeZone:"Europe/Paris"
  }));
  assert.match(html,/Indisponible/);
  assert.match(html,/Nombre d'éléments indisponible|Événements/);
  assert.doesNotMatch(html,/<span class="smn-operational-count"[^>]*>0<\/span>/);
 });
 it("le lecteur est raccordé à la transaction et n'exécute aucune génération",()=>{
  const file=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
  const cycle=file("src/server/dashboard/cycle-reader.ts");
  const page=file("src/app/app/page.tsx");
  const meeting=file("src/app/app/team-calendar/meeting/[kind]/[id]/page.tsx");
  assert.match(cycle,/readCurrentSprintEvents\(db,sprint\.id/);
  assert.match(cycle,/eventsFromClosureSnapshot\(row\.snapshot,version\)/);
  assert.match(page,/<OperationalOverview locale=\{locale\} projection=\{projection\} timeZone=\{cycle\?\.timeZone\} canManage=\{account\.role==="admin"\}\/>/);
  assert.match(meeting,/dashboardHref=requested\.teamId===row\.team_id/);
 });
});
