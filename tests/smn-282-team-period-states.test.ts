import assert from "node:assert/strict";
import {test} from "node:test";
import type {Client} from "pg";
import {reconcileAuthorizedTeamPeriods} from "../src/server/teams/period-state";

const admin={accountId:"admin",role:"admin"} as const;
type Opt={mode?:"scrum"|"kanban";ready?:boolean;team?:boolean;
 started?:boolean;ended?:boolean;onTime?:boolean;status?:string;
 today?:string;hasOpening?:boolean;manual?:string|null};
function fixture(opt:Opt={}){
 const calls:Array<{sql:string;params:unknown[]}>= [];
 const query=async(sql:string,params:unknown[]=[])=>{
  calls.push({sql,params});
  if(sql.includes("SELECT a.installation_id,i.schema_version"))
   return {rows:[{installation_id:"singleton",schema_version:28}]};
  if(sql.includes("FROM public.smn_account_team_preference p"))
   return {rows:[{team_id:"other"}]};
  if(sql.includes("SELECT p.id AS product_id"))
   return {rows:opt.team===false?[]:[{
    team_id:"panda",team:"Panda",product_id:null,product:null,
    mode:opt.mode??"scrum"
   }]};
  if(sql.includes("to_regclass('public.'||t.name)"))
   return {rows:opt.ready===false?[]:
    [{name:"table1"},{name:"table2"},{name:"table3"}]};
  if(sql.includes("FROM public.smn_sprint s")&&sql.includes("FOR UPDATE OF s"))
   return {rows:[{
    id:"sprint_panda",status:opt.status??"planned",
    start_at:"2026-10-27T09:00:00Z",end_at:"2026-11-10T09:00:00Z",
    has_started:opt.started??true,has_ended:opt.ended??false,
    opening_on_time:opt.onTime??true
   }]};
  if(sql.includes("FROM public.smn_kanban_period p")&&sql.includes("FOR UPDATE OF p"))
   return {rows:[{
    id:"period_panda",status:opt.status??"planned",
    start_on:"2026-10-27",end_on:"2026-11-10",
    today:opt.today??"2026-10-27"
   }]};
  if(sql.includes("FROM public.smn_kanban_capacity_opening")&&sql.includes("FOR UPDATE"))
   return {rows:opt.hasOpening?[{period_id:"period_panda"}]:[]};
  if(sql.includes("manual_jh::text FROM public.smn_capacity_period_override"))
   return {rows:[{manual_jh:opt.manual??"17.5"}]};
  return {rows:[],rowCount:1};
 };
 return {db:{query} as unknown as Client,calls};
}
test("Scrum : ouverture contemporaine, journal commencé et déclencheur J/H",async()=>{
 const f=fixture();
 const result=await reconcileAuthorizedTeamPeriods(f.db,admin,"panda");
 assert.deepEqual(result,{teamId:"panda",mode:"scrum",started:1,finished:0,recovered:0});
 assert.equal(f.calls[0].sql,"BEGIN");
 assert.equal(f.calls.at(-1)?.sql,"COMMIT");
 assert.deepEqual(f.calls.find(x=>x.sql.includes("FOR UPDATE OF s"))?.params,["panda"]);
 assert.ok(f.calls.some(x=>x.sql.includes("INSERT INTO public.smn_sprint_transition")));
 assert.ok(f.calls.some(x=>x.sql.includes("INSERT INTO public.smn_sprint_capacity_trigger")));
 assert.ok(f.calls.some(x=>x.sql.includes("UPDATE public.smn_sprint SET status=$2")&&
  x.params[1]==="active"&&x.params[2]==="panda"));
});
test("Scrum : démarrage découvert tardivement, jamais de capture fictive",async()=>{
 const f=fixture({onTime:false});
 const result=await reconcileAuthorizedTeamPeriods(f.db,admin,"panda");
 assert.equal(result.recovered,1);
 assert.equal(f.calls.some(x=>x.sql.includes("INSERT INTO public.smn_sprint_capacity_trigger")),false);
});
test("Scrum : période terminée à rattraper, début et fin dans l'audit",async()=>{
 const f=fixture({ended:true,onTime:false});
 const result=await reconcileAuthorizedTeamPeriods(f.db,admin,"panda");
 assert.deepEqual([result.started,result.finished,result.recovered],[1,1,1]);
 const names=f.calls.filter(x=>x.sql.includes("INSERT INTO public.smn_sprint_transition"));
 assert.equal(names.length,2);
 assert.deepEqual(names.map(x=>x.params[2]),["2026-10-27T09:00:00Z","2026-11-10T09:00:00Z"]);
 assert.ok(f.calls.some(x=>x.sql.includes("UPDATE public.smn_sprint")&&
  x.params[1]==="finished"));
});
test("Kanban : début réel, ouverture manuelle conservée et audit en une transaction",async()=>{
 const f=fixture({mode:"kanban",manual:"17.5"});
 const result=await reconcileAuthorizedTeamPeriods(f.db,admin,"panda");
 assert.equal(result.started,1);
 assert.equal(result.recovered,0);
 const opening=f.calls.find(x=>x.sql.includes("INSERT INTO public.smn_kanban_capacity_opening"));
 assert.deepEqual(opening?.params,["period_panda","2026-10-27","manual",17.5]);
 assert.ok(f.calls.some(x=>x.sql.includes("INSERT INTO public.smn_kanban_period_transition")));
 assert.equal(f.calls.at(-1)?.sql,"COMMIT");
});
test("Kanban : réconciliation tardive : disponibilité historique nulle, jamais un zéro",async()=>{
 const f=fixture({mode:"kanban",today:"2026-11-12"});
 const result=await reconcileAuthorizedTeamPeriods(f.db,admin,"panda");
 assert.deepEqual([result.started,result.finished,result.recovered],[1,1,1]);
 const opening=f.calls.find(x=>x.sql.includes("INSERT INTO public.smn_kanban_capacity_opening"));
 assert.deepEqual(opening?.params,[
  "period_panda","2026-10-27","historical-unavailable",null
 ]);
 assert.equal(f.calls.some(x=>x.sql.includes("readDevelopmentCapacity")),false);
 assert.equal(f.calls.some(x=>x.sql.includes("manual_jh::text FROM")),false);
});
test("Kanban : une capture existante n'est ni écrasée ni reconstruite",async()=>{
 const f=fixture({mode:"kanban",hasOpening:true});
 const result=await reconcileAuthorizedTeamPeriods(f.db,admin,"panda");
 assert.equal(result.started,1);
 assert.equal(f.calls.some(x=>x.sql.includes("INSERT INTO public.smn_kanban_capacity_opening")),false);
 assert.equal(f.calls.some(x=>x.sql.includes("manual_jh::text FROM")),false);
});
test("Structure absente : rollback, aucune migration implicite",async()=>{
 const f=fixture({ready:false});
 await assert.rejects(()=>reconcileAuthorizedTeamPeriods(f.db,admin,"panda"),
  /team-period-storage-not-ready/);
 assert.equal(f.calls.at(-1)?.sql,"ROLLBACK");
 assert.equal(f.calls.some(x=>/CREATE TABLE|ALTER TABLE|DROP TABLE/i.test(x.sql)),false);
});
test("Compte user : aucune transaction ; équipe étrangère : rollback",async()=>{
 const user=fixture();
 await assert.rejects(()=>reconcileAuthorizedTeamPeriods(user.db,
  {accountId:"user",role:"user"},"panda"),/team-access-forbidden/);
 assert.equal(user.calls.length,0);
 const foreign=fixture({team:false});
 await assert.rejects(()=>reconcileAuthorizedTeamPeriods(foreign.db,
  admin,"panda"),/team-context-unavailable/);
 assert.equal(foreign.calls.at(-1)?.sql,"ROLLBACK");
});
