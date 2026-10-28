import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {computeDevelopmentDay,parseCapacityPeriod,readDevelopmentCapacity,validHoursPerJh}
 from "../src/server/capacity/engine";
import {readCapacitySettings,updateCapacitySettings} from "../src/server/capacity/settings";
import {CAPACITY_MIGRATION_SQL} from "../src/server/capacity/migration";
import {canAccess} from "../src/server/access-policy";
import {parseAssignmentInput} from "../src/server/members/assignment";
const memberId="11111111-1111-4111-8111-111111111111";
const assignmentId="22222222-2222-4222-8222-222222222222";
const actorId="33333333-3333-4333-8333-333333333333";
const teamId="team-main";
const range={start:"2026-05-01",end:"2026-05-04"};
type Options={percentPO?:boolean;percentScrumMaster?:boolean;missingVersion?:boolean;missingCalendar?:boolean;
 missingCountry?:boolean;partialNational?:boolean;holiday?:boolean;
 closure?:boolean;absence?:boolean;assignmentChanges?:boolean;multiAssignment?:boolean;
 noAssignments?:boolean;hours?:number};
function fixture(opts:Options={}){
 const sql:string[]=[];
 const assignment={id:assignmentId,member_id:memberId,display_name:"Membre référent",
  start_on:"2026-01-01",end_on:null};
 const versions=[{
  assignment_id:assignmentId,revision:1,effective_from:"2026-01-01",
  contract_percent:100,allocation_percent:100,contribution_percent:100,
  scrum_master_percent:opts.percentScrumMaster?100:0,
  product_owner_percent:opts.percentPO?100:0,
  developer_percent:opts.percentPO||opts.percentScrumMaster?0:100
 },...(opts.assignmentChanges?[{
  assignment_id:assignmentId,revision:2,effective_from:"2026-05-03",
  contract_percent:100,allocation_percent:50,contribution_percent:50,
  developer_percent:100
 }]:[])];
 const db={query:async(q:string,args:unknown[]=[])=>{
  sql.push(q);
  if(q.startsWith("BEGIN")||q==="COMMIT"||q==="ROLLBACK")
   return {rows:[],rowCount:0};
  if(q.includes("FROM public.smn_team t")){
   const rows=[{id:teamId,name:"Equipe MVP",mode:"scrum"}];
   return {rows,rowCount:1};
  }
  if(q.includes("FROM public.smn_capacity_settings")){
   const rows=[{hours_per_jh:opts.hours??8,revision:1,updated_at:"2026-10-21"}];
   return {rows,rowCount:1};
  }
  if(q.includes("FROM public.smn_member_assignment a")){
   const rows=opts.noAssignments?[]:[assignment,...(opts.multiAssignment?
    [{...assignment,id:"different-assignment"}]:[])];
   return {rows,rowCount:rows.length};
  }
  if(q.includes("FROM public.smn_member_assignment_version")){
   const rows=opts.missingVersion?[]:versions;return {rows,rowCount:rows.length};
  }
  if(q.includes("FROM public.smn_member_calendar_week")){
   const rows=opts.missingCalendar?[]:[{
    member_id:memberId,revision:1,effective_from:"2026-01-01",
    created_at:"2026-01-01",days:[
     {weekday:1,morning:true,afternoon:true},
     {weekday:2,morning:true,afternoon:true},
     {weekday:3,morning:true,afternoon:true},
     {weekday:4,morning:true,afternoon:true},
     {weekday:5,morning:true,afternoon:true},
     {weekday:6,morning:false,afternoon:false},
     {weekday:7,morning:false,afternoon:false}
    ]
   }];
   return {rows,rowCount:rows.length};
  }
  if(q.includes("FROM public.smn_member_calendar_exception"))
   return {rows:[],rowCount:0};
  if(q.includes("FROM public.smn_member_location")){
   const rows=opts.missingCountry?[]:[{
    member_id:memberId,revision:1,effective_from:"2026-01-01",country_iso2:"FR"
   }];
   return {rows,rowCount:rows.length};
  }
  if(q.includes("FROM public.smn_member_absence")){
   const rows=opts.absence?[{
    member_id:memberId,start_on:"2026-05-01",end_on:"2026-05-01",
    start_slot:"morning",end_slot:"afternoon"
   }]:[];
   return {rows,rowCount:rows.length};
  }
  if(q.includes("FROM public.smn_company_closure")){
   const rows=opts.closure?[{member_id:memberId,start_on:"2026-05-01",end_on:"2026-05-01"}]:[];
   return {rows,rowCount:rows.length};
  }
  if(q.includes("FROM public.smn_national_holiday")){
   const rows=opts.holiday?[{country_code:"FR",holiday_date:"2026-05-01",name:"Fête du Travail"}]:[];
   return {rows,rowCount:rows.length};
  }
  if(q.includes("FROM public.smn_national_calendar_coverage")){
   const rows=[{country_code:"FR",calendar_year:2026,
    status:opts.partialNational?"partial":"configured"}];
   return {rows,rowCount:1};
  }
  throw Error("SQL non mocké: "+q+" / "+JSON.stringify(args));
 }} as unknown as Client;
 return {db,sql};
}
describe("SMN-57 — calcul fiable des JH",()=>{
 it("valide la période, sans Sprint ni conversion de Story Points",()=>{
  assert.deepEqual(parseCapacityPeriod(new URLSearchParams("start=2026-05-01&end=2026-05-04")),range);
  for(const q of [
   "start=2026-02-30&end=2026-03-01","start=2026-05-05&end=2026-05-04",
   "start=2026-01-01&end=2026-05-01","start=2026-05-01&end=2026-05-04&format=csv",
   "start=2026-05-01&start=2026-05-02&end=2026-05-04"
  ])assert.equal(parseCapacityPeriod(new URLSearchParams(q)),null);
 });
 it("calcule les heures et JH à la demi-journée avec quatre facteurs",()=>{
  assert.deepEqual(computeDevelopmentDay(2,8,50,50,50),{hours:1,jh:0.125});
  assert.deepEqual(computeDevelopmentDay(1,8,100,100,100),{hours:4,jh:0.5});
  assert.deepEqual(computeDevelopmentDay(2,7.5,100,100,100),{hours:7.5,jh:1});
  assert.equal(computeDevelopmentDay(3,8,100,100,100),null);
  assert.equal(computeDevelopmentDay(2,8,101,100,100),null);
 });
 it("un membre avec 100 % de rôle PO a zéro JH de développement",async()=>{
  const f=fixture({percentPO:true});
  const report=await readDevelopmentCapacity(f.db,range.start,range.end);
  assert.equal(report.status,"calculated");
  assert.equal(report.totalJh,0);
  assert.equal(report.members[0].days[0].developerPercent,0);
  assert.equal(f.sql.some(q=>/story.?point|sprint|kanban_indicator|INSERT|UPDATE/i.test(q)),false);
 });
 it("AC2 modifié — Scrum Master 100 % sans activité Développeur produit 0 JH",async()=>{
  const assignment=parseAssignmentInput({
   memberId,teamId,effectiveFrom:"2026-05-01",contractPercent:100,
   allocationPercent:100,contributionPercent:100,revision:0,
   shares:{scrumMaster:100,productOwner:0,developer:0}
  });
  assert.ok(assignment);
  assert.deepEqual(assignment.shares,{scrumMaster:100,productOwner:0,developer:0});
  const f=fixture({percentScrumMaster:true});
  const report=await readDevelopmentCapacity(f.db,range.start,range.end);
  assert.equal(report.status,"calculated");
  assert.equal(report.totalJh,0);
  assert.equal(report.members.length,1);
  assert.equal(report.members[0].status,"calculated");
  assert.equal(report.members[0].totalJh,0);
  assert.ok(report.members[0].days.every(day=>day.developmentJh===0&&
   day.developmentHours===0&&day.developerPercent===0));
  assert.equal(f.sql.some(q=>/story.?point|sprint|kanban_indicator|INSERT|UPDATE/i.test(q)),false);
  assert.equal(f.sql[0],"BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
 });
 it("AC2 et AC4 — rôle non Développeur sans calendrier reste non calculable",async()=>{
  const report=await readDevelopmentCapacity(fixture({
   percentScrumMaster:true,missingCalendar:true
  }).db,range.start,range.end);
  assert.equal(report.status,"not-calculable");
  assert.equal(report.totalJh,null);
  assert.ok(report.missing.some(m=>m.source==="work-calendar"));
 });
 it("ne déduit qu'une fois les jours fériés, fermetures et absences",async()=>{
  const report=await readDevelopmentCapacity(fixture({
   holiday:true,closure:true,absence:true
  }).db,range.start,range.end);
  assert.equal(report.status,"calculated");
  assert.equal(report.members[0].days[0].availableHalfDays,0);
  assert.equal(report.members[0].days[0].developmentJh,0);
  assert.equal(report.totalJh,1);
 });
 it("sélectionne la version effective à chaque date et respecte les sous-périodes",async()=>{
  const report=await readDevelopmentCapacity(fixture({assignmentChanges:true}).db,
   range.start,range.end);
  assert.equal(report.status,"calculated");
  const days=report.members[0].days;
  assert.equal(days[0].developmentJh,1);
  assert.equal(days[1].developmentJh,0);
  assert.equal(days[2].developmentJh,0);
  assert.equal(days[3].allocationPercent,50);
  assert.equal(days[3].contributionPercent,50);
  assert.equal(days[3].developmentJh,0.25);
  assert.equal(report.totalJh,1.25);
 });
 it("une version historique absente ne produit jamais zéro fictif",async()=>{
  const report=await readDevelopmentCapacity(fixture({missingVersion:true}).db,
   range.start,range.end);
  assert.equal(report.status,"not-calculable");
  assert.equal(report.totalJh,null);
  assert.equal(report.members[0].totalJh,null);
  assert.ok(report.missing.some(m=>m.source==="assignment-version"));
 });
 it("le calendrier individuel est requis, mais le pays et les jours fériés ne le sont pas",async()=>{
  const absent=await readDevelopmentCapacity(fixture({missingCalendar:true}).db,
   range.start,range.end);
  assert.equal(absent.totalJh,null);
  assert.ok(absent.missing.some(m=>m.source==="work-calendar"));
  for(const options of [{partialNational:true},{missingCountry:true},
   {partialNational:true,missingCountry:true}]){
   const report=await readDevelopmentCapacity(fixture(options).db,
    range.start,range.end);
   assert.equal(report.totalJh,2);
   assert.equal(report.status,"calculated");
   assert.deepEqual(report.missing,[]);
  }
 });
 it("sans jours fériés enregistrés, la capacité est calculable ; un férié connu reste déduit",async()=>{
  const withoutHoliday=await readDevelopmentCapacity(fixture({
   partialNational:true,holiday:false
  }).db,range.start,range.end);
  assert.equal(withoutHoliday.totalJh,2);
  const withHoliday=await readDevelopmentCapacity(fixture({
   partialNational:true,holiday:true
  }).db,range.start,range.end);
  assert.equal(withHoliday.totalJh,1);
  assert.equal(withHoliday.members[0].days[0].availableHalfDays,0);
 });
 it("une fermeture collective reste déduite sans couverture nationale configurée",async()=>{
  const report=await readDevelopmentCapacity(fixture({
   partialNational:true,closure:true,holiday:false
  }).db,range.start,range.end);
  assert.equal(report.status,"calculated");
  assert.equal(report.totalJh,1);
  assert.equal(report.members[0].days[0].status,"calculated");
  assert.equal(report.members[0].days[0].availableHalfDays,0);
  assert.deepEqual(report.missing,[]);
 });
 it("des affectations simultanées ambiguës restent non calculables",async()=>{
  const report=await readDevelopmentCapacity(fixture({multiAssignment:true}).db,
   range.start,range.end);
  assert.equal(report.totalJh,null);
  assert.ok(report.missing.some(m=>m.source==="ambiguous-assignment"));
 });
 it("aucune affectation connue n'est jamais convertie en zéro JH",async()=>{
  const report=await readDevelopmentCapacity(fixture({noAssignments:true}).db,
   range.start,range.end);
  assert.equal(report.totalJh,null);
  assert.equal(report.missing[0].source,"no-assignments");
 });
 it("sauvegarde aucune donnée de Sprint, Daily, capacité figée ou PDF",async()=>{
  const f=fixture();
  await readDevelopmentCapacity(f.db,range.start,range.end);
  assert.equal(f.sql[0],"BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  assert.equal(f.sql.at(-1),"COMMIT");
  assert.ok(f.sql.every(x=>x.startsWith("SELECT")||x.startsWith("BEGIN")||x==="COMMIT"));
  const user={role:"user",is_active:true,must_change_password:false};
  assert.equal(canAccess(user,"read",{type:"members",exists:true,inScope:true}),false);
 });
 it("paramètre heures/JH historisé avec concurrence optimiste",async()=>{
  let revision=1,hours=8;
  const audit:unknown[][]=[];
  const db={query:async(sql:string,args:unknown[]=[])=>{
   if(["BEGIN","ROLLBACK","COMMIT"].includes(sql))return {rows:[],rowCount:0};
   if(sql.includes("FROM public.smn_capacity_settings"))return {rows:[{
    hours_per_jh:hours,revision,updated_at:"2026-10-21"
   }],rowCount:1};
   if(sql.includes("UPDATE public.smn_capacity_settings")){
    hours=Number(args[0]);revision++;
    return {rows:[{hours_per_jh:hours,revision,updated_at:"2026-10-22"}],rowCount:1};
   }
   if(sql.includes("INSERT INTO public.smn_capacity_settings_audit")){
    audit.push(args);return {rows:[],rowCount:1};
   }
   throw Error("unexpected SQL "+sql);
  }} as unknown as Client;
  assert.equal((await readCapacitySettings(db)).hoursPerJh,8);
  const updated=await updateCapacitySettings(db,actorId,{hoursPerJh:7.5,revision:1});
  assert.equal(updated.ok,true);
  assert.equal(hours,7.5);
  assert.equal(audit.length,1);
  assert.equal(audit[0][2],8);
  assert.equal(audit[0][3],7.5);
  assert.deepEqual(await updateCapacitySettings(db,actorId,{hoursPerJh:9,revision:1}),
   {ok:false,error:"conflict"});
  assert.deepEqual(await updateCapacitySettings(db,actorId,{hoursPerJh:0,revision:2}),
   {ok:false,error:"invalid-input"});
 });
 it("migre en v21 par ajout uniquement, paramètre 8 h/JH audité",()=>{
  assert.match(CAPACITY_MIGRATION_SQL,/schema_version=21/);
  assert.match(CAPACITY_MIGRATION_SQL,/VALUES\('singleton',8\)/);
  assert.match(CAPACITY_MIGRATION_SQL,/smn_capacity_settings_audit/);
  assert.doesNotMatch(CAPACITY_MIGRATION_SQL,/DROP TABLE|ON DELETE CASCADE/i);
 });
 it("paramètre d'heures configurable : valide la valeur et la version",()=>{
  assert.equal(validHoursPerJh(8),true);
  assert.equal(validHoursPerJh(7.5),true);
  assert.equal(validHoursPerJh(0),false);
  assert.equal(validHoursPerJh(25),false);
  assert.equal(validHoursPerJh(7.123),false);
 });
});
