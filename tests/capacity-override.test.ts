import assert from "node:assert/strict";
import {describe,it} from "node:test";
import {readFileSync} from "node:fs";
import type {Client} from "pg";
import {chooseCapacity,parseCapacityOverride,readCapacityOverride,
 saveCapacityOverride,type OverrideRow} from "../src/server/capacity/override";
import {CAPACITY_OVERRIDE_MIGRATION_SQL} from "../src/server/capacity/override-migration";
import {canAccess} from "../src/server/access-policy";
const start="2026-10-01",end="2026-10-14",teamId="team-main";
const actor="11111111-1111-4111-8111-111111111111";
const mkReport=(totalJh:number|null)=>({
 start,end,totalJh,team:{id:teamId,name:"MVP",mode:"scrum" as const}
});
const set=(manualJh:unknown,revision=0)=>({
 action:"set",start,end,manualJh,revision
});
const clear=(revision=1)=>({action:"clear",start,end,revision});
function fakeDb(){
 let row:OverrideRow|undefined;
 const queries:string[]=[];
 const audit:unknown[][]=[];
 const db={query:async(sql:string,args:unknown[]=[])=>{
  queries.push(sql);
  if(["BEGIN","COMMIT","ROLLBACK"].includes(sql))return {rows:[],rowCount:0};
  if(sql.includes("FROM public.smn_team t"))
   return {rows:[{id:teamId}],rowCount:1};
  if(sql.includes("FROM public.smn_capacity_period_override")&&
    !sql.includes("history")){
   const present=row&&(sql.includes("WHERE id=$1")?row.id===args[0]:
    row.team_id===args[0]&&row.start_on===args[1]&&row.end_on===args[2]);
   return {rows:present&&row?[{...row}]:[],rowCount:present?1:0};
  }
  if(sql.startsWith("INSERT INTO public.smn_capacity_period_override")&&
   !sql.includes("history")){
   row={id:String(args[0]),team_id:String(args[1]),start_on:String(args[2]),
    end_on:String(args[3]),manual_jh:Number(args[4]),revision:1,
    frozen_at:null,closed_at:null,updated_at:"2026-10-21"};
   return {rows:[],rowCount:1};
  }
  if(sql.startsWith("UPDATE public.smn_capacity_period_override")){
   if(!row||row.revision!==args[3]||row.frozen_at||row.closed_at)
    return {rows:[],rowCount:0};
   row.manual_jh=args[1]===null?null:Number(args[1]);
   row.revision++;row.updated_at="2026-10-22";
   return {rows:[],rowCount:1};
  }
  if(sql.startsWith("INSERT INTO public.smn_capacity_period_override_history")){
   audit.push(args);return {rows:[],rowCount:1};
  }
  throw Error("Unexpected SQL "+sql);
 }} as unknown as Client;
 const setLock=(kind:"frozen"|"closed")=>{
  assert.ok(row);
  if(kind==="frozen")row.frozen_at="2026-10-21";
  else row.closed_at="2026-10-21";
 };
 return {db,queries,audit,get row(){return row},setLock};
}
describe("SMN-58 : capacité manuelle prioritaire",()=>{
 it("refuse les écritures historiques de capacité prévue en schéma multiéquipes",()=>{
  const source=readFileSync(new URL("../src/server/capacity/override.ts",import.meta.url),"utf8");
  assert.match(source,/i\.schema_version<=27/);
  assert.match(source,/t\.rows\.length!==1/);
 });
 it("AC1 : conserve 32 JH saisis et affiche la référence 30 et la provenance Saisie",async()=>{
  const f=fakeDb();
  const created=await saveCapacityOverride(f.db,actor,set(32));
  assert.equal(created.ok,true);
  const result=await readCapacityOverride(f.db,mkReport(30) as never);
  assert.equal(result.retainedJh,32);
  assert.equal(result.manualJh,32);
  assert.equal(result.referenceJh,30);
  assert.equal(result.source,"Saisie");
  assert.equal(result.revision,1);
  assert.equal(f.audit.length,1);
  assert.equal(f.audit[0][3],"set");
  assert.equal(f.audit[0][4],null);
  assert.equal(f.audit[0][5],32);
 });
 it("AC2 : recalcul tardif 30 à 28 ne remplace pas 32 JH manuels",async()=>{
  const f=fakeDb();
  await saveCapacityOverride(f.db,actor,set(32));
  const revised=await readCapacityOverride(f.db,mkReport(28) as never);
  assert.equal(revised.retainedJh,32);
  assert.equal(revised.referenceJh,28);
  assert.equal(revised.source,"Saisie");
  assert.equal(f.audit.length,1);
 });
 it("AC3 : saisie explicite 0 JH est distincte de la valeur absente",async()=>{
  const f=fakeDb();
  const before=await readCapacityOverride(f.db,mkReport(30) as never);
  assert.equal(before.manualJh,null);
  assert.equal(before.retainedJh,30);
  const created=await saveCapacityOverride(f.db,actor,set(0));
  assert.equal(created.ok,true);
  const after=await readCapacityOverride(f.db,mkReport(30) as never);
  assert.equal(after.manualJh,0);
  assert.equal(after.retainedJh,0);
  assert.equal(after.source,"Saisie");
  assert.equal(f.audit[0][5],0);
  assert.deepEqual(parseCapacityOverride(set(null)),{ok:false,error:"invalid-input"});
  assert.deepEqual(parseCapacityOverride(set("")),{ok:false,error:"invalid-input"});
 });
 it("AC4 : effacement volontaire restaure le calcul et historise l'avant/après",async()=>{
  const f=fakeDb();
  await saveCapacityOverride(f.db,actor,set(32));
  const cleared=await saveCapacityOverride(f.db,actor,clear(1));
  assert.equal(cleared.ok,true);
  const effective=await readCapacityOverride(f.db,mkReport(30) as never);
  assert.equal(effective.retainedJh,30);
  assert.equal(effective.manualJh,null);
  assert.equal(effective.source,"Calcul");
  assert.equal(effective.revision,2);
  assert.equal(f.audit.length,2);
  assert.equal(f.audit[1][3],"clear");
  assert.equal(f.audit[1][4],32);
  assert.equal(f.audit[1][5],null);
  assert.equal((await readCapacityOverride(f.db,mkReport(null) as never)).source,
   "Non calculable");
 });
 it("AC5 : bloque correction directe de période figée ou clôturée",async()=>{
  for(const locked of ["frozen","closed"] as const){
   const f=fakeDb();
   await saveCapacityOverride(f.db,actor,set(32));
   f.setLock(locked);
   const beforeCount=f.audit.length;
   const attempted=await saveCapacityOverride(f.db,actor,set(33,1));
   assert.deepEqual(attempted,{ok:false,error:"protected"});
   assert.deepEqual(await saveCapacityOverride(f.db,actor,clear(1)),
    {ok:false,error:"protected"});
   assert.equal(f.audit.length,beforeCount);
   assert.equal(f.row?.manual_jh,32);
   const state=await readCapacityOverride(f.db,mkReport(28) as never);
   assert.equal(state.retainedJh,32);
   assert.equal(locked==="closed"?state.closed:state.frozen,true);
  }
 });
 it("rejette les anciennes révisions et la suppression sans saisie préalable",async()=>{
  const f=fakeDb();
  assert.deepEqual(await saveCapacityOverride(f.db,actor,clear(0)),
   {ok:false,error:"nothing-to-clear"});
  await saveCapacityOverride(f.db,actor,set(31));
  assert.deepEqual(await saveCapacityOverride(f.db,actor,set(32,0)),
   {ok:false,error:"conflict"});
  assert.equal(f.audit.length,1);
 });
 it("rejette périodes, montants et propriétés malformés avant l'ouverture transactionnelle",async()=>{
  for(const payload of [
   set(-1),set(1.00001),set(Number.NaN),set(Number.POSITIVE_INFINITY),
   set(100000000),{...set(1),end:"2026-09-01"},{
    ...set(1),unexpected:true}, {...clear(),manualJh:0},
   {action:"set",start,end,revision:0}
  ]){
   const f=fakeDb();
   assert.deepEqual(await saveCapacityOverride(f.db,actor,payload),
    {ok:false,error:"invalid-input"});
   assert.equal(f.queries.length,0);
  }
 });
 it("mode Calcul sans saisie et Non calculable sans référence",()=>{
  assert.deepEqual(chooseCapacity(mkReport(30)).retainedJh,30);
  assert.equal(chooseCapacity(mkReport(30)).source,"Calcul");
  assert.equal(chooseCapacity(mkReport(null)).retainedJh,null);
  assert.equal(chooseCapacity(mkReport(null)).source,"Non calculable");
 });
 it("ne modifie ni snapshots, ni jours Sprint, ni absences, et réserve l'écriture à l'admin",async()=>{
  const f=fakeDb();
  await saveCapacityOverride(f.db,actor,set(32));
  assert.ok(f.queries.filter(x=>/\bINSERT\b|\bUPDATE\b/i.test(x))
   .every(x=>x.includes("smn_capacity_period_override")));
  const r={type:"members",exists:true,inScope:true};
  assert.equal(canAccess({role:"admin",is_active:true,must_change_password:false},
   "write",r),true);
  assert.equal(canAccess({role:"user",is_active:true,must_change_password:false},
   "write",r),false);
 });
 it("la migration v22 conserve l'historique sans cascade destructive",()=>{
  assert.match(CAPACITY_OVERRIDE_MIGRATION_SQL,/schema_version=22/);
  assert.match(CAPACITY_OVERRIDE_MIGRATION_SQL,/smn_capacity_period_override_history/);
  assert.match(CAPACITY_OVERRIDE_MIGRATION_SQL,/frozen_at timestamptz/);
  assert.match(CAPACITY_OVERRIDE_MIGRATION_SQL,/closed_at timestamptz/);
  assert.doesNotMatch(CAPACITY_OVERRIDE_MIGRATION_SQL,/DROP TABLE|ON DELETE CASCADE/i);
 });
});
