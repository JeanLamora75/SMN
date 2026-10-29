import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import type {CapacityReport} from "../src/server/capacity/engine";
import {readActualCapacity} from "../src/server/capacity/actual";

type Opt={closed?:boolean;withSnapshot?:boolean;manual?:number|null};
function fixture(opt:Opt={}){
 const calls:{sql:string;params:unknown[]}[]=[];
 const client={query:async(sql:string,params:unknown[]=[])=>{
  calls.push({sql,params});
  if(sql.includes("SELECT t.id FROM public.smn_team t JOIN")&&sql.includes("i.schema_version IN (28,29,30,31)"))
   return {rows:[{id:"panda"}]};
  if(sql.includes("AS today"))return {rows:[{today:"2026-10-27"}]};
  if(sql.includes("FROM public.smn_capacity_period_override"))
   return {rows:[{id:"panda_period",closed_at:opt.closed?"2026-10-25":null}]};
  if(sql.includes("FROM public.smn_capacity_actual_snapshot"))return {
   rows:opt.withSnapshot?[{retained_jh:12,reference_jh:11,provenance:"Saisie",
    closed_at:"2026-10-25",event_id:"event-panda"}]:[]};
  if(sql.includes("FROM public.smn_capacity_actual_override"))
   return {rows:[{id:"panda_actual",manual_jh:opt.manual??null,revision:3}]};
  if(sql.includes("FROM public.smn_capacity_initial_snapshot"))return {rows:[]};
  return {rows:[]};
 }} as unknown as Client;
 return {client,calls};
}
test("lecture v28 : calcul de capacité limité à teamId et transaction READ ONLY",async()=>{
 const f=fixture({manual:8.5});
 let seen:unknown=null;
 const calculate=async(_db:Client,_s:string,_e:string,options:{
  externalTransaction:true;includeExceptionalImpact?:boolean;teamId?:string
 }):Promise<CapacityReport>=>{
  seen=options;
  return {team:{id:"panda",name:"Panda",mode:"scrum"},
   totalJh:10,missing:[]} as unknown as CapacityReport;
 };
 const result=await readActualCapacity(f.client,"2026-10-01","2026-10-31",
  calculate,{teamId:"panda"});
 assert.equal(result.manualJh,8.5);
 assert.equal(result.referenceJh,10);
 assert.equal(result.retainedJh,8.5);
 assert.deepEqual(seen,{externalTransaction:true,includeExceptionalImpact:true,teamId:"panda"});
 assert.equal(f.calls[0].sql,"BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
 assert.equal(f.calls.at(-1)?.sql,"COMMIT");
 const scope=f.calls.find(c=>c.sql.includes("i.schema_version IN (28,29,30,31)"));
 assert.deepEqual(scope?.params,["panda"]);
 const period=f.calls.find(c=>c.sql.includes("FROM public.smn_capacity_period_override"));
 assert.deepEqual(period?.params,["panda","2026-10-01","2026-10-31"]);
});
test("clôture v28 : snapshot figé, aucun recalcul sur données courantes",async()=>{
 const f=fixture({closed:true,withSnapshot:true});
 let calculateCalled=false;
 const result=await readActualCapacity(f.client,"2026-10-01","2026-10-25",
  async()=>{calculateCalled=true;throw Error("do not calculate");},
  {teamId:"panda"});
 assert.equal(result.status,"closed");
 assert.equal(result.retainedJh,12);
 assert.equal(result.referenceJh,11);
 assert.equal(calculateCalled,false);
});
test("moteur refuse un résultat provenant d'une autre équipe",async()=>{
 const f=fixture();
 await assert.rejects(()=>readActualCapacity(f.client,"2026-10-01","2026-10-31",
  async()=>({team:{id:"other"},totalJh:55,missing:[]} as unknown as CapacityReport),
  {teamId:"panda"}),/actual-team-changed/);
 assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
});
