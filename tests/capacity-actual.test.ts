import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {periodStatus,realThrough,parseActualChange,parseClosing,
 readActualCapacity,saveActualCapacity,closeActualCapacity}
 from "../src/server/capacity/actual";
import {CAPACITY_ACTUAL_MIGRATION_SQL} from "../src/server/capacity/actual-migration";
import {canAccess} from "../src/server/access-policy";
const teamId="team-main",actor="11111111-1111-4111-8111-111111111111";
const start="2026-10-01",end="2026-10-14",today="2026-10-21";
const eventId="22222222-2222-4222-8222-222222222222";
type FixtureOptions={periodClosed?:boolean;today?:string;initialJh?:number|null};
function fixture(opts:FixtureOptions={}){
 let period:{id:string;closed_at:string|null}|null=opts.periodClosed?
  {id:"p1",closed_at:"2026-10-20T12:00:00+02:00"}:null;
 let manual:{id:string;manual_jh:number|null;revision:number}|null=null;
 let closed:{retained_jh:number|null;reference_jh:number|null;
  provenance:"Saisie"|"Calcul"|"Non renseigné";closed_at:string;event_id:string}|null=null;
 const history:unknown[][]=[],queries:string[]=[];
 const clock=opts.today??today;
 const db={query:async(sql:string,args:unknown[]=[])=>{
  queries.push(sql);
  if(sql.startsWith("BEGIN")||sql==="COMMIT"||sql==="ROLLBACK")return {rows:[],rowCount:0};
  if(sql.includes("FROM public.smn_team t"))return {rows:[{id:teamId}],rowCount:1};
  if(sql.includes("AS today"))return {rows:[{today:clock}],rowCount:1};
  if(sql.includes("FROM public.smn_capacity_initial_snapshot"))
   return {rows:opts.initialJh===undefined?[]:[{
    id:"initial",event_id:"initial-event",period_id:"p1",
    initial_jh:opts.initialJh,provenance:"Calcul",
    actual_opened_at:"2026-10-01",recorded_at:"2026-10-01",manual_revision:null
   }],rowCount:opts.initialJh===undefined?0:1};
  if(sql.includes("FROM public.smn_capacity_period_override")&&
   !sql.includes("history")){
   const valid=period&&(args[0]===teamId||args[0]===period.id);
   return {rows:valid&&period?[{...period}]:[],rowCount:valid?1:0};
  }
  if(sql.includes("FROM public.smn_capacity_actual_override")&&!sql.includes("history")){
   return {rows:manual?[{...manual}]:[],rowCount:manual?1:0};
  }
  if(sql.includes("FROM public.smn_capacity_actual_snapshot")){
   return {rows:closed?[{...closed}]:[],rowCount:closed?1:0};
  }
  if(sql.startsWith("INSERT INTO public.smn_capacity_period_override")){
   period={id:String(args[0]),closed_at:sql.includes("now()")?clock:null};
   return {rows:[],rowCount:1};
  }
  if(sql.startsWith("UPDATE public.smn_capacity_period_override")){
   if(!period||period.closed_at)return {rows:[],rowCount:0};
   period.closed_at=clock;return {rows:[],rowCount:1};
  }
  if(sql.startsWith("INSERT INTO public.smn_capacity_actual_override")&&!sql.includes("history")){
   manual={id:String(args[0]),manual_jh:args[2]===null?null:Number(args[2]),revision:1};
   return {rows:[],rowCount:1};
  }
  if(sql.startsWith("UPDATE public.smn_capacity_actual_override")){
   if(!manual||manual.revision!==args[3])return {rows:[],rowCount:0};
   manual.manual_jh=args[1]===null?null:Number(args[1]);manual.revision++;
   return {rows:[],rowCount:1};
  }
  if(sql.startsWith("INSERT INTO public.smn_capacity_actual_override_history")){
   history.push(args);return {rows:[],rowCount:1};
  }
  if(sql.startsWith("INSERT INTO public.smn_capacity_actual_snapshot")){
   closed={retained_jh:args[3]===null?null:Number(args[3]),
    reference_jh:args[4]===null?null:Number(args[4]),
    provenance:String(args[5]) as "Saisie"|"Calcul"|"Non renseigné",
    closed_at:clock,event_id:String(args[2])};
   return {rows:[{...closed}],rowCount:1};
  }
  throw Error("Unexpected SQL: "+sql);
 }} as unknown as Client;
 const calculate=(value:number|null)=>{
  let calls=0;const fn=async(_:Client,from:string,to:string,extra:{externalTransaction:true;includeExceptionalImpact?:boolean})=>{
   calls++;assert.deepEqual(extra,{externalTransaction:true,includeExceptionalImpact:true});
   return {team:{id:teamId,name:"MVP",mode:"scrum"},start:from,end:to,
    totalJh:value,missing:value===null?[{date:from,memberId:null,source:"work-calendar"}]:[]};
  };
  return {fn:fn as never,get calls(){return calls;}};
 };
 return {db,queries,history,calculate,get period(){return period},
  get manual(){return manual},get closed(){return closed}};
}
describe("SMN-60 — réalisé collectif selon statut métier",()=>{
 it("lecture contextualisée v28 à v30, écriture monoéquipe interdite dès v28",()=>{
  const source=readFileSync(new URL("../src/server/capacity/actual.ts",import.meta.url),"utf8");
  assert.match(source,/i\.schema_version IN \(28,29,30\) AND t\.id=\$1/);
  assert.match(source,/i\.schema_version<=27/);
  assert.match(source,/if\(teams\.rows\.length!==1\)/);
 });
 it("AC1 — période à venir : pas de réalisé, aucune extrapolation, aucune écriture",async()=>{
  assert.equal(periodStatus("2026-10-22","2026-10-29",today,false),"upcoming");
  const f=fixture();
  const calc=f.calculate(99);
  const r=await readActualCapacity(f.db,"2026-10-22","2026-10-29",calc.fn);
  assert.equal(r.status,"upcoming");
  assert.equal(r.retainedJh,null);
  assert.equal(r.referenceJh,null);
  assert.equal(r.observedThrough,null);
  assert.equal(calc.calls,0);
  assert.ok(f.queries.every(q=>q.startsWith("SELECT")||q.startsWith("BEGIN")||q==="COMMIT"));
  assert.deepEqual(await saveActualCapacity(f.db,actor,{
   action:"set",start:"2026-10-22",end:"2026-10-29",revision:0,manualJh:1
  }),{ok:false,error:"future-period"});
 });
 it("AC2 — période en cours : aucun jour courant ou futur présumé réalisé",async()=>{
  const f=fixture({initialJh:30});
  const calc=f.calculate(12);
  const r=await readActualCapacity(f.db,"2026-10-19","2026-10-27",calc.fn);
  assert.equal(r.status,"in-progress");
  assert.equal(r.observedThrough,"2026-10-20");
  assert.equal(r.referenceJh,12);
  assert.equal(r.retainedJh,12);
  assert.equal(r.gapJh,null);
  assert.equal(calc.calls,1);
  assert.equal(realThrough("2026-10-27",today),"2026-10-20");
 });
 it("AC2 — première journée non terminée : pas de réalisé fictif",async()=>{
  const f=fixture();
  const calc=f.calculate(10);
  const r=await readActualCapacity(f.db,"2026-10-21","2026-10-27",calc.fn);
  assert.equal(r.status,"in-progress");
  assert.equal(r.referenceJh,null);
  assert.equal(r.retainedJh,null);
  assert.equal(calc.calls,0);
 });
 it("AC3 — période achevée non clôturée : référence réévaluée et écart si connu",async()=>{
  const f=fixture({initialJh:20});
  const r=await readActualCapacity(f.db,start,end,f.calculate(18).fn);
  assert.equal(r.status,"finished");
  assert.equal(r.observedThrough,end);
  assert.equal(r.referenceJh,18);
  assert.equal(r.gapJh,-2);
  const absent=await readActualCapacity(fixture({initialJh:null}).db,
   start,end,fixture().calculate(18).fn);
  assert.equal(absent.gapJh,null);
 });
 it("AC4 — saisie manuelle réelle 0 reste prioritaire après recalcul",async()=>{
  const f=fixture({initialJh:20});
  assert.deepEqual(await saveActualCapacity(f.db,actor,{
   action:"set",start,end,revision:0,manualJh:0
  }),{ok:true,revision:1});
  const first=await readActualCapacity(f.db,start,end,f.calculate(18).fn);
  const later=await readActualCapacity(f.db,start,end,f.calculate(16).fn);
  assert.equal(first.source,"Saisie");
  assert.equal(first.retainedJh,0);
  assert.equal(later.retainedJh,0);
  assert.equal(later.referenceJh,16);
  assert.equal(later.gapJh,-20);
  assert.equal(f.history.length,1);
  assert.equal(f.history[0][5],0);
 });
 it("AC4 — effacement manuel explicite rétablit le calcul fiable",async()=>{
  const f=fixture();
  await saveActualCapacity(f.db,actor,{action:"set",start,end,revision:0,manualJh:22});
  assert.deepEqual(await saveActualCapacity(f.db,actor,{action:"clear",start,end,revision:1}),
   {ok:true,revision:2});
  const r=await readActualCapacity(f.db,start,end,f.calculate(18).fn);
  assert.equal(r.manualJh,null);
  assert.equal(r.retainedJh,18);
  assert.equal(r.source,"Calcul");
  assert.equal(f.history.length,2);
  assert.equal(f.history[1][4],22);
  assert.equal(f.history[1][5],null);
 });
 it("AC5 — clôture prend un cliché immuable et un rejeu ne recalcule pas",async()=>{
  const f=fixture({initialJh:20});
  await saveActualCapacity(f.db,actor,{action:"set",start,end,revision:0,manualJh:0});
  const calc=f.calculate(18);
  const raw={start,end,eventId};
  const one=await closeActualCapacity(f.db,actor,raw,calc.fn);
  assert.equal(one.ok,true);
  if(!one.ok)return;
  assert.equal(one.alreadyClosed,false);
  assert.equal(one.result.retainedJh,0);
  assert.equal(one.result.referenceJh,18);
  assert.equal(one.result.gapJh,-20);
  const replay=await closeActualCapacity(f.db,actor,raw,f.calculate(999).fn);
  assert.equal(replay.ok,true);
  if(!replay.ok)return;
  assert.equal(replay.alreadyClosed,true);
  assert.equal(replay.result.retainedJh,0);
  assert.equal(replay.result.referenceJh,18);
  assert.equal(calc.calls,1);
  const frozen=await readActualCapacity(f.db,start,end,f.calculate(999).fn);
  assert.equal(frozen.status,"closed");
  assert.equal(frozen.retainedJh,0);
  assert.equal(frozen.referenceJh,18);
  assert.deepEqual(await saveActualCapacity(f.db,actor,{
   action:"set",start,end,revision:1,manualJh:33
  }),{ok:false,error:"protected"});
 });
 it("AC5 — clôture sans valeur fiable reste non renseignée, sans zéro fictif",async()=>{
  const f=fixture({initialJh:20});
  const r=await closeActualCapacity(f.db,actor,{start,end,eventId},f.calculate(null).fn);
  assert.equal(r.ok,true);
  if(!r.ok)return;
  assert.equal(r.result.retainedJh,null);
  assert.equal(r.result.source,"Non renseigné");
  assert.equal(r.result.gapJh,null);
 });
 it("une clôture anticipée est refusée avant écriture",async()=>{
  const f=fixture();
  const r=await closeActualCapacity(f.db,actor,{
   start:"2026-10-21",end:"2026-10-27",eventId
  },f.calculate(5).fn);
  assert.deepEqual(r,{ok:false,error:"not-finished"});
  assert.equal(f.closed,null);
 });
 it("valide strictement les montants, zéro, dates et événements",()=>{
  assert.equal(parseActualChange({action:"set",start,end,revision:0,manualJh:0})?.manualJh,0);
  assert.equal(parseActualChange({action:"set",start,end,revision:0,manualJh:null}),null);
  assert.equal(parseActualChange({action:"set",start,end,revision:0,manualJh:-1}),null);
  assert.equal(parseActualChange({action:"set",start,end,revision:0,manualJh:1.00001}),null);
  assert.equal(parseActualChange({action:"clear",start,end,revision:0,manualJh:0}),null);
  assert.equal(parseClosing({start,end,eventId})?.eventId,eventId);
  assert.equal(parseClosing({start,end,eventId:"bad"}),null);
  assert.equal(parseClosing({start:"2026-02-30",end,eventId}),null);
 });
 it("confidentialité administrateur et absence de notation individuelle",()=>{
  const resource={type:"members",exists:true,inScope:true};
  assert.equal(canAccess({role:"admin",is_active:true,must_change_password:false},
   "write",resource),true);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},
   "read",resource),false);
 });
 it("schéma v24 avec clôture immuable, aucun PDF ni engagement initial modifié",()=>{
  assert.match(CAPACITY_ACTUAL_MIGRATION_SQL,/schema_version=24/);
  assert.match(CAPACITY_ACTUAL_MIGRATION_SQL,/BEFORE UPDATE OR DELETE/);
  assert.match(CAPACITY_ACTUAL_MIGRATION_SQL,/reference_jh/);
  assert.doesNotMatch(CAPACITY_ACTUAL_MIGRATION_SQL,/DROP TABLE|ON DELETE CASCADE|pdf/i);
 });
});
