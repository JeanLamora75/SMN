import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {parseClosure,saveCompanyClosure,listCompanyClosures} from "../src/server/closures/service";
import {CLOSURES_MIGRATION_SQL} from "../src/server/closures/migration";
import {resolveDayAvailability} from "../src/server/members/day-availability";
import {canAccess} from "../src/server/access-policy";

const teamId="team-main",actorId="22222222-2222-4222-8222-222222222222";
const start="2026-05-01";
const valid=(diff:Record<string,unknown>={})=>({
 action:"create",teamId,name:"Pont de l'entreprise",startOn:start,endOn:start,...diff
});
const change=(id:string,revision:number,diff:Record<string,unknown>={})=>({
 action:"update",id,revision,teamId,name:"Pont de l'entreprise",startOn:start,endOn:start,
 isActive:true,...diff
});
type Row={id:string;team_id:string;name:string;start_on:string;end_on:string;
 is_active:boolean;revision:number;created_at:string;updated_at:string};
function fixture(){
 const closures:Row[]=[];
 const audit:unknown[][]=[];
 const calls:string[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  calls.push(sql);
  if(["BEGIN","COMMIT","ROLLBACK"].includes(sql))return {rows:[],rowCount:0};
  if(sql.includes("FROM public.smn_team t")){
   return {rows:[{id:teamId,name:"Équipe principale"}],rowCount:1};
  }
  if(sql.includes("FROM public.smn_company_closure")&&
     sql.includes("WHERE team_id=$1 AND is_active=true")){
   const overlapping=closures.filter(c=>c.team_id===args[0]&&c.is_active&&
    c.id!==args[1]&&c.start_on<=String(args[2])&&c.end_on>=String(args[3]));
   return {rows:overlapping.map(c=>({id:c.id})),rowCount:overlapping.length};
  }
  if(sql.includes("FROM public.smn_company_closure")&&
     sql.includes("WHERE id=$1 AND team_id=$2")){
   const found=closures.filter(c=>c.id===args[0]&&c.team_id===args[1]);
   return {rows:found,rowCount:found.length};
  }
  if(sql.includes("FROM public.smn_company_closure")&&sql.includes("ORDER BY start_on")){
   return {rows:closures,rowCount:closures.length};
  }
  if(sql.includes("INSERT INTO public.smn_company_closure")&&
   !sql.includes("history")){
   closures.push({id:String(args[0]),team_id:String(args[1]),
    name:String(args[2]),start_on:String(args[3]),end_on:String(args[4]),
    is_active:true,revision:1,created_at:"2026-10-21",updated_at:"2026-10-21"});
   return {rows:[],rowCount:1};
  }
  if(sql.includes("UPDATE public.smn_company_closure")){
   const row=closures.find(c=>c.id===args[0]&&c.team_id===args[1]&&
    c.revision===args[7]);
   if(!row)return {rows:[],rowCount:0};
   Object.assign(row,{name:args[2],start_on:args[3],end_on:args[4],
    is_active:args[5],revision:row.revision+1,updated_at:"2026-10-22"});
   return {rows:[],rowCount:1};
  }
  if(sql.includes("INSERT INTO public.smn_company_closure_history")){
   audit.push(args);return {rows:[],rowCount:1};
  }
  throw Error("unexpected SQL "+sql);
 }} as unknown as Client;
 return {db,closures,audit,calls};
}
describe("SMN-56 — fermetures collectives",()=>{
 it("refuse les dates invalides et bornes inversées avant toute écriture",async()=>{
  for(const diff of [
   {startOn:"2026-02-30"},{endOn:"2026-04-30"},
   {startOn:"2026-05-02",endOn:"2026-05-01"},
   {startOn:"not-a-date"},{startOn:"1899-12-31"}
  ]){
   assert.deepEqual(parseClosure(valid(diff)),{ok:false,error:"invalid-date"});
   const f=fixture();
   const result=await saveCompanyClosure(f.db,actorId,valid(diff));
   assert.deepEqual(result,{ok:false,error:"invalid-date"});
   assert.equal(f.calls.length,0);
  }
  assert.deepEqual(parseClosure(valid({name:"  "})),{ok:false,error:"name-required"});
  assert.deepEqual(parseClosure({...valid(),action:"delete"}),{ok:false,error:"invalid-input"});
  assert.deepEqual(parseClosure({...valid(),memberId:actorId}),{ok:false,error:"invalid-input"});
 });
 it("crée une fermeture unique de l'équipe, jamais une absence personnelle",async()=>{
  const f=fixture();
  const result=await saveCompanyClosure(f.db,actorId,valid());
  assert.equal(result.ok,true);
  if(!result.ok)return;
  assert.equal(result.created,true);
  assert.equal(result.closure.teamId,teamId);
  assert.equal(result.closure.revision,1);
  assert.equal(f.closures.length,1);
  assert.equal(f.audit.length,1);
  assert.equal(f.audit[0][3],"create");
  assert.equal(f.audit[0][4],null);
  assert.equal(f.calls.at(-1),"COMMIT");
  assert.equal(f.calls.some(x=>x.includes("smn_member_absence")||
   x.includes("smn_national_holiday")||x.includes("smn_daily")||
   x.includes("pdf")||x.includes("capacity")),false);
 });
 it("refuse un chevauchement entre fermetures actives, autorise des périodes disjointes",async()=>{
  const f=fixture();
  const first=await saveCompanyClosure(f.db,actorId,valid());
  assert.equal(first.ok,true);
  assert.deepEqual(await saveCompanyClosure(f.db,actorId,valid({name:"Double fermeture"})),
   {ok:false,error:"overlap"});
  const second=await saveCompanyClosure(f.db,actorId,valid({
   name:"Autre fermeture",startOn:"2026-05-02",endOn:"2026-05-03"
  }));
  assert.equal(second.ok,true);
  assert.equal(f.closures.length,2);
 });
 it("corrige une fermeture passée par révision et conserve les valeurs avant/après",async()=>{
  const f=fixture();
  const inserted=await saveCompanyClosure(f.db,actorId,valid({startOn:"2020-12-24",endOn:"2020-12-25"}));
  assert.equal(inserted.ok,true);
  if(!inserted.ok)return;
  const edited=await saveCompanyClosure(f.db,actorId,change(inserted.closure.id,1,{
   name:"Fermeture rectifiée",startOn:"2020-12-25",endOn:"2020-12-25"
  }));
  assert.equal(edited.ok,true);
  if(!edited.ok)return;
  assert.equal(edited.created,false);
  assert.equal(edited.closure.id,inserted.closure.id);
  assert.equal(edited.closure.revision,2);
  assert.equal(f.audit.length,2);
  assert.equal(f.audit[1][3],"update");
  assert.match(String(f.audit[1][4]),/2020-12-24/);
  assert.match(String(f.audit[1][5]),/Fermeture rectifiée/);
  assert.equal(f.calls.some(x=>/pdf|capacity|smn_member_absence/i.test(x)),false);
 });
 it("annule sans supprimer et refuse une version concurrente",async()=>{
  const f=fixture();
  const inserted=await saveCompanyClosure(f.db,actorId,valid());
  assert.equal(inserted.ok,true);
  if(!inserted.ok)return;
  const removed=await saveCompanyClosure(f.db,actorId,change(inserted.closure.id,1,{isActive:false}));
  assert.equal(removed.ok,true);
  if(!removed.ok)return;
  assert.equal(removed.closure.isActive,false);
  const outdated=await saveCompanyClosure(f.db,actorId,change(inserted.closure.id,1));
  assert.deepEqual(outdated,{ok:false,error:"conflict"});
  assert.equal(f.closures.length,1);
  assert.equal(f.audit.length,2);
  assert.equal(f.calls.some(s=>/\bDELETE\b/i.test(s)),false);
  const listed=await listCompanyClosures(f.db);
  assert.equal(listed.closures[0].isActive,false);
 });
 it("ne déduit qu'une fois la fermeture et les absences ou jours fériés superposés",()=>{
  const all={startOn:start,endOn:start,startSlot:"morning" as const,endSlot:"afternoon" as const};
  const slots={morning:true,afternoon:true};
  const overlap=resolveDayAvailability(start,slots,true,[all],true);
  assert.deepEqual(overlap.unavailableSlots,slots);
  assert.equal(overlap.deductedHalfDays,2);
  const missingNational=resolveDayAvailability(start,slots,null,[],true);
  assert.equal(missingNational.deductedHalfDays,2);
  assert.equal(missingNational.status,"known");
  assert.deepEqual(missingNational.availableSlots,{morning:false,afternoon:false});
  const nonWorking=resolveDayAvailability(start,{morning:false,afternoon:false},
   false,[],true);
  assert.equal(nonWorking.deductedHalfDays,0);
 });
 it("protége l'administration mais autorise la lecture collective",()=>{
  const user={role:"user",is_active:true,must_change_password:false};
  const admin={role:"admin",is_active:true,must_change_password:false};
  const settings={type:"settings",exists:true,inScope:true};
  assert.equal(canAccess(user,"read",settings),false);
  assert.equal(canAccess(user,"write",settings),false);
  assert.equal(canAccess(admin,"write",settings),true);
  assert.equal(canAccess(user,"read",{type:"collective",exists:true,inScope:true}),true);
 });
 it("migration v20 additive, trace historique et aucune modification d'anciens clichés",()=>{
  assert.match(CLOSURES_MIGRATION_SQL,/schema_version=20/);
  assert.match(CLOSURES_MIGRATION_SQL,/CREATE TABLE public.smn_company_closure/);
  assert.match(CLOSURES_MIGRATION_SQL,/CREATE TABLE public.smn_company_closure_history/);
  assert.doesNotMatch(CLOSURES_MIGRATION_SQL,/DROP TABLE|ON DELETE CASCADE|smn_member_absence|pdf|capacity/i);
 });
});
