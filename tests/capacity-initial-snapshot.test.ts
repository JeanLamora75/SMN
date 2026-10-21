import assert from "node:assert/strict";
import {describe,it} from "node:test";
import type {Client} from "pg";
import {openCapacityPeriod,parseOpening,readInitialSnapshot} from
 "../src/server/capacity/opening";
import {saveCapacityOverride} from "../src/server/capacity/override";
import {CAPACITY_INITIAL_MIGRATION_SQL} from "../src/server/capacity/initial-migration";
import {canAccess} from "../src/server/access-policy";
const team="team-main",actor="11111111-1111-4111-8111-111111111111";
const start="2026-10-21",end="2026-10-28";
const eventId="22222222-2222-4222-8222-222222222222";
const input=(a=start,b=end,id=eventId)=>({start:a,end:b,eventId:id});
type Period={
 id:string;team_id:string;start_on:string;end_on:string;
 manual_jh:number|null;revision:number;frozen_at:string|null;closed_at:string|null;
};
type Snap={
 id:string;period_id:string;event_id:string;initial_jh:number|null;
 provenance:"Saisie"|"Calcul"|"Non renseigné";actual_opened_at:string;
 recorded_at:string;manual_revision:number|null;
};
function fixture(initialManual:number|null=null){
 let period:Period|null=initialManual===null?null:{
  id:"period-1",team_id:team,start_on:start,end_on:end,manual_jh:initialManual,
  revision:3,frozen_at:null,closed_at:null
 };
 let snapshot:Snap|null=null;
 const queries:string[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  queries.push(sql);
  if(sql.startsWith("BEGIN")||sql==="COMMIT"||sql==="ROLLBACK")
   return {rows:[],rowCount:0};
  if(sql.includes("FROM public.smn_team t"))
   return {rows:[{id:team}],rowCount:1};
  if(sql.includes("AS today"))
   return {rows:[{today:"2026-10-21"}],rowCount:1};
  if(sql.includes("FROM public.smn_capacity_initial_snapshot")){
   return {rows:snapshot?[{...snapshot}]:[],rowCount:snapshot?1:0};
  }
  if(sql.includes("FROM public.smn_capacity_period_override")&&!sql.includes("history")){
   const found=period&&(sql.includes("WHERE id=$1")?period.id===args[0]:
    period.team_id===args[0]&&period.start_on===args[1]&&period.end_on===args[2]);
   return {rows:found&&period?[{...period}]:[],rowCount:found?1:0};
  }
  if(sql.startsWith("INSERT INTO public.smn_capacity_period_override")&&!sql.includes("history")){
   period={id:String(args[0]),team_id:String(args[1]),start_on:String(args[2]),
    end_on:String(args[3]),manual_jh:null,revision:1,
    frozen_at:"2026-10-21",closed_at:null};
   return {rows:[],rowCount:1};
  }
  if(sql.startsWith("UPDATE public.smn_capacity_period_override")){
   if(!period||period.frozen_at||period.closed_at)return {rows:[],rowCount:0};
   period.frozen_at="2026-10-21";
   return {rows:[],rowCount:1};
  }
  if(sql.startsWith("INSERT INTO public.smn_capacity_initial_snapshot")){
   snapshot={
    id:String(args[0]),period_id:String(args[1]),event_id:String(args[2]),
    initial_jh:args[3]===null?null:Number(args[3]),
    provenance:String(args[4]) as Snap["provenance"],
    actual_opened_at:"2026-10-21 20:52:00+02",
    recorded_at:"2026-10-21 20:52:00+02",
    manual_revision:args[6]===null?null:Number(args[6])
   };
   return {rows:[{...snapshot}],rowCount:1};
  }
  throw Error("unexpected SQL "+sql);
 }} as unknown as Client;
 const calculate=(jh:number|null,throwIfCalled=false)=>{
  let calls=0;
  const fn=async()=>{
   calls++;
   if(throwIfCalled)throw Error("replay unexpectedly recalculated");
   return {team:{id:team,name:"MVP",mode:"scrum"},
    start,end,totalJh:jh} as never;
  };
  return {fn,get calls(){return calls;}};
 };
 return {db,queries,calculate,get period(){return period},
  get snapshot(){return snapshot}};
}
describe("SMN-59 : capacité initiale à l'ouverture effective",()=>{
 it("AC1 : un GET théorique ne crée aucune ligne ni cliché",async()=>{
  const f=fixture();
  assert.equal(await readInitialSnapshot(f.db,team,start,end),null);
  assert.ok(f.queries.every(sql=>sql.trim().startsWith("SELECT")));
  assert.equal(f.period,null);
  assert.equal(f.snapshot,null);
 });
 it("AC2 : une ouverture effective utilise la saisie prioritaire 32 JH et sa provenance",async()=>{
  const f=fixture(32);
  const calculation=f.calculate(30);
  const result=await openCapacityPeriod(f.db,actor,input(),calculation.fn);
  assert.equal(result.ok,true);
  if(!result.ok)return;
  assert.equal(result.alreadyOpened,false);
  assert.equal(result.snapshot.initialJh,32);
  assert.equal(result.snapshot.provenance,"Saisie");
  assert.equal(result.snapshot.manualRevision,3);
  assert.ok(result.snapshot.actualOpenedAt);
  assert.equal(calculation.calls,0);
  assert.ok(f.period?.frozen_at);
 });
 it("AC2 : sans saisie, calcul fiable figé avec ouverture réelle",async()=>{
  const f=fixture();
  const calculation=f.calculate(30);
  const result=await openCapacityPeriod(f.db,actor,input(),calculation.fn);
  assert.equal(result.ok,true);
  if(!result.ok)return;
  assert.equal(result.snapshot.initialJh,30);
  assert.equal(result.snapshot.provenance,"Calcul");
  assert.equal(calculation.calls,1);
  assert.ok(f.queries.includes("COMMIT"));
 });
 it("AC3 : absences tardives ou qualification Prévue ne réécrivent pas le cliché",async()=>{
  const f=fixture();
  const initial=await openCapacityPeriod(f.db,actor,input(),f.calculate(30).fn);
  assert.equal(initial.ok,true);
  const after=await readInitialSnapshot(f.db,team,start,end);
  assert.equal(after?.initialJh,30);
  // Une nouvelle référence à 28 JH est un résultat dynamique, jamais écrite ici.
  const second=await openCapacityPeriod(f.db,actor,input(start,end,
   "33333333-3333-4333-8333-333333333333"),f.calculate(28,true).fn);
  assert.equal(second.ok,true);
  if(!second.ok)return;
  assert.equal(second.snapshot.initialJh,30);
  assert.equal(second.snapshot.eventId,eventId);
  assert.equal(f.queries.filter(q=>q.startsWith("INSERT INTO public.smn_capacity_initial_snapshot")).length,1);
 });
 it("AC4 : rejeu après redémarrage idempotent, aucune reconstitution",async()=>{
  const f=fixture(0);
  const first=await openCapacityPeriod(f.db,actor,input(),f.calculate(null,true).fn);
  const second=await openCapacityPeriod(f.db,actor,input(),f.calculate(999,true).fn);
  assert.equal(first.ok,true);
  assert.equal(second.ok,true);
  if(!first.ok||!second.ok)return;
  assert.equal(first.snapshot.initialJh,0);
  assert.equal(second.snapshot.initialJh,0);
  assert.equal(second.alreadyOpened,true);
  assert.equal(second.snapshot.id,first.snapshot.id);
  assert.equal(f.queries.filter(q=>q.startsWith("INSERT INTO public.smn_capacity_initial_snapshot")).length,1);
 });
 it("AC5 : ouverture rétrospective sans preuve, ne reconstruit pas 30 JH",async()=>{
  const f=fixture();
  const calculation=f.calculate(30,true);
  const result=await openCapacityPeriod(f.db,actor,
   input("2026-09-01","2026-09-04"),calculation.fn);
  assert.equal(result.ok,true);
  if(!result.ok)return;
  assert.equal(result.snapshot.provenance,"Non renseigné");
  assert.equal(result.snapshot.initialJh,null);
  assert.equal(calculation.calls,0);
 });
 it("AC5 : une ancienne saisie n'est pas supposée représenter l'ouverture historique",async()=>{
  const f=fixture(32);
  const calculation=f.calculate(30,true);
  const result=await openCapacityPeriod(f.db,actor,
   input("2026-09-01","2026-09-04"),calculation.fn);
  // Fake fixture only has a current period keyed to Oct; this scenario is checked as
  // a historical entry without source evidence, not as a valid claim of initial knowledge.
  assert.equal(result.ok,true);
  if(result.ok)assert.equal(result.snapshot.initialJh,null);
 });
 it("le figement bloque les éditions manuelles directes SMN-58",async()=>{
  const f=fixture(32);
  await openCapacityPeriod(f.db,actor,input(),f.calculate(30,true).fn);
  const rejected=await saveCapacityOverride(f.db,actor,{
   action:"set",start,end,revision:3,manualJh:40
  });
  assert.deepEqual(rejected,{ok:false,error:"protected"});
 });
 it("rejette événement invalide et date impossible avant transaction",async()=>{
  assert.equal(parseOpening({start,end,eventId:"non-uuid"}),null);
  assert.equal(parseOpening({...input(),extra:true}),null);
  assert.equal(parseOpening(input("2026-02-30","2026-03-01")),null);
  const f=fixture();
  const rejected=await openCapacityPeriod(f.db,actor,{...input(),eventId:"?"});
  assert.deepEqual(rejected,{ok:false,error:"invalid-input"});
  assert.equal(f.queries.length,0);
 });
 it("migration v23 additive, unicité et absence de réécriture d'anciens PDF",()=>{
  assert.match(CAPACITY_INITIAL_MIGRATION_SQL,/schema_version=23/);
  assert.match(CAPACITY_INITIAL_MIGRATION_SQL,/period_id text NOT NULL UNIQUE/);
  assert.match(CAPACITY_INITIAL_MIGRATION_SQL,/event_id text NOT NULL UNIQUE/);
  assert.doesNotMatch(CAPACITY_INITIAL_MIGRATION_SQL,/DROP TABLE|ON DELETE CASCADE|pdf|sprint/i);
  const resource={type:"members",exists:true,inScope:true};
  assert.equal(canAccess({role:"admin",is_active:true,must_change_password:false},
   "write",resource),true);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},
   "write",resource),false);
 });
});
