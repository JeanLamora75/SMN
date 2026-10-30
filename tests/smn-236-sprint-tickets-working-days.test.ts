import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {sprintWorkingDaysRemaining} from "../src/lib/sprint-working-days";
import {readSprintTickets,writeSprintTickets} from "../src/server/sprints/ticket-counts";
import {closedSnapshotProjection,readCycleDashboard}
 from "../src/server/dashboard/cycle-reader";
import type {SprintContextItem} from "../src/lib/sprint-context";

const id="123e4567-e89b-42d3-a456-426614174000",team="team-1";
const sprint:SprintContextItem={
 id,name:"Sprint pilote",status:"active",suspended:false,timeZone:"Europe/Paris",
 startAt:"2026-11-09T08:00:00.000Z",
 endAt:"2026-11-22T22:59:59.000Z"
};
const at=(stamp:string)=>new Date(stamp);
const read=(s:string,pol:"include-today"|"exclude-today"="include-today")=>
 sprintWorkingDaysRemaining(sprint,at(s),pol);

describe("SMN-236 — jours ouvrés restants",()=>{
 it("compte les jours civils locaux et garde une convention explicite",()=>{
  assert.deepEqual(read("2026-11-09T08:00:00Z"),{
   days:10,phase:"running",policy:"include-today"
  });
  assert.equal(read("2026-11-09T08:00:00Z","exclude-today").days,9);
  assert.equal(read("2026-11-20T11:00:00Z").days,1);
  assert.equal(read("2026-11-20T11:00:00Z","exclude-today").days,0);
  assert.equal(read("2026-11-21T11:00:00Z").days,0);
  assert.equal(read("2026-11-22T15:00:00Z").days,0);
 });
 it("sur un Sprint futur retourne sa quantité planifiée, puis zéro dès la fin",()=>{
  assert.deepEqual(read("2026-11-05T09:00:00Z"),{
   days:10,phase:"upcoming",policy:"include-today"
  });
  assert.equal(read("2026-11-22T23:00:00Z").days,0);
  assert.equal(read("2026-11-23T12:00:00Z").phase,"ended");
 });
 it("respecte le fuseau du Sprint, le lundi à minuit et un changement d'heure DST",()=>{
  const zone="Europe/Paris";
  const item={startAt:"2027-03-22T08:00:00Z",
   endAt:"2027-04-04T22:00:00Z",timeZone:zone};
  const v=sprintWorkingDaysRemaining(item,new Date("2027-03-28T12:00:00Z"),"include-today");
  assert.equal(v.days,5); // Lundi 29 mars -> vendredi 2 avril
  assert.equal(sprintWorkingDaysRemaining(item,new Date("2027-03-22T08:00:00Z"),"include-today").days,10);
  assert.equal(sprintWorkingDaysRemaining(item,new Date("2027-04-04T22:00:00Z"),"include-today").days,0);
 });
 it("n'ajoute pas le lundi qui suit une fin de Sprint à 00h00 locale",()=>{
  const item={...sprint,endAt:"2026-11-22T23:00:00Z"};
  assert.equal(sprintWorkingDaysRemaining(item,new Date("2026-11-20T08:00:00Z"),
   "include-today").days,1);
 });
});

function mockDb(fn:(sql:string,args?:unknown[])=>{rows:unknown[]}|undefined){
 const seen:{sql:string;args?:unknown[]}[]=[];
 const client={query:async(sql:string,args?:unknown[])=>{
  seen.push({sql,args});
  return fn(sql,args)??{rows:[],rowCount:0};
 }} as unknown as Client;
 return {db:client,seen};
}
describe("SMN-236 — tickets agrégés",()=>{
 it("GET ne modifie pas le schéma et retourne deux absences quand la table n'existe pas",async()=>{
  const f=mockDb(sql=>sql.includes("SELECT to_regclass")?{rows:[{present:"smn_sprint_ticket_counts"}]}:
   sql.includes("SELECT s.id,s.status")?
   {rows:[{id,status:"active",name:"Sprint pilote"}]}:
   sql.includes("to_regclass")?{rows:[{present:false}]}:undefined);
  const result=await readSprintTickets(f.db,id);
  assert.deepEqual(result?.counts,{initial:null,done:null});
  assert.equal(result?.revision,0);
  assert.ok(f.seen.every(x=>!/(?:INSERT|UPDATE|CREATE|ALTER|DELETE)\b/i.test(x.sql)));
 });
 it("GET restitue exactement un zéro et l'autre valeur nulle",async()=>{
  const f=mockDb(sql=>sql.includes("SELECT s.id,s.status")?
   {rows:[{id,status:"active",name:"Sprint pilote"}]}:
   sql.includes("to_regclass")?{rows:[{present:true}]}:
   sql.includes("SELECT initial_tickets::text")?
    {rows:[{initial_tickets:"0",done_tickets:null,revision:4}]}:undefined);
  const r=await readSprintTickets(f.db,id);
  assert.deepEqual(r?.counts,{initial:0,done:null});
  assert.equal(r?.revision,4);
 });
 it("PUT refuse un accès hors équipe et un Sprint clôturé, sans créer de table",async()=>{
  const payload={sprintId:id,revision:0,counts:{initial:12,done:6}};
  const absent=mockDb(()=>({rows:[]}));
  assert.deepEqual(await writeSprintTickets(absent.db,"user",payload),{ok:false,error:"not-found"});
  assert.ok(!absent.seen.some(x=>x.sql.includes("CREATE TABLE")));
  const closed=mockDb(sql=>sql.includes("SELECT s.id,s.status")?
   {rows:[{id,status:"closed",name:"Sprint pilote"}]}:undefined);
  assert.deepEqual(await writeSprintTickets(closed.db,"user",payload),{ok:false,error:"closed-period"});
  assert.ok(!closed.seen.some(x=>x.sql.includes("CREATE TABLE")));
 });
 it("PUT applique le contrôle de révision et audite les deux champs, sans copie de SP",async()=>{
  const payload={sprintId:id,revision:0,counts:{initial:0,done:7}};
  const f=mockDb(sql=>sql.includes("SELECT to_regclass")?{rows:[{present:"smn_sprint_ticket_counts"}]}:
   sql.includes("SELECT s.id,s.status")?
   {rows:[{id,status:"active",name:"Sprint pilote"}]}:
   sql.includes("FROM public.smn_sprint_ticket_counts WHERE sprint_id")?
    {rows:[]}:undefined);
  const result=await writeSprintTickets(f.db,"user",payload);
  assert.equal(result.ok,true);
  assert.ok(f.seen.some(x=>x.sql.includes("to_regclass"))); 
  assert.ok(!f.seen.some(x=>/CREATE\\s+TABLE/i.test(x.sql)));
  assert.ok(f.seen.some(x=>x.sql.includes("smn_sprint_ticket_counts_audit")));
  assert.ok(f.seen.some(x=>x.sql.includes("COMMIT")));
  assert.ok(!f.seen.some(x=>x.sql.includes("story_points")));
  const audit=f.seen.find(x=>x.sql.includes("INSERT INTO public.smn_sprint_ticket_counts_audit"));
  assert.deepEqual(JSON.parse(audit?.args?.[3] as string),{initial:0,done:7});
  const conflict=mockDb(sql=>sql.includes("SELECT to_regclass")?{rows:[{present:"smn_sprint_ticket_counts"}]}:
   sql.includes("SELECT s.id,s.status")?
   {rows:[{id,status:"active",name:"Sprint pilote"}]}:
   sql.includes("FROM public.smn_sprint_ticket_counts WHERE sprint_id")?
    {rows:[{initial_tickets:"4",done_tickets:"3",revision:2}]}:undefined);
  assert.deepEqual(await writeSprintTickets(conflict.db,"user",payload),
   {ok:false,error:"conflict"});
 });
 it("une clôture V2 conserve tickets, 0, provenance et ne reconstruit pas une V1",()=>{
  const existing=closedSnapshotProjection({
   goals:[],storyPoints:null,capacity:null,
   ticketCounts:{initial_tickets:"12",done_tickets:"0"}
  },2);
  assert.equal(existing.tickets.done.state,"available");
  if(existing.tickets.done.state==="available"){
   assert.equal(existing.tickets.done.value,0);
   assert.equal(existing.tickets.done.snapshotVersion,2);
  }
  const old=closedSnapshotProjection({goals:[],storyPoints:null},1);
  assert.equal(old.tickets.initial.state,"unavailable");
 });
 it("dashboard lit le ticket du Sprint sélectionné et conserve l'horloge SQL",async()=>{
  const db=mockDb((sql,args)=>{
   if(sql.includes("SELECT s.status"))return {rows:[{status:"active"}]};
   if(sql.includes("to_regclass")){
    return {rows:[{present:args?.[0]==="public.smn_sprint_ticket_counts"}]};
   }
   if(sql.includes("FROM public.smn_sprint_ticket_counts WHERE sprint_id")){
    assert.deepEqual(args,[id]);
    return {rows:[{initial_tickets:"8",done_tickets:"0"}]};
   }
   if(sql.includes("SELECT now() AS now_at"))return {rows:[{now_at:"2026-11-20T12:00:00Z"}]};
   if(sql.includes("SELECT now() AS at"))return {rows:[{at:"2026-11-20T12:00:00Z"}]};
   if(sql.startsWith("SAVEPOINT")||sql.startsWith("RELEASE SAVEPOINT"))return {rows:[]};
   if(sql.includes("information_schema.tables"))return {rows:[]};
   return undefined;
  });
  const result=await readCycleDashboard(db.db,team,sprint);
  assert.equal(result.tickets.initial.state,"available");
  if(result.tickets.done.state==="available")assert.equal(result.tickets.done.value,0);
  assert.equal(result.workingDaysRemaining.state,"available");
  if(result.workingDaysRemaining.state==="available")
   assert.equal(result.workingDaysRemaining.value,1);
  assert.ok(db.seen.some(x=>x.sql.includes("WHERE s.id=$1 AND s.team_id=$2")));
  assert.ok(!db.seen.some(x=>/INSERT INTO|UPDATE public|CREATE TABLE/i.test(x.sql)));
 });
 it("les endpoints et le contrat de diagnostic restent correctement protégés",()=>{
  const file=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
  const route=file("src/app/api/admin/sprints/tickets/route.ts");
  const allow=file("src/server/installation/contract.ts");
  const view=file("src/app/app/cycle-overview.tsx");
  const closure=file("src/server/sprints/closure.ts");
  assert.match(route,/authorizeApi\(req,"read",resource\)/);
  assert.match(route,/authorizeApi\(req,"write",resource\)/);
  assert.match(allow,/public\.smn_sprint_ticket_counts:r/);
  assert.match(allow,/public\.smn_sprint_ticket_counts_audit:r/);
  assert.match(view,/projection\?\.tickets\.initial/);
  assert.match(closure,/ticketCounts:ticket\?\.rows\[0\]/);
 });
});
