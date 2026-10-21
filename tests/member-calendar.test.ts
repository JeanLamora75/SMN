import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {randomUUID} from "node:crypto";
import type {Client} from "pg";
import {DEFAULT_WEEK,parseCalendarWrite,resolveCalendarDay,readMemberCalendar,saveMemberCalendar} from "../src/server/members/calendar";
import {MEMBER_CALENDAR_MIGRATION_SQL} from "../src/server/members/calendar-migration";

const id=randomUUID();
const weekly={action:"weekly" as const,revision:0,effectiveFrom:"2026-10-21",days:DEFAULT_WEEK.map(d=>({...d}))};
const exception={action:"exception" as const,revision:0,onDate:"2026-10-24",morning:true,afternoon:false,note:"Permanence"};
const weekRow=(revision=1,effective_from="2026-10-21")=>({revision,effective_from,days:DEFAULT_WEEK,created_at:"2026-10-21T12:00:00Z"});
const exceptRow=(revision=1)=>({revision,on_date:"2026-10-24",morning:true,afternoon:false,note:"Permanence",created_at:"2026-10-21T12:00:00Z"});
function fixture(opts:{weeks?:ReturnType<typeof weekRow>[];exceptions?:ReturnType<typeof exceptRow>[];archived?:boolean;failInsert?:boolean}={}){
 const queries:string[]=[],values:unknown[][]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  queries.push(sql);values.push(args);
  if(sql.includes("CURRENT_DATE::text AS today"))return {rows:[{today:"2026-10-21"}]};
  if(sql.includes("FROM public.smn_member m")&&sql.includes("JOIN public.smn_member_batch"))
   return {rows:[{id,archived_at:opts.archived?"2026-10-20T12:00:00Z":null,team_id:"team",contract_percent:80}]};
  if(sql.includes("FROM public.smn_member_calendar_week WHERE member_id=$1"))
   return {rows:opts.weeks??[]};
  if(sql.includes("FROM public.smn_member_calendar_exception WHERE member_id=$1"))
   return {rows:opts.exceptions??[]};
  if(sql.includes("INSERT INTO public.smn_member_calendar_")&&opts.failInsert)throw Error("fixture-write-error");
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 return {db,queries,values};
}
describe("Calendrier individuel central, exceptions et dates d'effet",()=>{
 it("propose cinq journées complètes, week-end chômé sans présumer d'une disponibilité enregistrée",()=>{
  assert.deepEqual(DEFAULT_WEEK.map(d=>Number(d.morning)+Number(d.afternoon)),[2,2,2,2,2,0,0]);
  assert.equal(DEFAULT_WEEK.length,7);
  assert.equal(resolveCalendarDay([],[],"2026-10-21").status,"missing");
  assert.equal(resolveCalendarDay([],[],"2026-10-21").developmentCapacityJh,null);
 });
 it("valide demi-journées, séquence ISO et rejette les payloads incohérents",()=>{
  assert.deepEqual(parseCalendarWrite(weekly),weekly);
  assert.deepEqual(parseCalendarWrite(exception),exception);
  for(const bad of [
   {...weekly,revision:-1},{...weekly,days:weekly.days.slice(0,6)},
   {...weekly,days:weekly.days.map((d,i)=>i===3?{...d,weekday:1}:d)},
   {...weekly,effectiveFrom:"2026-02-30"},
   {...weekly,days:weekly.days.map((d,i)=>i===2?{...d,morning:1}:d)},
   {...weekly,contractPercent:60},
   {...exception,morning:"false"},
   {...exception,onDate:"2026-13-01"},
   {...exception,note:"x".repeat(201)},
   {...exception,absenceCategory:"vacation"}
  ])assert.equal(parseCalendarWrite(bad),null);
 });
 it("applique les dernières versions par date et l'exception de demi-journée",()=>{
  const w1=weekRow();
  const w2={...weekRow(2,"2026-11-01"),days:DEFAULT_WEEK.map(d=>({...d,morning:false,afternoon:false}))};
  assert.deepEqual(resolveCalendarDay([w1,w2],[],"2026-10-22").slots,{morning:true,afternoon:true});
  assert.deepEqual(resolveCalendarDay([w1,w2],[],"2026-11-02").slots,{morning:false,afternoon:false});
  const d=resolveCalendarDay([w1],[exceptRow()],"2026-10-24");
  assert.equal(d.status,"configured");
  assert.equal(d.source,"exception");
  assert.deepEqual(d.slots,{morning:true,afternoon:false});
  assert.equal(d.absenceDays,null);
  assert.equal(d.developmentCapacityJh,null);
 });
 it("lecture sans version: calendrier seulement suggéré, taux contractuel indépendant",async()=>{
  const f=fixture();
  const result=await readMemberCalendar(f.db,id,"2026-10-21");
  assert.equal(result.configured,false);
  assert.equal(result.current,null);
  assert.equal(result.contractPercent,80);
  assert.equal(result.day.status,"missing");
  assert.deepEqual(result.suggestedWeek,DEFAULT_WEEK);
 });
 it("sauvegarde version hebdomadaire atomiquement sans modifier affectations ni membres",async()=>{
  const f=fixture();
  const result=await saveMemberCalendar(f.db,id,"admin",weekly);
  assert.deepEqual(result,{ok:true,action:"weekly",revision:1});
  assert.equal(f.queries.at(-1),"COMMIT");
  assert.equal(f.queries.filter(q=>q.includes("INSERT INTO public.smn_member_calendar_week")).length,1);
  assert.ok(!f.queries.some(q=>q.includes("UPDATE public.smn_member_assignment")||q.includes("UPDATE public.smn_member SET")));
 });
 it("préserve versions antérieures, refuse dates passées ou révisions obsolètes",async()=>{
  const existing=fixture({weeks:[weekRow()]});
  assert.deepEqual(await saveMemberCalendar(existing.db,id,"admin",{...weekly,revision:0}),
   {ok:false,error:"conflict"});
  assert.equal(existing.queries.at(-1),"ROLLBACK");
  const old=fixture({weeks:[weekRow()]});
  assert.deepEqual(await saveMemberCalendar(old.db,id,"admin",{...weekly,revision:1,effectiveFrom:"2026-10-19"}),
   {ok:false,error:"date-in-past"});
  const future=fixture({weeks:[weekRow(1,"2026-11-01")]});
  assert.deepEqual(await saveMemberCalendar(future.db,id,"admin",{...weekly,revision:1}),
   {ok:false,error:"date-before-latest"});
 });
 it("exceptions: nécessite une trame applicable à la date, et écrit seulement dans le référentiel central",async()=>{
  const noWeekly=fixture();
  assert.deepEqual(await saveMemberCalendar(noWeekly.db,id,"admin",exception),
   {ok:false,error:"weekly-missing"});
  const f=fixture({weeks:[weekRow()]});
  assert.deepEqual(await saveMemberCalendar(f.db,id,"admin",exception),
   {ok:true,action:"exception",revision:1});
  assert.ok(f.queries.some(q=>q.includes("INSERT INTO public.smn_member_calendar_exception")));
  assert.ok(f.queries.every(q=>!q.includes("absence")&&!q.includes("capacity")));
 });
 it("une correction d'exception du même jour est une nouvelle révision, jamais un UPDATE",async()=>{
  const first=fixture({weeks:[weekRow()],exceptions:[exceptRow()]});
  const updated=await saveMemberCalendar(first.db,id,"admin",{
   ...exception,revision:1,morning:false,afternoon:true
  });
  assert.deepEqual(updated,{ok:true,action:"exception",revision:2});
  assert.ok(first.queries.some(q=>q.includes("INSERT INTO public.smn_member_calendar_exception")));
  assert.ok(first.queries.every(q=>!q.includes("UPDATE public.smn_member_calendar")));
  const stale=fixture({weeks:[weekRow()],exceptions:[exceptRow()]});
  assert.deepEqual(await saveMemberCalendar(stale.db,id,"admin",exception),
   {ok:false,error:"conflict"});
 });
 it("archive : historique lisible mais édition interdite ; rollback si SQL échoue",async()=>{
  const archived=fixture({archived:true,weeks:[weekRow()]});
  assert.deepEqual(await saveMemberCalendar(archived.db,id,"admin",weekly),{ok:false,error:"archived"});
  assert.equal((await readMemberCalendar(archived.db,id,"2026-10-21")).archived,true);
  const failed=fixture({failInsert:true});
  await assert.rejects(()=>saveMemberCalendar(failed.db,id,"admin",weekly),/fixture-write-error/);
  assert.equal(failed.queries.at(-1),"ROLLBACK");
 });
 it("schéma version 13 avec contraintes sans cascade ni absence fictive",()=>{
  assert.match(MEMBER_CALENDAR_MIGRATION_SQL,/CREATE TABLE public.smn_member_calendar_week/);
  assert.match(MEMBER_CALENDAR_MIGRATION_SQL,/CREATE TABLE public.smn_member_calendar_exception/);
  assert.match(MEMBER_CALENDAR_MIGRATION_SQL,/ON DELETE RESTRICT/);
  assert.match(MEMBER_CALENDAR_MIGRATION_SQL,/schema_version=13/);
  assert.doesNotMatch(MEMBER_CALENDAR_MIGRATION_SQL,/ON DELETE CASCADE|DROP TABLE/i);
 });
});
