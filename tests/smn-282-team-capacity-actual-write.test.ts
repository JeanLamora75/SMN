import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {saveTeamActualCapacity} from "../src/server/capacity/team-actual-write";

const actor={accountId:"admin",role:"admin"} as const;
const set={action:"set",start:"2026-10-01",end:"2026-10-31",revision:0,manualJh:14.5};
type Options={teamExists?:boolean;period?:boolean;frozen?:boolean;closed?:boolean;
 previous?:boolean;previousRevision?:number;previousJh?:number|null;
 today?:string;historyFailure?:boolean;duplicate?:boolean};
function fixture(opt:Options={}){
 const queries:{sql:string;params:unknown[]}[]=[];
 const db={query:async(sql:string,params:unknown[]=[])=>{
  queries.push({sql,params});
  if(sql.includes("SELECT a.installation_id,i.schema_version"))return {
   rows:[{installation_id:"singleton",schema_version:28}]};
  if(sql.includes("SELECT t.id AS team_id FROM public.smn_account_team_preference"))
   return {rows:[{team_id:"other"}]};
  if(sql.includes("SELECT p.id AS product_id"))return {
   rows:[{team_id:"panda",team:"Panda",product_id:null,product:null,mode:"scrum"}]};
  if(sql.includes("SELECT t.id FROM public.smn_team t WHERE t.id=$1"))
   return {rows:opt.teamExists===false?[]:[{id:"panda"}]};
  if(sql.includes("AS today"))return {rows:[{today:opt.today??"2026-10-27"}]};
  if(sql.includes("FROM public.smn_capacity_period_override"))
   return {rows:opt.period===false?[]:opt.period===true?
    [{id:"period_panda",closed_at:opt.closed?"2026-10-20":null,
     frozen_at:opt.frozen?"2026-10-20":null}]:[]};
  if(sql.includes("FROM public.smn_capacity_actual_override"))
   return {rows:opt.previous===true?[{
    id:"actual_panda",manual_jh:opt.previousJh===undefined?12:opt.previousJh,
    revision:opt.previousRevision??2
   }]:[]};
  if(sql.includes("INSERT INTO public.smn_capacity_actual_override_history")&&opt.historyFailure)
   throw Error("history-write-failed");
  if(sql.includes("INSERT INTO public.smn_capacity_period_override")&&opt.duplicate)
   throw {code:"23505"};
  return {rows:[],rowCount:1};
 }} as unknown as Client;
 return {db,queries};
}
test("première saisie de l'équipe : transaction, période, valeur et audit",async()=>{
 const f=fixture();
 const result=await saveTeamActualCapacity(f.db,actor,"panda",set);
 assert.deepEqual(result,{ok:true,teamId:"panda",revision:1});
 assert.equal(f.queries[0].sql,"BEGIN");
 assert.equal(f.queries.at(-1)?.sql,"COMMIT");
 const lock=f.queries.find(x=>x.sql.includes("SELECT t.id FROM public.smn_team t WHERE t.id=$1"));
 assert.deepEqual(lock?.params,["panda"]);
 assert.match(lock!.sql,/FOR UPDATE/);
 const period=f.queries.find(x=>x.sql.includes("INSERT INTO public.smn_capacity_period_override"));
 assert.equal(period?.params[1],"panda");
 const actual=f.queries.find(x=>x.sql.includes("INSERT INTO public.smn_capacity_actual_override\n"));
 assert.equal(actual?.params[2],14.5);
 const hist=f.queries.find(x=>x.sql.includes("INSERT INTO public.smn_capacity_actual_override_history"));
 assert.equal(hist?.params[3],"set");
 assert.equal(hist?.params[6],"admin");
});
test("révision existante : mise à jour atomique sans toucher à l'autre équipe",async()=>{
 const f=fixture({period:true,previous:true});
 const result=await saveTeamActualCapacity(f.db,actor,"panda",{...set,revision:2,manualJh:17});
 assert.deepEqual(result,{ok:true,teamId:"panda",revision:3});
 const update=f.queries.find(x=>x.sql.includes("UPDATE public.smn_capacity_actual_override"));
 assert.deepEqual(update?.params,["actual_panda",17,"admin",2]);
 const period=f.queries.find(x=>x.sql.includes("WHERE team_id=$1 AND start_on=$2::date"));
 assert.deepEqual(period?.params,["panda","2026-10-01","2026-10-31"]);
});
test("conflit de révision et correction sur période figée : rollback",async()=>{
 for(const [opt,value,expected] of [
  [{period:true,previous:true},{...set,revision:1},"conflict"],
  [{period:true,closed:true},set,"protected"],
  [{period:true,frozen:true},set,"protected"]
 ] as const){
  const f=fixture(opt);
  assert.deepEqual(await saveTeamActualCapacity(f.db,actor,"panda",value),
   {ok:false,error:expected});
  assert.equal(f.queries.at(-1)?.sql,"ROLLBACK");
  assert.ok(!f.queries.some(x=>x.sql.startsWith("INSERT INTO")));
 }
});
test("effacement : refus sans valeur et audit de remise à null",async()=>{
 const absent=fixture({period:true});
 assert.deepEqual(await saveTeamActualCapacity(absent.db,actor,"panda",
  {action:"clear",start:set.start,end:set.end,revision:0}),
  {ok:false,error:"nothing-to-clear"});
 const f=fixture({period:true,previous:true});
 const r=await saveTeamActualCapacity(f.db,actor,"panda",
  {action:"clear",start:set.start,end:set.end,revision:2});
 assert.deepEqual(r,{ok:true,teamId:"panda",revision:3});
 const hist=f.queries.find(x=>x.sql.includes("INSERT INTO public.smn_capacity_actual_override_history"));
 assert.equal(hist?.params[3],"clear");
 assert.equal(hist?.params[5],null);
});
test("période future et équipe introuvable : aucune écriture",async()=>{
 const future=fixture({today:"2026-09-01"});
 assert.deepEqual(await saveTeamActualCapacity(future.db,actor,"panda",set),
  {ok:false,error:"future-period"});
 const foreign=fixture({teamExists:false});
 assert.deepEqual(await saveTeamActualCapacity(foreign.db,actor,"panda",set),
  {ok:false,error:"team-unavailable"});
 for(const f of [future,foreign]){
  assert.equal(f.queries.at(-1)?.sql,"ROLLBACK");
  assert.ok(!f.queries.some(x=>x.sql.startsWith("INSERT INTO")));
 }
});
test("erreur d'audit et doublon concurrent : rollback",async()=>{
 const f=fixture({historyFailure:true});
 await assert.rejects(()=>saveTeamActualCapacity(f.db,actor,"panda",set),
  /history-write-failed/);
 assert.equal(f.queries.at(-1)?.sql,"ROLLBACK");
 const dup=fixture({duplicate:true});
 assert.deepEqual(await saveTeamActualCapacity(dup.db,actor,"panda",set),
  {ok:false,error:"conflict"});
 assert.equal(dup.queries.at(-1)?.sql,"ROLLBACK");
});
test("user et entrée mal formée : aucune transaction",async()=>{
 const user=fixture();
 assert.deepEqual(await saveTeamActualCapacity(user.db,
  {accountId:"user",role:"user"},"panda",set),{ok:false,error:"invalid-input"});
 assert.equal(user.queries.length,0);
 const bad=fixture();
 assert.deepEqual(await saveTeamActualCapacity(bad.db,actor,"panda",
  {...set,manualJh:-1}),{ok:false,error:"invalid-input"});
 assert.equal(bad.queries.length,0);
});
