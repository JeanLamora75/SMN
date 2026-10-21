import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {parseAbsenceChange,absenceOnDate,overlapsAbsence,readMemberAbsences,
 saveMemberAbsence,type AbsenceItem} from "../src/server/members/absence";
import {ABSENCE_MIGRATION_SQL} from "../src/server/members/absence-migration";
const memberId="11111111-1111-4111-8111-111111111111";
const actorId="22222222-2222-4222-8222-222222222222";
const input=(changes:Record<string,unknown>={})=>({
 action:"create",revision:0,categoryId:"leave",startOn:"2024-05-01",endOn:"2024-05-01",
 startSlot:"morning",endSlot:"afternoon",isPlanned:true,reason:"Congés",...changes
});
function fakeDb(options:{archived?:boolean;categories?:string[];days?:Array<{
 id:string;member_id:string;category_id:string;revision:number;start_on:string;end_on:string;
 start_slot:string;end_slot:string;is_planned:boolean;reason:string;
 }>;missing?:boolean}={}){
 const days=options.days??[],audit:Array<unknown[]>=[],sqls:string[]=[];
 const categories=["leave","training","sick","other"].map(id=>({id,name:id,color:"#6B7280",
  is_active:options.categories?.includes(id)??true}));
 const db={query:async(sql:string,params:unknown[]=[])=>{
  sqls.push(sql);
  if(["BEGIN","COMMIT","ROLLBACK"].includes(sql))return {rows:[],rowCount:0};
  if(sql.includes("FROM public.smn_member m")&&sql.includes("JOIN public.smn_installation i"))
   return {rows:options.missing?[]:[{id:memberId,archived_at:options.archived?"2026-10-20":null}],
    rowCount:options.missing?0:1};
  if(sql.includes("FROM public.smn_absence_category WHERE id=$1"))
   return {rows:categories.filter(c=>c.id===params[0]),rowCount:1};
  if(sql.includes("FROM public.smn_absence_category ORDER BY"))
   return {rows:categories,rowCount:categories.length};
  if(sql.includes("JOIN public.smn_absence_category c")&&sql.includes("FOR UPDATE OF a")){
   const found=days.filter(d=>d.id===params[0]&&d.member_id===params[1]);
   return {rows:found.map(d=>({...d,category_name:"Absence",category_color:"#6B7280",
    created_at:"2024-01-01",updated_at:"2024-01-01"})),rowCount:found.length};
  }
  if(sql.includes("FROM public.smn_member_absence WHERE member_id=$1")){
   const conflicts=days.filter(d=>d.member_id===params[0]&&d.id!==params[1]&&
    d.start_on<=String(params[2])&&d.end_on>=String(params[3]));
   return {rows:conflicts,rowCount:conflicts.length};
  }
  if(sql.includes("FROM public.smn_member_absence a")&&sql.includes("ORDER BY a.start_on DESC")){
   const found=days.filter(d=>d.member_id===params[0]);
   return {rows:found.map(d=>({...d,category_name:"Congés",category_color:"#4F83CC",
    created_at:"2024-01-01",updated_at:"2024-01-01"})),rowCount:found.length};
  }
  if(sql.includes("INSERT INTO public.smn_member_absence
")||
   sql.includes("INSERT INTO public.smn_member_absence")){
   days.push({id:String(params[0]),member_id:String(params[1]),category_id:String(params[2]),
    start_on:String(params[3]),end_on:String(params[4]),start_slot:String(params[5]),
    end_slot:String(params[6]),is_planned:params[7]===true,reason:String(params[8]),revision:1});
   return {rows:[],rowCount:1};
  }
  if(sql.includes("UPDATE public.smn_member_absence SET")){
   const day=days.find(d=>d.id===params[0]&&d.member_id===params[1]&&d.revision===params[10]);
   if(!day)return {rows:[],rowCount:0};
   Object.assign(day,{category_id:params[2],start_on:params[3],end_on:params[4],
    start_slot:params[5],end_slot:params[6],is_planned:params[7],reason:params[8],revision:day.revision+1});
   return {rows:[],rowCount:1};
  }
  if(sql.includes("INSERT INTO public.smn_member_absence_history")){
   audit.push(params);return {rows:[],rowCount:1};
  }
  throw new Error("Unexpected SQL: "+sql);
 }} as unknown as Client;
 return {db,days,audit,sqls};
}
describe("absence individuelle centralisée",()=>{
 it("refuse un motif ou une catégorie absents même pour une période passée",()=>{
  const a=parseAbsenceChange(input({reason:"   "}));
  assert.deepEqual(a,{ok:false,error:"reason-required"});
  const absentReason=input();delete (absentReason as Partial<typeof absentReason>).reason;
  assert.deepEqual(parseAbsenceChange(absentReason),{ok:false,error:"reason-required"});
  const absentCategory=input();delete (absentCategory as Partial<typeof absentCategory>).categoryId;
  assert.deepEqual(parseAbsenceChange(absentCategory),{ok:false,error:"category-required"});
  const b=parseAbsenceChange(input({categoryId:""}));
  assert.deepEqual(b,{ok:false,error:"category-required"});
  assert.equal(parseAbsenceChange(input({reason:"Un motif clair"})).ok,true);
 });
 it("valide les bornes et les demi-journées sans interdire les dates historiques",()=>{
  assert.equal(parseAbsenceChange(input({startOn:"1999-01-03",endOn:"1999-01-03"})).ok,true);
  for(const changes of [
   {startOn:"2024-02-30"},{endOn:"2024-04-30"},
   {startSlot:"afternoon",endSlot:"morning"},
   {startOn:"2024-05-03",endOn:"2024-05-01"}
  ]){
   const result=parseAbsenceChange(input(changes));
   assert.equal(result.ok,false);
   if(!result.ok)assert.equal(result.error,"invalid-period");
  }
  assert.deepEqual(parseAbsenceChange(input({isPlanned:"true"})),{ok:false,error:"invalid-input"});
 });
 it("compte une demi-journée exactement une fois pour la fiche du membre",()=>{
  const a={startOn:"2024-05-01",endOn:"2024-05-02",
   startSlot:"afternoon" as const,endSlot:"morning" as const};
  assert.deepEqual(absenceOnDate(a,"2024-05-01"),{morning:false,afternoon:true});
  assert.deepEqual(absenceOnDate(a,"2024-05-02"),{morning:true,afternoon:false});
  assert.deepEqual(absenceOnDate(a,"2024-05-03"),{morning:false,afternoon:false});
  const sameMorning={...a,startOn:"2024-05-02",endOn:"2024-05-02",
   startSlot:"morning" as const,endSlot:"morning" as const};
  const sameAfternoon={...sameMorning,startSlot:"afternoon" as const,endSlot:"afternoon" as const};
  assert.equal(overlapsAbsence(a,sameMorning),true);
  assert.equal(overlapsAbsence(a,sameAfternoon),false);
 });
 it("crée une seule absence centrale par personne, jamais par affectation",async()=>{
  const f=fakeDb();
  const saved=await saveMemberAbsence(f.db,memberId,actorId,input());
  assert.equal(saved.ok,true);
  if(saved.ok){assert.equal(saved.created,true);assert.equal(saved.revision,1);}
  assert.equal(f.days.length,1);
  assert.equal(f.days[0].member_id,memberId);
  assert.equal(f.audit.length,1);
  assert.equal(f.audit[0][3],"create");
  assert.equal(f.audit[0][4],null);
  assert.equal(f.audit[0][6],actorId);
  assert.equal(f.sqls.some(s=>s.includes("smn_member_assignment")||s.includes("smn_team")),false);
  assert.equal(f.sqls.at(-1),"COMMIT");
 });
 it("enregistre une correction historique avec avant/après et une révision monotone",async()=>{
  const f=fakeDb();
  const initial=await saveMemberAbsence(f.db,memberId,actorId,input());
  assert.equal(initial.ok,true);
  if(!initial.ok)return;
  const change=input({action:"update",id:initial.id,revision:1,
   categoryId:"training",reason:"Formation interne",isPlanned:false});
  const saved=await saveMemberAbsence(f.db,memberId,actorId,change);
  assert.equal(saved.ok,true);
  if(saved.ok){assert.equal(saved.created,false);assert.equal(saved.revision,2);}
  assert.equal(f.days.length,1);assert.equal(f.days[0].reason,"Formation interne");
  assert.equal(f.days[0].category_id,"training");
  assert.equal(f.audit.length,2);assert.equal(f.audit[1][2],2);
  assert.equal(f.audit[1][3],"update");
  assert.match(String(f.audit[1][4]),/Congés/);
  assert.match(String(f.audit[1][5]),/Formation interne/);
  assert.equal(f.sqls.some(s=>s.includes("capacity")||s.includes("pdf")||
   s.includes("daily")||s.includes("collective")),false);
 });
 it("refuse les modifications concurrentes, les doublons et les membres archivés",async()=>{
  const f=fakeDb();
  const first=await saveMemberAbsence(f.db,memberId,actorId,input());
  assert.equal(first.ok,true);
  if(!first.ok)return;
  const conflict=await saveMemberAbsence(f.db,memberId,actorId,input({
   action:"update",id:first.id,revision:3,reason:"Autre"
  }));
  assert.deepEqual(conflict,{ok:false,error:"conflict"});
  const overlap=await saveMemberAbsence(f.db,memberId,actorId,input({reason:"Deuxième"}));
  assert.deepEqual(overlap,{ok:false,error:"overlap"});
  const archived=await saveMemberAbsence(fakeDb({archived:true}).db,memberId,actorId,input());
  assert.deepEqual(archived,{ok:false,error:"archived"});
 });
 it("permet deux absences sur deux demi-journées distinctes le même jour",async()=>{
  const f=fakeDb();
  const a=await saveMemberAbsence(f.db,memberId,actorId,input({
   startSlot:"morning",endSlot:"morning"
  }));
  const b=await saveMemberAbsence(f.db,memberId,actorId,input({
   startSlot:"afternoon",endSlot:"afternoon",reason:"Autre motif"
  }));
  assert.equal(a.ok,true);assert.equal(b.ok,true);
  const state=await readMemberAbsences(f.db,memberId,"2024-05-01");
  assert.equal(state.onDate.length,2);
  assert.equal(state.absences.length,2);
 });
 it("conserve les catégories et périodes passées en lecture et interdit une catégorie inactive nouvelle",async()=>{
  const f=fakeDb({categories:["leave","other"]});
  const bad=await saveMemberAbsence(f.db,memberId,actorId,input({categoryId:"sick"}));
  assert.deepEqual(bad,{ok:false,error:"category-inactive"});
  const state=await readMemberAbsences(f.db,memberId,"2024-05-01");
  assert.equal(state.categories.length,4);
  assert.equal(state.categories.find(c=>c.id==="sick")?.isActive,false);
  assert.equal(state.absences.length,0);
 });
 it("prépare une migration additive, sans altérer les capacités figées ni les anciens PDF",()=>{
  assert.match(ABSENCE_MIGRATION_SQL,/schema_version=19/);
  assert.match(ABSENCE_MIGRATION_SQL,/CREATE TABLE public.smn_member_absence/);
  assert.match(ABSENCE_MIGRATION_SQL,/CREATE TABLE public.smn_member_absence_history/);
  assert.match(ABSENCE_MIGRATION_SQL,/ON DELETE RESTRICT/);
  assert.doesNotMatch(ABSENCE_MIGRATION_SQL,/DROP TABLE|ON DELETE CASCADE/i);
  assert.doesNotMatch(ABSENCE_MIGRATION_SQL,/pdf|capacity|smn_member_assignment|daily/i);
 });
});
