import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {canAccess} from "../src/server/access-policy";
import {parseTeamCalendarQuery,calendarDates,readTeamCalendar} from
 "../src/server/members/team-calendar";
const memberId="11111111-1111-4111-8111-111111111111";
const teamId="team-main";
const start="2026-05-01";
const params=(fields:Record<string,string>={})=>new URLSearchParams({start,...fields});
const query=(extra:Record<string,string>={},admin=true)=>{
 const result=parseTeamCalendarQuery(params(extra),admin);
 assert.ok(result);return result;
};
function fakeDb(opts:{
 duplicateAssignment?:boolean;unknownCalendar?:boolean;unknownCoverage?:boolean;
 absent?:boolean;holiday?:boolean;otherMember?:boolean;
}={}){
 const sqls:string[]=[];
 const assignment={
  id:"assigned-1",member_id:memberId,display_name:"Mme Exemple",
  member_number:1,start_on:"2025-01-01",end_on:null
 };
 const absence={
  id:"33333333-3333-4333-8333-333333333333",member_id:memberId,
  revision:1,category_id:"other",category_name:"Autre",category_color:"#6B7280",
  start_on:start,end_on:start,start_slot:"morning",end_slot:"afternoon",
  is_planned:true,reason:"Fête régionale personnelle"
 };
 const db={query:async(sql:string)=>{
  sqls.push(sql);
  if(sql.includes("FROM public.smn_team t")&&sql.includes("smn_installation"))
   return {rows:[{id:teamId,name:"Équipe Produit",mode:"scrum"}],rowCount:1};
  if(sql.includes("FROM public.smn_member_assignment a")){
   const rows=[assignment,...(opts.duplicateAssignment?
    [{...assignment,id:"assigned-2",start_on:"2026-01-01"}]:[])];
   return {rows,rowCount:rows.length};
  }
  if(sql.includes("FROM public.smn_member_absence a")){
   const rows=opts.absent===false?[]:[absence];return {rows,rowCount:rows.length};
  }
  if(sql.includes("FROM public.smn_member_calendar_week")){
   const rows=opts.unknownCalendar?[]:[{
    member_id:memberId,revision:1,effective_from:"2025-01-01",
    created_at:"2025-01-01",days:Array.from({length:7},(_,i)=>({
     weekday:i+1,morning:i<5,afternoon:i<5
    }))
   }];
   return {rows,rowCount:rows.length};
  }
  if(sql.includes("FROM public.smn_member_calendar_exception"))
   return {rows:[],rowCount:0};
  if(sql.includes("FROM public.smn_member_location")){
   const rows=[{member_id:memberId,revision:1,effective_from:"2025-01-01",
    country_iso2:"FR"}];
   return {rows,rowCount:rows.length};
  }
  if(sql.includes("FROM public.smn_national_holiday")){
   const rows=opts.holiday===false?[]:[{
    country_code:"FR",holiday_date:start,name:"Fête du Travail"
   }];
   return {rows,rowCount:rows.length};
  }
  if(sql.includes("FROM public.smn_national_calendar_coverage")){
   const rows=[{country_code:"FR",calendar_year:2026,
    status:opts.unknownCoverage?"partial":"configured"}];
   return {rows,rowCount:rows.length};
  }
  if(sql.includes("FROM public.smn_absence_category")){
   const rows=[{id:"other",name:"Autre"}];return {rows,rowCount:rows.length};
  }
  throw Error("unhandled sql: "+sql);
 }} as unknown as Client;
 return {db,sqls,reason:absence.reason};
}
describe("SMN-55 : calendrier d'équipe selon le rôle",()=>{
 it("borne la période, rejette les paramètres inconnus et filtre le membre seulement pour l'admin",()=>{
  assert.equal(parseTeamCalendarQuery(params({days:"31"}),true),null);
  assert.equal(parseTeamCalendarQuery(params({start:"2026-02-30"}),true),null);
  assert.equal(parseTeamCalendarQuery(params({unexpected:"true"}),true),null);
  assert.equal(parseTeamCalendarQuery(params({kind:"planned"}),false),null);
  assert.equal(parseTeamCalendarQuery(params({memberId}),false),null);
  assert.equal(parseTeamCalendarQuery(params({categoryId:"sick"}),false),null);
  assert.equal(parseTeamCalendarQuery(new URLSearchParams("start=2026-05-01&start=2026-05-02"),true),null);
  assert.equal(query({days:"14",memberId,kind:"unplanned"}).days,14);
  assert.deepEqual(calendarDates("2026-12-30",7).slice(0,4),
   ["2026-12-30","2026-12-31","2027-01-01","2027-01-02"]);
 });
 it("réserve les détails nominatifs et motifs au rôle administrateur",async()=>{
  const f=fakeDb();
  const collective=await readTeamCalendar(f.db,query({},false),false);
  assert.equal(collective.admin,undefined);
  assert.equal(collective.collective.length,7);
  assert.equal(collective.collective[0].assigned,1);
  assert.equal(collective.collective[0].reportedUnavailable,1);
  const serialized=JSON.stringify(collective);
  assert.equal(serialized.includes("Mme Exemple"),false);
  assert.equal(serialized.includes(f.reason),false);
  assert.equal(serialized.includes(memberId),false);
  assert.equal(serialized.includes("categoryColor"),false);
  assert.ok(f.sqls.every(sql=>sql.trim().startsWith("SELECT")));
 });
 it("affiche pour l'admin les libellés, la couleur et le motif d'une absence centrale",async()=>{
  const f=fakeDb();
  const output=await readTeamCalendar(f.db,query(),true);
  assert.equal(output.admin?.members.length,1);
  const day=output.admin!.members[0].days[0];
  assert.equal(day.date,start);
  assert.equal(day.absences[0].reason,f.reason);
  assert.equal(day.absences[0].categoryName,"Autre");
  assert.equal(day.absences[0].categoryColor,"#6B7280");
  assert.equal(day.absences[0].id,"33333333-3333-4333-8333-333333333333");
  assert.equal(day.nationalHolidayName,"Fête du Travail");
  assert.equal(day.deductedHalfDays,2);
 });
 it("ne duplique pas un membre affecté plusieurs fois pendant une période",async()=>{
  const f=fakeDb({duplicateAssignment:true});
  const output=await readTeamCalendar(f.db,query(),true);
  assert.equal(output.admin?.members.length,1);
  assert.equal(output.collective[0].assigned,1);
  assert.equal(output.collective[0].reportedUnavailable,1);
 });
 it("n'invente pas de disponibilité si la trame ou la couverture nationale est inconnue",async()=>{
  const schedule=await readTeamCalendar(fakeDb({unknownCalendar:true}).db,query(),true);
  assert.equal(schedule.collective[0].unknown,1);
  assert.equal(schedule.admin!.members[0].days[0].deductedHalfDays,null);
  const coverage=await readTeamCalendar(fakeDb({
   holiday:false,unknownCoverage:true
  }).db,query(),true);
  assert.equal(coverage.collective[0].unknown,1);
  assert.equal(coverage.collective[0].availableMembers,0);
 });
 it("applique les filtres type et catégorie sur les détails, jamais sur les données stockées",async()=>{
  const unplanned=await readTeamCalendar(fakeDb().db,
   query({kind:"unplanned",categoryId:"other"}),true);
  assert.equal(unplanned.admin!.members[0].days[0].absences.length,0);
  assert.equal(unplanned.admin!.members[0].days[0].deductedHalfDays,2);
  const planned=await readTeamCalendar(fakeDb().db,
   query({kind:"planned",categoryId:"other"}),true);
  assert.equal(planned.admin!.members[0].days[0].absences.length,1);
  assert.equal(planned.collective[0].reportedUnavailable,1);
 });
 it("rejette une équipe hors périmètre et ne permet pas au rôle user de modifier",async()=>{
  const f=fakeDb();
  await assert.rejects(readTeamCalendar(f.db,query({teamId:"other-team"}),true),
   /team-calendar-not-found/);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},
   "read",{type:"collective",exists:true,inScope:true}),true);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},
   "write",{type:"members",exists:true,inScope:true}),false);
  assert.equal(canAccess({role:"admin",is_active:true,must_change_password:false},
   "write",{type:"members",exists:true,inScope:true}),true);
 });
});
