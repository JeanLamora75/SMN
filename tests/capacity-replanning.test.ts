import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {parseReplanning,parseConfirmation,capacityDelta,
 previewReplanning,confirmReplanning,type ReplanningPreview}
 from "../src/server/capacity/replanning";
import {CAPACITY_REPLANNING_MIGRATION_SQL}
 from "../src/server/capacity/replanning-migration";
import {canAccess} from "../src/server/access-policy";

const actor="11111111-1111-4111-8111-111111111111";
const eventId="22222222-2222-4222-8222-222222222222";
const dates={oldStart:"2026-11-02",oldEnd:"2026-11-13",
 newStart:"2026-11-04",newEnd:"2026-11-17"};
const from=(j:number|null)=>({team:{id:"team-main",name:"MVP",mode:"scrum"},
 start:dates.oldStart,end:dates.oldEnd,totalJh:j,
 missing:j===null?[{source:"work-calendar",memberId:"m1",date:dates.oldStart}]:[]});
function fixture(options:{manual?:number|null;actual?:number|null;frozen?:boolean;
 closed?:boolean;targetOccupied?:boolean;noPeriod?:boolean}={}){
 let row:{id:string;manual_jh:number|null;revision:number;frozen_at:string|null;
  closed_at:string|null}|null=options.noPeriod?null:{
  id:"source-period",manual_jh:options.manual??null,revision:1,
  frozen_at:options.frozen?"2026-10-21":null,
  closed_at:options.closed?"2026-10-21":null};
 let plan:{id:string;period_id:string;target_start_on:string;
  target_end_on:string;revision:number}|null=null;
 let saved:{confirmed_values:ReplanningPreview;period_id:string;event_id:string}|null=null;
 const queries:string[]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  queries.push(sql);
  if(sql.startsWith("BEGIN")||["COMMIT","ROLLBACK"].includes(sql))
   return {rows:[],rowCount:0};
  if(sql.includes("FROM public.smn_team t"))
   return {rows:[{id:"team-main"}],rowCount:1};
  if(sql.includes("FROM public.smn_capacity_initial_snapshot"))
   return {rows:[{initial_jh:40,provenance:"Saisie"}],rowCount:1};
  if(sql.includes("FROM public.smn_capacity_actual_override"))
   return {rows:[{manual_jh:options.actual??null}],rowCount:1};
  if(sql.startsWith("SELECT id,manual_jh::float8")&&
   sql.includes("smn_capacity_period_override"))
   return {rows:row?[{...row}]:[],rowCount:row?1:0};
  if(sql.startsWith("SELECT id FROM public.smn_capacity_period_override")){
   return {rows:options.targetOccupied?[{id:"another-period"}]:[],rowCount:options.targetOccupied?1:0};
  }
  if(sql.startsWith("SELECT id,period_id,target_start_on::text")){
   return {rows:plan?[{...plan}]:[],rowCount:plan?1:0};
  }
  if(sql.startsWith("SELECT h.confirmed_values")){
   return {rows:saved?.event_id===args[0]?[{...saved}]:[],
    rowCount:saved?.event_id===args[0]?1:0};
  }
  if(sql.startsWith("INSERT INTO public.smn_capacity_period_override")){
   row={id:String(args[0]),manual_jh:null,revision:1,frozen_at:null,closed_at:null};
   return {rows:[],rowCount:1};
  }
  if(sql.startsWith("INSERT INTO public.smn_capacity_replanning_history")){
   saved={confirmed_values:JSON.parse(String(args[5])) as ReplanningPreview,
    period_id:"source-period",event_id:String(args[3])};
   return {rows:[],rowCount:1};
  }
  if(sql.startsWith("INSERT INTO public.smn_capacity_replanning")){
   plan={id:String(args[0]),period_id:String(args[1]),
    target_start_on:String(args[2]),target_end_on:String(args[3]),revision:1};
   return {rows:[],rowCount:1};
  }
  if(sql.startsWith("UPDATE public.smn_capacity_replanning")){
   if(!plan||plan.revision!==args[4])return {rows:[],rowCount:0};
   plan.target_start_on=String(args[1]);plan.target_end_on=String(args[2]);
   plan.revision++;return {rows:[],rowCount:1};
  }
  throw Error("Unexpected SQL "+sql+" "+JSON.stringify(args));
 }} as unknown as Client;
 const calc=(a:number|null,b:number|null,throwError=false)=>{
  let calls=0;
  const fn=async(_:Client,start:string,end:string,opts:{externalTransaction:true})=>{
   calls++;assert.equal(opts.externalTransaction,true);
   if(throwError)throw Error("unavailable");
   return {...from(start===dates.oldStart&&end===dates.oldEnd?a:b),
    start,end} as never;
  };
  return {fn,get calls(){return calls}};
 };
 return {db,queries,calc,get plan(){return plan},get saved(){return saved},
  changeManual(value:number|null){if(row){row.manual_jh=value;row.revision++;}}};
}
describe("SMN-62 — prévisualiser une replanification sans écraser les capacités",()=>{
 it("refuse le sélecteur monoéquipe dès le schéma v28, sans choisir une équipe arbitraire",()=>{
  const source=readFileSync(new URL("../src/server/capacity/replanning.ts",import.meta.url),"utf8");
  assert.match(source,/i\.schema_version<=27/);
  assert.match(source,/teams\.rows\.length!==1/);
 });
 it("AC1 — calcule Avant 30, Après 28, écart -2 sans écriture",async()=>{
  const f=fixture();
  const result=await previewReplanning(f.db,dates,f.calc(30,28).fn);
  assert.equal(result.ok,true);
  if(!result.ok)return;
  assert.equal(result.preview.before.jh,30);
  assert.equal(result.preview.after.jh,28);
  assert.equal(result.preview.referenceDeltaJh,-2);
  assert.equal(result.preview.canConfirm,true);
  assert.equal(result.preview.retainedBeforeJh,30);
  assert.ok(f.queries.every(s=>s.startsWith("SELECT")||
   s.startsWith("BEGIN")||s==="COMMIT"));
  assert.equal(f.plan,null);
 });
 it("période seulement calculée : aucune création au GET, source créée au POST",async()=>{
  const f=fixture({noPeriod:true});
  const before=await previewReplanning(f.db,dates,f.calc(30,28).fn);
  assert.equal(before.ok,true);if(!before.ok)return;
  assert.equal(before.preview.manualPlannedJh,null);
  assert.equal(before.preview.referenceDeltaJh,-2);
  assert.equal(f.queries.some(q=>q.includes("INSERT INTO")),false);
  const outcome=await confirmReplanning(f.db,actor,{
   ...dates,previewDigest:before.preview.previewDigest,revision:0,eventId
  },f.calc(30,28).fn);
  assert.equal(outcome.ok,true);
  assert.equal(f.queries.filter(q=>q.startsWith(
   "INSERT INTO public.smn_capacity_period_override")).length,1);
  assert.equal(f.queries.some(q=>q.startsWith(
   "UPDATE public.smn_capacity_initial_snapshot")),false);
 });
 it("AC2 — initiale figée 40 JH inchangée après confirmation et recalcul",async()=>{
  const f=fixture({frozen:true});
  const preview=await previewReplanning(f.db,dates,f.calc(30,28).fn);
  assert.equal(preview.ok,true);
  if(!preview.ok)return;
  assert.equal(preview.preview.initialFrozenJh,40);
  const confirmation=await confirmReplanning(f.db,actor,{
   ...dates,previewDigest:preview.preview.previewDigest,
   revision:preview.preview.revision,eventId
  },f.calc(30,28).fn);
  assert.equal(confirmation.ok,true);
  if(!confirmation.ok)return;
  assert.equal(confirmation.preview.initialFrozenJh,40);
  assert.equal(f.plan?.revision,1);
  assert.equal(f.queries.some(s=>/UPDATE public.smn_capacity_initial_snapshot/.test(s)),false);
 });
 it("AC3 — saisies manuelles prévues et réelles, y compris zéro, jamais écrasées",async()=>{
  const f=fixture({manual:0,actual:17});
  const before=await previewReplanning(f.db,dates,f.calc(30,28).fn);
  assert.equal(before.ok,true);
  if(!before.ok)return;
  assert.equal(before.preview.manualPlannedJh,0);
  assert.equal(before.preview.manualActualJh,17);
  assert.equal(before.preview.retainedBeforeJh,0);
  assert.equal(before.preview.proposedRetainedAfterJh,0);
  const yes=await confirmReplanning(f.db,actor,{
   ...dates,revision:0,eventId,previewDigest:before.preview.previewDigest
  },f.calc(30,28).fn);
  assert.equal(yes.ok,true);
  assert.ok(f.queries.filter(s=>/INSERT INTO|UPDATE public/.test(s)).every(s=>
   s.includes("smn_capacity_replanning")));
  assert.equal(f.queries.some(s=>/UPDATE public.smn_capacity_period_override/.test(s)),false);
  assert.equal(f.queries.some(s=>/UPDATE public.smn_capacity_actual_override/.test(s)),false);
 });
 it("AC4 — période clôturée : prévisualisation bloquée en confirmation",async()=>{
  const f=fixture({closed:true});
  const before=await previewReplanning(f.db,dates,f.calc(30,28).fn);
  assert.equal(before.ok,true);
  if(!before.ok)return;
  assert.equal(before.preview.canConfirm,false);
  assert.ok(before.preview.blockers.includes("closed"));
  const result=await confirmReplanning(f.db,actor,{
   ...dates,revision:0,eventId,previewDigest:before.preview.previewDigest
  },f.calc(30,28).fn);
  assert.deepEqual(result,{ok:false,error:"closed"});
  assert.equal(f.saved,null);
 });
 it("AC4 — destination déjà porteuse de données : refus, pas de fusion silencieuse",async()=>{
  const f=fixture({targetOccupied:true});
  const before=await previewReplanning(f.db,dates,f.calc(30,28).fn);
  assert.equal(before.ok,true);
  if(!before.ok)return;
  assert.equal(before.preview.canConfirm,false);
  const result=await confirmReplanning(f.db,actor,{
   ...dates,revision:0,eventId,previewDigest:before.preview.previewDigest
  },f.calc(30,28).fn);
  assert.deepEqual(result,{ok:false,error:"target-in-use"});
  assert.equal(f.plan,null);
 });
 it("AC5 — données de référence manquantes : Non calculable, delta absent, pas de confirmation",async()=>{
  const f=fixture({manual:32});
  const before=await previewReplanning(f.db,dates,f.calc(30,null).fn);
  assert.equal(before.ok,true);
  if(!before.ok)return;
  assert.equal(before.preview.after.status,"not-calculable");
  assert.equal(before.preview.after.jh,null);
  assert.equal(before.preview.referenceDeltaJh,null);
  assert.equal(before.preview.canConfirm,false);
  const result=await confirmReplanning(f.db,actor,{
   ...dates,revision:0,eventId,previewDigest:before.preview.previewDigest
  },f.calc(30,null).fn);
  assert.deepEqual(result,{ok:false,error:"not-calculable"});
  assert.equal(f.plan,null);
 });
 it("AC5 — une exception de calcul n'est jamais enregistrée",async()=>{
  const f=fixture();
  const p=await previewReplanning(f.db,dates,f.calc(30,28,true).fn);
  assert.deepEqual(p,{ok:false,error:"calculation-error"});
  assert.equal(f.queries.at(-1),"ROLLBACK");
  assert.equal(f.plan,null);
 });
 it("AC5 — référence recalculée changée entre lecture et confirmation : conflit",async()=>{
  const f=fixture();
  const p=await previewReplanning(f.db,dates,f.calc(30,28).fn);
  assert.equal(p.ok,true);if(!p.ok)return;
  const updated=await confirmReplanning(f.db,actor,{
   ...dates,revision:0,eventId,previewDigest:p.preview.previewDigest
  },f.calc(30,27).fn);
  assert.deepEqual(updated,{ok:false,error:"conflict"});
  assert.equal(f.plan,null);
 });
 it("une capacité manuelle changée après prévisualisation invalide l'empreinte",async()=>{
  const f=fixture({manual:32});
  const p=await previewReplanning(f.db,dates,f.calc(30,28).fn);
  assert.equal(p.ok,true);if(!p.ok)return;
  f.changeManual(0);
  const updated=await confirmReplanning(f.db,actor,{
   ...dates,revision:0,eventId,previewDigest:p.preview.previewDigest
  },f.calc(30,28).fn);
  assert.deepEqual(updated,{ok:false,error:"conflict"});
 });
 it("un rejeu du même événement retourne la confirmation d'origine sans nouvelle écriture",async()=>{
  const f=fixture();
  const p=await previewReplanning(f.db,dates,f.calc(30,28).fn);
  assert.equal(p.ok,true);if(!p.ok)return;
  const input={...dates,revision:0,eventId,previewDigest:p.preview.previewDigest};
  const first=await confirmReplanning(f.db,actor,input,f.calc(30,28).fn);
  const second=await confirmReplanning(f.db,actor,input,f.calc(30,999,true).fn);
  assert.equal(first.ok,true);assert.equal(second.ok,true);
  if(!first.ok||!second.ok)return;
  assert.equal(second.alreadyConfirmed,true);
  assert.deepEqual(second.preview,first.preview);
  assert.equal(f.queries.filter(s=>s.startsWith(
   "INSERT INTO public.smn_capacity_replanning_history")).length,1);
 });
 it("rejette période identique, dates invalides et champs non autorisés",()=>{
  assert.equal(parseReplanning({...dates,newStart:dates.oldStart,newEnd:dates.oldEnd})?.newStart,dates.oldStart);
  assert.equal(parseReplanning({...dates,newEnd:"2026-02-30"}),null);
  assert.equal(parseReplanning({...dates,extra:true}),null);
  assert.equal(parseConfirmation({...dates,revision:0,previewDigest:"x",eventId}),null);
  assert.equal(parseConfirmation({...dates,revision:0,previewDigest:"a".repeat(64),eventId})?.eventId,eventId);
  assert.equal(capacityDelta(null,30),null);
  assert.equal(capacityDelta(0,0),0);
 });
 it("migration v26 auditable, non destructive et droits Administrateur",()=>{
  assert.match(CAPACITY_REPLANNING_MIGRATION_SQL,/schema_version=26/);
  assert.match(CAPACITY_REPLANNING_MIGRATION_SQL,/BEFORE UPDATE OR DELETE/);
  assert.match(CAPACITY_REPLANNING_MIGRATION_SQL,/preview_digest/);
  assert.doesNotMatch(CAPACITY_REPLANNING_MIGRATION_SQL,/DROP TABLE|ON DELETE CASCADE|pdf/i);
  const resource={type:"members",exists:true,inScope:true};
  assert.equal(canAccess({role:"admin",is_active:true,must_change_password:false},
   "write",resource),true);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},
   "write",resource),false);
 });
});
